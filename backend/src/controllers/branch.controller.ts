import { Request, Response } from 'express';
import prisma from '../prisma';

export const getBranches = async (req: Request, res: Response): Promise<void> => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch branches' });
  }
};

export const getBranchById = async (req: Request, res: Response): Promise<void> => {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: String(req.params.id) }
    });
    if (!branch) {
      res.status(404).json({ success: false, error: 'Branch not found' });
      return;
    }
    res.status(200).json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch branch' });
  }
};

export const createBranch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, name, brand, isWarehouse, address, phone } = req.body;
    if (!id || !name) {
      res.status(400).json({ success: false, error: 'Branch ID and Name are required' });
      return;
    }

    const branch = await prisma.branch.create({
      data: { id, name, brand, isWarehouse: !!isWarehouse, address, phone }
    });
    res.status(201).json({ success: true, data: branch });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, error: 'Branch ID already exists' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to create branch' });
  }
};

export const updateBranch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, brand, isWarehouse, address, phone } = req.body;
    const branch = await prisma.branch.update({
      where: { id: String(req.params.id) },
      data: { name, brand, isWarehouse, address, phone }
    });
    res.json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update branch' });
  }
};

export const deleteBranch = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if there are users or products tied to this branch
    const usersCount = await prisma.user.count({ where: { branchId: String(req.params.id) } });
    const productsCount = await prisma.product.count({ where: { branchId: String(req.params.id) } });

    if (usersCount > 0 || productsCount > 0) {
      res.status(400).json({ 
        success: false, 
        error: `Cannot delete branch because it is linked to ${usersCount} users and ${productsCount} products.` 
      });
      return;
    }

    await prisma.branch.delete({
      where: { id: String(req.params.id) }
    });
    res.status(200).json({ success: true, message: 'Branch deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete branch' });
  }
};
