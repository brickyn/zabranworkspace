import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getCurrentSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branchId = req.user?.branchId;
    if (!branchId) {
      res.json({ success: true, data: null });
      return;
    }

    const session = await prisma.registerSession.findFirst({
      where: {
        branchId,
        status: 'OPEN'
      }
    });

    if (!session) {
      res.json({ success: true, data: null });
      return;
    }

    // Hitung ekspektasi (expected) dari transaksi
    // Asumsi: Semua transaksi SUCCESS selama sesi ini
    const transactions = await prisma.transaction.findMany({
      where: {
        sessionId: session.id,
        status: { in: ['completed', 'SUCCESS'] } // Tergantung status apa yang digunakan
      }
    });

    let expectedCash = session.startingCash;
    let expectedQris = 0;
    let expectedTransfer = 0;

    for (const trx of transactions) {
      if (trx.paymentMethod === 'Cash' || trx.paymentMethod === 'TUNAI') {
        // Jika ada split payments, ini bisa lebih kompleks. Sederhananya ambil totalAmount.
        expectedCash += trx.totalAmount;
      } else if (trx.paymentMethod === 'QRIS') {
        expectedQris += trx.totalAmount;
      } else if (trx.paymentMethod === 'Transfer') {
        expectedTransfer += trx.totalAmount;
      }
    }

    res.json({
      success: true,
      data: {
        ...session,
        expectedTotals: {
          cash: expectedCash,
          qris: expectedQris,
          transfer: expectedTransfer
        }
      }
    });
  } catch (error: any) {
    console.error('[Session] getCurrentSession Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch current session' });
  }
};

export const openSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startingCash } = req.body;
    const branchId = req.user?.branchId;
    const userId = req.user?.id;

    if (!branchId || !userId) {
      res.status(400).json({ success: false, error: 'Branch ID or User ID missing' });
      return;
    }

    const existingOpenSession = await prisma.registerSession.findFirst({
      where: { branchId, status: 'OPEN' }
    });

    if (existingOpenSession) {
      res.status(400).json({ success: false, error: 'Terdapat sesi kasir yang masih terbuka di cabang ini. Harap tutup sesi terlebih dahulu.' });
      return;
    }

    const newSession = await prisma.registerSession.create({
      data: {
        branchId,
        openedById: userId,
        startingCash: Number(startingCash) || 0
      }
    });

    res.status(201).json({ success: true, data: newSession });
  } catch (error: any) {
    console.error('[Session] openSession Error:', error);
    res.status(500).json({ success: false, error: 'Failed to open session' });
  }
};

export const closeSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { actualCash, actualQris, actualTransfer } = req.body;
    const branchId = req.user?.branchId;
    const userId = req.user?.id;

    if (!branchId || !userId) {
      res.status(400).json({ success: false, error: 'Branch ID or User ID missing' });
      return;
    }

    const session = await prisma.registerSession.findFirst({
      where: { branchId, status: 'OPEN' }
    });

    if (!session) {
      res.status(400).json({ success: false, error: 'Tidak ada sesi terbuka untuk ditutup.' });
      return;
    }

    const updatedSession = await prisma.registerSession.update({
      where: { id: session.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedById: userId,
        actualCash: Number(actualCash) || 0,
        actualQris: Number(actualQris) || 0,
        actualTransfer: Number(actualTransfer) || 0
      }
    });

    res.json({ success: true, data: updatedSession });
  } catch (error: any) {
    console.error('[Session] closeSession Error:', error);
    res.status(500).json({ success: false, error: 'Failed to close session' });
  }
};
