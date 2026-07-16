import { z } from 'zod';

export const createTransactionSchema = z.object({
  id: z.string().min(1, 'Transaction ID is required (e.g. b-001-YYMMDD-001)'),
  branchId: z.string().min(1, 'Branch ID is required'),
  customerId: z.string().optional().nullable(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  subtotal: z.number().min(0, 'Subtotal cannot be negative'),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0, 'Total cannot be negative'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID (SN) is required'),
    price: z.number().min(0, 'Price cannot be negative'),
    discount: z.number().min(0).default(0),
    subtotal: z.number().min(0, 'Subtotal cannot be negative')
  })).min(1, 'At least one item is required in the transaction'),
  promoCode: z.string().optional().nullable(),
  promoCampaignId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  splitPayments: z.array(z.object({
    method: z.string(),
    amount: z.number()
  })).optional().nullable(),
  leadSource: z.string().optional().nullable(),
  closingType: z.string().optional().nullable(),
  overrideToken: z.string().optional().nullable()
});
