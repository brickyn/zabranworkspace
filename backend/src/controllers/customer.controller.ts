import { Request, Response } from 'express';
import prisma from '../prisma';

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    
    let whereClause: any = { deletedAt: null };
    if (search) {
      whereClause.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search) } },
        { email: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });

    res.json({ success: true, data: customers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const customer = await prisma.customer.findUnique({
      where: { id: id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer' });
  }
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email } = req.body;
    
    if (!name) {
      res.status(400).json({ success: false, error: 'Name is required' });
      return;
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        points: 0
      }
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to create customer' });
  }
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name, phone, email, points } = req.body;

    const customer = await prisma.customer.update({
      where: { id: id },
      data: {
        name,
        phone,
        email,
        points: points !== undefined ? Number(points) : undefined
      }
    });

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to update customer' });
  }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    
    const customer = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { transactions: true } } }
    }) as any;
    
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }
    
    if (customer._count.transactions > 0) {
      // Soft delete: can't hard delete customers with transactions for data integrity
      await prisma.customer.update({
        where: { id: id },
        data: { deletedAt: new Date() }
      });
      res.json({ success: true, message: 'Customer archived (has transaction history)' });
      return;
    }

    await prisma.customer.delete({ where: { id } });
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to delete customer' });
  }
};
