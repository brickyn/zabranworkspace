import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import logger from '../utils/logger';

export const resetDummyData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminPassword } = req.body;
    
    // Verify admin password
    // Get user from token payload (injected by authenticateJWT)
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }
    
    const isValid = await bcrypt.compare(adminPassword, user.password);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid admin password' });
      return;
    }
    
    logger.warn(`DANGER: Super Admin ${user.email} initiated database dummy data reset.`);

    await prisma.$transaction(async (tx) => {
      // 1. Transaction & Payment
      await tx.transactionItem.deleteMany();
      await tx.transaction.deleteMany();
      
      // 2. Purchases & Expenses
      await tx.purchaseOrderItem.deleteMany();
      await tx.purchaseOrder.deleteMany();
      await tx.expense.deleteMany();
      
      // 3. Inventory Movements
      await tx.stockOpnameItem.deleteMany();
      await tx.stockOpname.deleteMany();
      await tx.transferOrder.deleteMany();
      await tx.stockTransfer.deleteMany();
      
      // 4. Cash Management
      await tx.cashManagement.deleteMany();
      
      // 5. CRM
      await tx.cRMActivity.deleteMany();
      await tx.cRMDailyReview.deleteMany();
      await tx.cRMMysteryGuest.deleteMany();
      
      // 6. B2B & BSB
      await tx.b2BTransaction.deleteMany();
      await tx.b2BMaintenanceLog.deleteMany();
      await tx.b2BActivity.deleteMany();
      await tx.b2BSchedule.deleteMany();
      
      await tx.bSBTransaction.deleteMany();
      await tx.bSBActivity.deleteMany();
      await tx.bSBExpense.deleteMany();
      
      // 7. Services & Rentals
      await tx.serviceJob.deleteMany();
      await tx.rental.deleteMany();
      await tx.warranty.deleteMany();

      // Reset Product Stocks to 0
      await tx.product.updateMany({
        data: {
          stock: 0,
          status: 'Available' // Assuming status resets to available
        }
      });
    }, {
      timeout: 30000 // allow up to 30s for heavy deletion
    });

    logger.info(`SUCCESS: Database dummy data reset completed by ${user.email}.`);

    res.json({ success: true, message: 'Data dummy berhasil dibersihkan, stok produk kembali ke 0. Master Data tetap dipertahankan.' });
  } catch (error: any) {
    logger.error('Failed to reset dummy data', error);
    res.status(500).json({ success: false, error: 'Failed to reset dummy data', details: error.message });
  }
};
