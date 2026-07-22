import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').trim(),
});

export const registerSchema = z.object({
  id: z.string().min(1, 'User ID is required (e.g. 100123)'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.string().default('Cashier'),
  branchId: z.string().optional().nullable(),
});
