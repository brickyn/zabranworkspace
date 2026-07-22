import { Request, Response } from 'express';
import prisma from '../prisma';
import { createTransactionSchema } from '../validations/transaction.validation';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/auth.middleware';
import { broadcastMessage } from '../utils/websocket';
import jwt from 'jsonwebtoken';

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { branch_id, start_date, end_date, status, page, pageSize } = req.query;

    const pageNum = Math.max(1, parseInt(String(page || '1')));
    const limit = Math.min(500, Math.max(1, parseInt(String(pageSize || '50'))));
    const skip = (pageNum - 1) * limit;

    const whereClause: any = {};
    if (branch_id) whereClause.branchId = branch_id as string;
    if (status) whereClause.status = status as string;
    
    // Role-based filtering
    if (req.user && ['Cashier', 'Leader', 'User'].includes(req.user.role) && req.user.branchId) {
      whereClause.branchId = req.user.branchId;
    }

    if (start_date && end_date) {
      whereClause.createdAt = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string),
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          customer: true,
          cashier: { select: { id: true, name: true } },
          items: {
            include: { productItem: { include: { product: true } } }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: whereClause })
    ]);

    res.json({ 
      success: true, 
      data: transactions,
      pagination: { page: pageNum, pageSize: limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validatedData = createTransactionSchema.parse(req.body);
    const cashierId = req.user?.id;
    const branchId = req.user?.branchId || validatedData.branchId;

    // --- REQUIRE OPEN SESSION ---
    const openSession = await prisma.registerSession.findFirst({
      where: { branchId, status: 'OPEN' }
    });

    if (!openSession) {
      res.status(400).json({ success: false, error: 'Buka kasir terlebih dahulu sebelum melakukan transaksi.' });
      return;
    }
    // ----------------------------

    // --- CONDITIONAL APPROVAL ENGINE (Task 5.2) ---
    const productIds = validatedData.items.map(item => item.productId);
    const dbProductItems = await prisma.productItem.findMany({ 
      where: { productId: { in: productIds }, status: 'AVAILABLE', branchId: branchId },
      include: { product: true }
    });
    
    let requiresApproval = false;
    let overrideReason = '';

    if (validatedData.paymentMethod === 'Tempo' || validatedData.paymentMethod === 'Piutang') {
      requiresApproval = true;
      overrideReason = 'Payment method requires manager approval.';
    }

    if (!requiresApproval) {
      for (const item of validatedData.items) {
        const dbItem = dbProductItems.find(p => p.productId === item.productId);
        const dbProduct = dbItem?.product;
        if (dbProduct) {
          const discountPercent = (item.discount / dbProduct.sellPrice) * 100;
          if (discountPercent > 20) {
            requiresApproval = true;
            overrideReason = 'Discount exceeds 20%. Requires manager approval.';
            break;
          }
        }
      }
    }

    if (requiresApproval) {
      if (!validatedData.overrideToken) {
        res.status(403).json({ success: false, error: overrideReason, requiresApproval: true });
        return;
      }
      
      // Validate override token
      try {
        const decoded = jwt.verify(validatedData.overrideToken, process.env.JWT_SECRET as string) as any;
        if (!['Super Admin', 'Owner', 'Manager'].includes(decoded.role)) {
          throw new Error('Invalid role');
        }
      } catch (err) {
        res.status(403).json({ success: false, error: 'Invalid or expired override token.' });
        return;
      }
    }
    // ----------------------------------------------

    // Execute in a transaction to ensure ACID compliance
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock and decrement products to prevent Double Selling
      const selectedProductItemIds = new Map<string, string>(); // to map item.productId to dbItem.id for TransactionItem

      for (const item of validatedData.items) {
        const productItem = await tx.productItem.findFirst({
          where: {
            productId: item.productId,
            status: 'AVAILABLE',
            branchId: branchId
          },
          orderBy: { createdAt: 'asc' } // FIFO
        });

        if (!productItem || productItem.qty < item.qty) {
          throw new Error(`Produk tidak tersedia dalam jumlah yang cukup.`);
        }

        const newQty = productItem.qty - item.qty;
        await tx.productItem.update({
          where: { id: productItem.id },
          data: {
            qty: newQty,
            status: newQty === 0 ? 'SOLD' : 'AVAILABLE'
          }
        });

        selectedProductItemIds.set(item.productId, productItem.id);
      }

      // 2. Handle Customer (Create if necessary)
      let finalCustomerId = validatedData.customerId;
      if (!finalCustomerId && validatedData.customerName) {
        // Try to find existing customer by phone or name to prevent duplicates
        let existingCustomer = null;
        if (validatedData.customerPhone) {
          existingCustomer = await tx.customer.findFirst({ where: { phone: validatedData.customerPhone } });
        }
        if (!existingCustomer) {
          existingCustomer = await tx.customer.findFirst({ where: { name: validatedData.customerName } });
        }
        
        if (existingCustomer) {
          finalCustomerId = existingCustomer.id;
        } else {
          const newCustomer = await tx.customer.create({
            data: {
              name: validatedData.customerName,
              phone: validatedData.customerPhone,
              points: 0
            }
          });
          finalCustomerId = newCustomer.id;
        }
      }

      // 3. Create Transaction Header
      const transaction = await tx.transaction.create({
        data: {
          id: validatedData.id,
          branchId: branchId,
          sessionId: openSession.id,
          customerId: finalCustomerId,
          cashierId: cashierId,
          totalAmount: validatedData.total,
          discount: validatedData.discount,
          paymentMethod: validatedData.paymentMethod,
          splitPayments: validatedData.splitPayments || undefined,
          promoCampaignId: validatedData.promoCampaignId || undefined,
          notes: validatedData.notes || undefined,
          leadSource: validatedData.leadSource || undefined,
          closingType: validatedData.closingType || undefined,
          status: 'completed',
          items: {
            create: validatedData.items.map(item => {
              const productItemId = selectedProductItemIds.get(item.productId);
              return {
                productItemId: productItemId!,
                qty: item.qty,
                sellingPrice: item.price,
                discount: item.discount,
                subtotal: item.subtotal
              };
            })
          }
        },
        include: {
          items: {
            include: { productItem: { include: { product: true } } }
          },
          customer: true
        }
      });

      // 4. Create Warranty if applicable
      for (const item of transaction.items) {
        const product = item.productItem.product;
        if (product && product.durasiGaransi && product.satuanGaransi) {
          const startDate = new Date();
          let endDate = new Date();
          
          if (product.satuanGaransi.toLowerCase() === 'hari') {
            endDate.setDate(endDate.getDate() + product.durasiGaransi);
          } else if (product.satuanGaransi.toLowerCase() === 'minggu') {
            endDate.setDate(endDate.getDate() + (product.durasiGaransi * 7));
          } else if (product.satuanGaransi.toLowerCase() === 'bulan') {
            endDate.setMonth(endDate.getMonth() + product.durasiGaransi);
          } else if (product.satuanGaransi.toLowerCase() === 'tahun') {
            endDate.setFullYear(endDate.getFullYear() + product.durasiGaransi);
          }

          await tx.warranty.create({
            data: {
              transactionItemId: item.id,
              customerName: validatedData.customerName || transaction.customer?.name || 'Unknown Customer',
              customerPhone: validatedData.customerPhone || transaction.customer?.phone || null,
              startDate,
              endDate,
              type: `${product.durasiGaransi} ${product.satuanGaransi}`,
              status: 'Active'
            }
          });
        }
      }

      // 5. Update Promo Usage Count if a voucher code was used
      if (validatedData.promoCode) {
        await tx.promoCampaign.update({
          where: { voucherCode: validatedData.promoCode },
          data: { usageCount: { increment: 1 } }
        });
      }

      // 6. Create Audit Log
      await tx.log.create({
        data: {
          userId: cashierId,
          action: 'CREATE_TRANSACTION',
          details: `Processed transaction ${transaction.id} for total ${transaction.totalAmount}`
        }
      });

      return transaction;
    });
    
    // Broadcast real-time update to connected clients (e.g. Dashboard)
    broadcastMessage('NEW_TRANSACTION', { branchId: result.branchId, total: result.totalAmount });

    res.status(201).json({ success: true, message: 'Transaction successful', data: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: (error as any).errors });
      return;
    }
    // Handle Custom Thrown Errors inside $transaction
    if (error.message && (error.message.includes('not found') || error.message.includes('available') || error.message.includes('branch'))) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, error: 'Transaction ID already exists' });
      return;
    }
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to process transaction' });
  }
};

