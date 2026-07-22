import { z } from 'zod';

export const createProductSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  name: z.string().min(1, 'Name is required'),
  brand: z.string().optional(),
  model: z.string().optional(),
  processor: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  gpu: z.string().optional(),
  screenSize: z.string().optional(),
  color: z.string().optional(),
  condition: z.string().optional(),
  grade: z.string().optional(),
  completeness: z.string().optional(),
  description: z.string().optional(),
  buyPrice: z.number().min(0, 'Buy Price must be positive'),
  developmentCost: z.number().min(0).optional(),
  sellPrice: z.number().min(0, 'Sell Price must be positive'),
  promoPrice: z.number().optional().nullable(),
  status: z.string().optional(),
  imageUrl: z.string().optional(),
  category: z.string().optional(),
  serialNumber: z.string().optional(), // Optional — SN can be same as product ID or absent
  branchId: z.string().min(1, 'Branch ID is required'),
});

export const updateProductSchema = createProductSchema.partial();
