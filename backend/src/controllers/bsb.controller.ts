import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getBSBMetrics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    let whereClause: any = {};
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // Get transactions in range
    const txs = await prisma.bSBTransaction.findMany({ where: whereClause });
    // Get expenses in range
    const exps = await prisma.bSBExpense.findMany({ where: whereClause });
    // Get activities in range
    const acts = await prisma.bSBActivity.findMany({ where: whereClause });
    
    let omzetBsb = 0;
    let bukuTerjual = 0;
    let ebookTerjual = 0;
    let bundlingTerjual = 0;
    let totalBerhasil = 0;
    let totalGagal = 0;

    txs.forEach(t => {
      omzetBsb += t.amount;
      if (t.type === 'Buku Fisik') bukuTerjual += t.qty;
      else if (t.type === 'E-book') ebookTerjual += t.qty;
      else if (t.type === 'Bundling') bundlingTerjual += t.qty;

      if (t.shippingStatus === 'Sukses') totalBerhasil += t.qty;
      else if (t.shippingStatus === 'Gagal/Retur') totalGagal += t.qty;
    });

    const totalExpense = exps.reduce((acc, curr) => acc + curr.amount, 0);

    res.json({
      success: true,
      data: {
        omzetBsb,
        bukuTerjual,
        ebookTerjual,
        bundlingTerjual,
        totalBerhasil,
        totalGagal,
        totalExpense,
        netProfit: omzetBsb - totalExpense,
        totalActivities: acts.length,
        contentCreationCount: acts.filter(a => a.type === 'Pembuatan Konten').length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
  }
};

// Transactions
export const getBSBTransactions = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    let whereClause: any = {};
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }
    const data = await prisma.bSBTransaction.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
};

export const createBSBTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const data = await prisma.bSBTransaction.create({
      data: {
        type: req.body.type,
        qty: Number(req.body.qty) || 1,
        amount: Number(req.body.amount) || 0,
        platform: req.body.platform,
        shippingStatus: req.body.shippingStatus || 'Proses',
        picName: req.body.picName,
        buyerName: req.body.buyerName,
        buyerContact: req.body.buyerContact,
        date: req.body.date ? new Date(req.body.date) : new Date(),
      }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create transaction' });
  }
};

// Activities
export const getBSBActivities = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    let whereClause: any = {};
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }
    const data = await prisma.bSBActivity.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch activities' });
  }
};

export const createBSBActivity = async (req: AuthRequest, res: Response) => {
  try {
    const data = await prisma.bSBActivity.create({
      data: {
        type: req.body.type,
        description: req.body.description,
        picName: req.body.picName,
        title: req.body.title,
        platform: req.body.platform,
        date: req.body.date ? new Date(req.body.date) : new Date(),
      }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create activity' });
  }
};

// Expenses
export const getBSBExpenses = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    let whereClause: any = {};
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }
    const data = await prisma.bSBExpense.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch expenses' });
  }
};

export const createBSBExpense = async (req: AuthRequest, res: Response) => {
  try {
    const data = await prisma.bSBExpense.create({
      data: {
        category: req.body.category,
        amount: Number(req.body.amount) || 0,
        description: req.body.description,
        picName: req.body.picName,
        date: req.body.date ? new Date(req.body.date) : new Date(),
      }
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create expense' });
  }
};