export const voidTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { managerPin, reason } = req.body;
    
    if (!managerPin || !reason) {
      res.status(400).json({ success: false, error: 'Manager PIN dan Alasan Void wajib diisi.' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Validasi PIN Manajer
      const manager = await tx.user.findFirst({
        where: {
          authPin: managerPin,
          isActive: true,
          OR: [
            { role: 'Manager' },
            { role: 'Leader' },
            { role: 'Super Admin' },
            { role: 'Owner' }
          ]
        }
      });

      if (!manager) {
        throw new Error('UNAUTHORIZED_PIN');
      }

      // 2. Fetch Transaction
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!transaction) throw new Error('Transaction not found');
      if (transaction.status === 'void' || transaction.status === 'voided') {
        throw new Error('Transaction is already voided');
      }

      // 3. Update Transaction status
      const updatedTx = await tx.transaction.update({
        where: { id },
        data: { 
          status: 'void',
          voidedById: manager.id,
          voidReason: reason,
          voidedAt: new Date()
        }
      });

      // 4. Revert Product Status (Kembalikan ke Available)
      if (transaction.items && transaction.items.length > 0) {
        const productItemIds = transaction.items.map((item: any) => item.productItemId);
        await tx.productItem.updateMany({
          where: { id: { in: productItemIds } },
          data: { status: 'AVAILABLE' }
        });
      }

      // 5. Log action
      await tx.log.create({
        data: {
          userId: manager.id,
          action: 'VOID_TRANSACTION',
          entityType: 'Transaction',
          entityId: id,
          details: `Voided transaction ${id} by ${manager.name}. Reason: ${reason}`,
          ipAddress: req.ip || null
        }
      });

      // Create Notification for Super Admin
      await tx.notification.create({
        data: {
          type: 'VOID_TRANSACTION',
          title: 'Transaksi Di-void',
          message: `Transaksi ${id} dibatalkan oleh ${manager.name}. Alasan: ${reason}`,
          referenceId: id,
          targetRole: 'Management'
        }
      });

      return updatedTx;
    });

    broadcastMessage('TRANSACTION_VOIDED', { id: result.id, branchId: result.branchId });
    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED_PIN') {
      res.status(401).json({ success: false, error: 'PIN salah atau Anda tidak memiliki akses otorisasi.' });
      return;
    }
    res.status(400).json({ success: false, error: error.message || 'Failed to void transaction' });
  }
};

