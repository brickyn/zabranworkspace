import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        jobTitle: true,
        division: true,
        permissions: true,
        branchId: true,
        branch: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

export const getRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const roles = await prisma.role.findMany({
      select: { id: true, name: true, description: true }
    });
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch roles' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: String(req.params.id) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        jobTitle: true,
        division: true,
        permissions: true,
        branchId: true,
        branch: { select: { name: true } }
      }
    });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, email, password, name, role, branchId, jobTitle, division, permissions } = req.body;
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ success: false, error: 'Email already in use' });
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { 
        id: id || String(Math.floor(100000 + Math.random() * 900000)), // Generate 6 digit random ID if none provided
        email, 
        password: hashedPassword, 
        name, 
        role: role || 'User', 
        jobTitle: jobTitle || undefined,
        division: division || undefined,
        permissions: permissions || undefined,
        branchId 
      }
    });
    
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role, branchId, jobTitle, division, permissions } = req.body;
    
    const updateData: any = { name, role, branchId, jobTitle, division, permissions };
    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: String(req.params.id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        jobTitle: true,
        division: true,
        permissions: true,
        branchId: true,
      }
    });
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, error: 'Email already in use' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user has transactions
    const txCount = await prisma.transaction.count({ where: { cashierId: String(req.params.id) } });
    if (txCount > 0) {
      res.status(400).json({ 
        success: false, 
        error: `Cannot delete user because they are linked to ${txCount} transactions.` 
      });
      return;
    }

    await prisma.user.delete({
      where: { id: String(req.params.id) }
    });
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
};
