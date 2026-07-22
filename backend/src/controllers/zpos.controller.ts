import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

export class ZPOSController {
  
  // Transaction History restricted to ZPOS views
  public getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      // If Cashier, show only their transactions for today.
      // If Leader/Manager/Admin, show store-wide transactions.
      const isCashier = user.role === 'Cashier';
      const today = new Date();
      today.setHours(0,0,0,0);

      const whereClause: any = {};
      
      if (user.branchId) {
        whereClause.branchId = user.branchId;
      }

      if (isCashier) {
        whereClause.cashierId = user.id;
        whereClause.createdAt = { gte: today };
      }

      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          items: {
            include: { productItem: { include: { product: true } } }
          }
        },
        take: 100 // limit to recent 100 for performance
      });

      res.status(200).json({ success: true, data: transactions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // Get Incoming Transfers for Store Receiving
  public getIncomingTransfers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const branchId = req.user?.branchId;
      if (!branchId) {
        res.status(400).json({ success: false, error: 'User does not belong to a branch' });
        return;
      }

      const transfers = await prisma.transferOrder.findMany({
        where: {
          toBranchId: branchId,
          status: { in: ['Dispatched', 'In Transit', 'Partially Received'] }
        },
        include: {
          fromBranch: true,
          items: {
            include: { product: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ success: true, data: transfers });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // Get Transfer History (All transfers for this store)
  public getTransferHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const branchId = req.user?.branchId;
      if (!branchId) {
        res.status(400).json({ success: false, error: 'User does not belong to a branch' });
        return;
      }

      const transfers = await prisma.transferOrder.findMany({
        where: {
          OR: [
            { toBranchId: branchId },
            { fromBranchId: branchId }
          ]
        },
        include: {
          fromBranch: true,
          toBranch: true,
          items: {
            include: { product: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      res.status(200).json({ success: true, data: transfers });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // Transfer Detail
  public getTransferDetail = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const transfer = await prisma.transferOrder.findUnique({
        where: { id },
        include: {
          fromBranch: true,
          toBranch: true,
          items: {
            include: { product: true }
          }
        }
      });

      if (!transfer) {
        res.status(404).json({ success: false, error: 'Transfer not found' });
        return;
      }

      res.status(200).json({ success: true, data: transfer });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // Receive Goods & Report Discrepancy
  public receiveTransfer = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { items } = req.body; // Array of { stockTransferId, receivedStatus, discrepancyNotes }
      const userId = req.user?.id;

      const transfer = await prisma.transferOrder.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!transfer) {
        res.status(404).json({ success: false, error: 'Transfer not found' });
        return;
      }

      let allReceived = true;
      let hasDiscrepancy = false;

      // Wrap in a transaction
      await prisma.$transaction(async (tx) => {
        for (const inputItem of items) {
          const { stockTransferId, receivedStatus, discrepancyNotes } = inputItem;
          
          const updatedItem = await tx.stockTransfer.update({
            where: { id: stockTransferId },
            data: {
              receivedStatus,
              discrepancyNotes
            }
          });

          if (receivedStatus === 'Received') {
            // Update stock logic would go here.
            // ZPOS just updates inventory at the store.
            const inventory = await tx.inventory.findFirst({
              where: { productId: updatedItem.productId, branchId: transfer.toBranchId }
            });
            if (inventory) {
              await tx.inventory.update({
                where: { id: inventory.id },
                data: { stock: { increment: 1 } }
              });
            } else {
              await tx.inventory.create({
                data: {
                  productId: updatedItem.productId,
                  branchId: transfer.toBranchId,
                  stock: 1
                }
              });
            }
            await tx.stockTransfer.update({
              where: { id: stockTransferId },
              data: { status: 'Received' }
            });
          } else if (receivedStatus !== 'Pending') {
            hasDiscrepancy = true;
          }

          if (receivedStatus === 'Pending') {
            allReceived = false;
          }
        }

        let newStatus = transfer.status;
        if (hasDiscrepancy) {
          newStatus = 'Partially Received';
        } else if (allReceived) {
          newStatus = 'Received';
        }

        await tx.transferOrder.update({
          where: { id: transfer.id },
          data: {
            status: newStatus,
            receivedBy: userId,
            receivedAt: new Date()
          }
        });
      });

      res.status(200).json({ success: true, message: 'Transfer receiving processed' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // Sales Dashboard (ZPOS)
  public getSalesDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const branchId = req.user?.branchId;
      if (!branchId) {
        res.status(400).json({ success: false, error: 'User does not belong to a branch' });
        return;
      }

      const today = new Date();
      today.setHours(0,0,0,0);

      const [todayTransactions, totalTransactions] = await Promise.all([
        prisma.transaction.findMany({
          where: { branchId, createdAt: { gte: today }, status: 'completed' }
        }),
        prisma.transaction.findMany({
          where: { branchId, status: 'completed' }
        })
      ]);

      const revenueToday = todayTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
      const unitsSoldToday = todayTransactions.reduce((sum, tx) => sum + (tx.totalItems || 0), 0);

      const totalRevenue = totalTransactions.reduce((sum, tx) => sum + tx.totalAmount, 0);

      res.status(200).json({
        success: true,
        data: {
          revenueToday,
          unitsSoldToday,
          transactionCountToday: todayTransactions.length,
          totalRevenue,
          totalTransactionCount: totalTransactions.length
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
