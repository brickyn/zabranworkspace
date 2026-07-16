import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getWarranties = async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: String(search), mode: 'insensitive' } },
        { customerPhone: { contains: String(search), mode: 'insensitive' } },
        { transactionItem: { product: { name: { contains: String(search), mode: 'insensitive' } } } },
        { transactionItem: { product: { id: { contains: String(search), mode: 'insensitive' } } } }
      ];
    }

    const warranties = await prisma.warranty.findMany({
      where,
      include: {
        transactionItem: {
          include: {
            product: { select: { id: true, name: true } },
            transaction: { select: { branch: { select: { name: true } } } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: warranties });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch warranties' });
  }
};

export const updateWarrantyStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    const warranty = await prisma.warranty.update({
      where: { id },
      data: { status }
    });

    res.json({ success: true, data: warranty });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to update warranty' });
  }
};
