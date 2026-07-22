import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AuditLogger } from '../services/AuditLogger';

export const getSuppliers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch suppliers' });
  }
};

export const createSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, contact, address } = req.body;
    const supplier = await prisma.supplier.create({
      data: { name, contact, address }
    });

    await AuditLogger.log({
      req,
      action: 'CREATE_SUPPLIER',
      entityType: 'Supplier',
      entityId: supplier.id,
      details: `Created supplier: ${name}`
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create supplier' });
  }
};

export const getPurchases = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId } = req.query;
    let whereClause: any = {};
    if (branchId && branchId !== 'all') {
      whereClause.branchId = branchId as string;
    }

    const purchases = await prisma.purchaseOrder.findMany({
      where: whereClause,
      include: {
        supplier: true,
        branch: true,
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: purchases });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch purchases' });
  }
};

export const createPurchase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { supplierId, branchId, items } = req.body; // items is array of PurchaseOrderItem
    
    if (!items || items.length === 0) {
      res.status(400).json({ success: false, error: 'Items cannot be empty' });
      return;
    }

    let totalAmount = 0;
    const poItems = items.map((item: any) => {
      const sub = item.buyPrice * item.quantity;
      totalAmount += sub;
      return {
        name: item.name,
        category: item.category,
        brand: item.brand,
        buyPrice: item.buyPrice,
        sellPrice: item.sellPrice,
        quantity: item.quantity,
        subtotal: sub
      };
    });

    const po = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        branchId,
        totalAmount,
        status: 'pending',
        items: {
          create: poItems
        }
      },
      include: { items: true, supplier: true, branch: true }
    });

    res.status(201).json({ success: true, data: po });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to create purchase order' });
  }
};

export const completePurchase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userRole = req.user?.role;
    const userBranchId = req.user?.branchId;

    // 1. Validasi Multi-Tenant / Branch Isolation (Mencegah IDOR)
    const po = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        // Jika bukan Super Admin, paksa filter berdasarkan branchId user
        ...(userRole !== 'Super Admin' && { branchId: userBranchId })
      },
      include: { items: true }
    });

    if (!po) {
      res.status(404).json({ success: false, error: 'PO tidak ditemukan atau Anda tidak memiliki akses ke cabang ini' });
      return;
    }

    // Persiapkan data produk yang akan dimasukkan ke inventaris
    const productsToCreate = [];
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD

    for (const item of po.items) {
      for (let i = 0; i < item.quantity; i++) {
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        productsToCreate.push({
          id: `PO-${datePrefix}-${randomStr}`,
          name: item.name,
          category: item.category,
          brand: item.brand,
          buyPrice: item.buyPrice,
          sellPrice: item.sellPrice,
          status: 'Available',
          branchId: po.branchId // Aman karena kepemilikan cabang sudah divalidasi
        });
      }
    }

    // 2. Optimistic Locking & Atomic Update (Mencegah Race Condition/TOCTOU)
    await prisma.$transaction(async (tx) => {
      // Coba perbarui PO HANYA JIKA statusnya saat ini masih 'pending'
      const updatedPo = await tx.purchaseOrder.updateMany({
        where: { 
          id: String(id),
          status: 'pending' 
        },
        data: { status: 'completed' }
      });

      // Jika count === 0, berarti PO sudah tidak 'pending' (mungkin baru saja diselesaikan transaksi lain)
      if (updatedPo.count === 0) {
        throw new Error('PO sudah diproses atau dibatalkan oleh transaksi lain.');
      }

      // Jika update berhasil (count > 0), masukkan produk ke database
      if (productsToCreate.length > 0) {
        await tx.product.createMany({
          data: productsToCreate
        });
      }
    });

    res.json({ success: true, message: `PO Completed. ${productsToCreate.length} items added to inventory.` });
  } catch (error: any) {
    console.error('[Complete PO Error]', error);
    if (error.message === 'PO sudah diproses atau dibatalkan oleh transaksi lain.') {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to complete PO' });
  }
};

export const cancelPurchase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const po: any = await prisma.purchaseOrder.findUnique({
      where: { id }
    });

    if (!po) {
      res.status(404).json({ success: false, error: 'PO not found' });
      return;
    }

    if (po.status === 'cancelled') {
      res.status(400).json({ success: false, error: 'PO is already cancelled' });
      return;
    }

    if (po.status === 'completed') {
      res.status(400).json({ success: false, error: 'Cannot cancel a completed PO' });
      return;
    }

    await prisma.purchaseOrder.update({
      where: { id: String(id) },
      data: { status: 'cancelled' }
    });

    res.json({ success: true, message: `PO Cancelled successfully.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to cancel PO' });
  }
};
