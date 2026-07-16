import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getServiceJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, status } = req.query;
    const where: any = {};
    if (branchId && branchId !== 'all') where.branchId = branchId;
    if (status && status !== 'all') where.status = status;

    const jobs = await prisma.serviceJob.findMany({
      where,
      include: { branch: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch service jobs' });
  }
};

export const createServiceJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, customerName, customerPhone, deviceModel, issues, estimatedCost, downPayment, notes } = req.body;

    if (!branchId || !customerName || !deviceModel || !issues) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const job = await prisma.serviceJob.create({
      data: {
        branchId,
        customerName,
        customerPhone,
        deviceModel,
        issues,
        estimatedCost: Number(estimatedCost || 0),
        downPayment: Number(downPayment || 0),
        notes,
        status: 'Antrean'
      }
    });

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to create service job' });
  }
};

export const updateServiceJobStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const data: any = {};
    if (status) data.status = status;
    if (notes) data.notes = notes;
    if (status === 'Selesai' || status === 'Diambil') {
      data.completionDate = new Date();
    }

    const job = await prisma.serviceJob.update({
      where: { id: String(id) },
      data
    });

    res.json({ success: true, data: job });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to update service job' });
  }
};
