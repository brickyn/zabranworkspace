import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, month, year } = req.query;
    const whereClause: any = {};
    
    if (branchId && branchId !== 'all') {
      whereClause.branchId = branchId as string;
    }

    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      whereClause.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: { branch: true },
      orderBy: { date: 'desc' }
    });

    res.json({ success: true, data: expenses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch expenses' });
  }
};

export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, amount, category, description, date } = req.body;

    if (!branchId || !amount || !category) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const expense = await prisma.expense.create({
      data: {
        branchId,
        amount: Number(amount),
        category,
        description,
        date: date ? new Date(date) : new Date()
      },
      include: { branch: true }
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to create expense' });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({ where: { id: String(id) } });
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to delete expense' });
  }
};
