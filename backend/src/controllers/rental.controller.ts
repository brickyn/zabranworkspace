import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getRentals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, status } = req.query;
    const where: any = {};
    if (branchId && branchId !== 'all') where.branchId = branchId;
    if (status && status !== 'all') where.status = status;

    const rentals = await prisma.rental.findMany({
      where,
      include: { branch: true, product: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: rentals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch rentals' });
  }
};

export const createRental = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, customerName, customerPhone, customerIdentity, productId, startDate, endDate, rentalType, totalFee, deposit, shippingFee, installationFee, otherFee, notes } = req.body;

    if (!branchId || !customerName || !productId || !startDate || !endDate) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    // Update Product Status to "Rented"
    await prisma.product.update({
      where: { id: productId },
      data: { status: 'Rented' }
    });

    const rental = await prisma.rental.create({
      data: {
        branchId,
        customerName,
        customerPhone,
        customerIdentity,
        productId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rentalType: rentalType || 'Harian',
        totalFee: Number(totalFee || 0),
        deposit: Number(deposit || 0),
        shippingFee: Number(shippingFee || 0),
        installationFee: Number(installationFee || 0),
        otherFee: Number(otherFee || 0),
        notes,
        status: 'Active'
      },
      include: { product: true }
    });

    res.status(201).json({ success: true, data: rental });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to create rental' });
  }
};

export const updateRentalStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const rental = await prisma.rental.update({
      where: { id: String(id) },
      data: {
        status,
        ...(notes && { notes })
      }
    });

    if (status === 'Returned') {
      await prisma.product.update({
        where: { id: rental.productId },
        data: { status: 'Available' }
      });
    }

    res.json({ success: true, data: rental });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to update rental' });
  }
};
