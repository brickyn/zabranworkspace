import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

export const getEODSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.user?.id;
    if (!cashierId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Get the last EOD for this cashier today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const lastEOD = await prisma.endOfDay.findFirst({
      where: { cashierId, date: { gte: startOfDay } },
      orderBy: { createdAt: 'desc' }
    });

    const sinceDate = lastEOD ? lastEOD.createdAt : startOfDay;

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        cashierId,
        createdAt: { gt: sinceDate },
        status: { in: ['completed'] }
      }
    });

    let expectedCash = 0;
    let expectedTransfer = 0;

    transactions.forEach(tx => {
      // Split payments could exist
      if (tx.splitPayments && Array.isArray(tx.splitPayments)) {
        tx.splitPayments.forEach((split: any) => {
          if (split.method.toLowerCase() === 'cash') {
            expectedCash += split.amount;
          } else {
            expectedTransfer += split.amount;
          }
        });
      } else {
        if (tx.paymentMethod.toLowerCase() === 'cash') {
          expectedCash += tx.totalAmount;
        } else {
          expectedTransfer += tx.totalAmount;
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalTransactions: transactions.length,
        expectedCash,
        expectedTransfer
      }
    });
  } catch (error: any) {
    console.error('[EOD SUMMARY ERROR]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const submitEOD = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cashierId = req.user?.id;
    const branchId = req.user?.branchId;
    if (!cashierId || !branchId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { expectedCash, actualCash, expectedTransfer, actualTransfer, totalTransactions, notes } = req.body;
    
    // Variance = Actual - Expected
    const variance = (Number(actualCash) - Number(expectedCash)) + (Number(actualTransfer) - Number(expectedTransfer));

    const eod = await prisma.endOfDay.create({
      data: {
        cashierId,
        branchId,
        date: new Date(),
        totalTransactions: Number(totalTransactions),
        expectedCash: Number(expectedCash),
        actualCash: Number(actualCash),
        expectedTransfer: Number(expectedTransfer),
        actualTransfer: Number(actualTransfer),
        variance,
        notes
      }
    });

    res.status(201).json({ success: true, data: eod });
  } catch (error: any) {
    console.error('[SUBMIT EOD ERROR]', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
