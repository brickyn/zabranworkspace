import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { loginSchema, registerSchema } from '../validations/auth.validation';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET as string;
// Note: Server will crash at startup (index.ts) if JWT_SECRET is missing — no fallback.

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: validatedData.id },
          { email: validatedData.email }
        ]
      }
    });

    if (existingUser) {
      res.status(400).json({ error: 'User ID or Email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        id: validatedData.id,
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: validatedData.role,
        branchId: validatedData.branchId
      },
      select: { id: true, email: true, name: true, role: true, branchId: true }
    });

    res.status(201).json({ success: true, message: 'User created successfully', data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error as any).errors });
      return;
    }
    res.status(500).json({ error: 'Internal server error during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[LOGIN] Parsing request body');
    const { email, password } = loginSchema.parse(req.body);

    console.log('[LOGIN] Finding user', email);
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        branch: true,
        userRole: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        },
        roleDelegationsTo: {
          where: { isActive: true, validUntil: { gte: new Date() } },
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      console.log('[LOGIN] User not found');
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    console.log('[LOGIN] Comparing password');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('[LOGIN] Invalid password');
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    console.log('[LOGIN] Generating JWT');

    // Resolve permissions from main role and active delegations
    const permissionSet = new Set<string>();
    if (user.userRole) {
      user.userRole.permissions.forEach(rp => permissionSet.add(rp.permission.action));
    }
    user.roleDelegationsTo.forEach(delegation => {
      delegation.role.permissions.forEach(rp => permissionSet.add(rp.permission.action));
    });
    const compiledPermissions = Array.from(permissionSet);
    const resolvedRole = user.userRole?.name || user.role;

    // Generate JWT payload based on API Spec
    const token = jwt.sign(
      { 
        id: user.id, 
        name: user.name,
        role: resolvedRole, 
        branchId: user.branchId,
        permissions: compiledPermissions
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          role: resolvedRole,
          jobTitle: user.jobTitle,
          division: user.division,
          permissions: compiledPermissions,
          branch_id: user.branchId,
          branch_name: user.branch?.name || null
        }
      }
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: (error as any).errors });
      return;
    }
    res.status(500).json({ success: false, error: 'Internal server error during login' });
  }
};

export const generateOverrideToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, action } = req.body;
    if (!email || !password || !action) {
      res.status(400).json({ success: false, error: 'Email, password, and action are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    if (!['Super Admin', 'Owner', 'Manager'].includes(user.role)) {
      res.status(403).json({ success: false, error: 'Unauthorized role for override' });
      return;
    }

    const overrideToken = jwt.sign(
      { id: user.id, role: user.role, action },
      JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.json({ success: true, overrideToken, approverName: user.name });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate override token' });
  }
};