export const returnTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { reason, returnToStock } = req.body;
    const cashierId = req.user?.id;

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: { items: true }
      }) as any;

      if (!transaction) {
        throw new Error('Transaction not found');
      }
      if (transaction.status === 'returned' || transaction.status === 'void') {
        throw new Error(`Transaction is already ${transaction.status}`);
      }

      // Update Transaction status
      const updatedTx = await tx.transaction.update({
        where: { id },
        data: { status: 'returned', returnReason: reason, returnedAt: new Date() }
      });

      // Handle stock and warranty
      for (const item of transaction.items) {
        if (returnToStock) {
          await tx.productItem.update({
            where: { id: item.productItemId },
            data: { status: 'AVAILABLE' }
          });
        }

        // Void warranty if exists
        await tx.warranty.updateMany({
          where: { transactionItemId: item.id },
          data: { status: 'Void' }
        });
      }

      // Deduct Customer Points if customer exists
      if (transaction.customerId) {
        const deductedPoints = Math.floor(transaction.totalAmount / 100000);
        if (deductedPoints > 0) {
          await tx.customer.update({
            where: { id: transaction.customerId },
            data: { points: { decrement: deductedPoints } }
          });
        }
      }

      // Audit Log
      await tx.log.create({
        data: {
          userId: cashierId || 'system',
          action: 'RETURN_TRANSACTION',
          entityType: 'Transaction',
          entityId: id,
          details: `Returned transaction ${id}. Reason: ${reason}`,
          ipAddress: req.ip || null
        }
      });

      return updatedTx;
    });

    res.json({ success: true, message: 'Transaction returned successfully', data: result });
  } catch (error: any) {
    console.error(error);
    if (error.message && (error.message.includes('not found') || error.message.includes('already'))) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to return transaction' });
  }
};
