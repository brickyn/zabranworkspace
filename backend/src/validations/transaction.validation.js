"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransactionSchema = void 0;
const zod_1 = require("zod");
exports.createTransactionSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'Transaction ID is required (e.g. b-001-YYMMDD-001)'),
    branchId: zod_1.z.string().min(1, 'Branch ID is required'),
    customerId: zod_1.z.string().optional().nullable(),
    customerName: zod_1.z.string().optional(),
    customerPhone: zod_1.z.string().optional(),
    subtotal: zod_1.z.number().min(0, 'Subtotal cannot be negative'),
    discount: zod_1.z.number().min(0).default(0),
    tax: zod_1.z.number().min(0).default(0),
    total: zod_1.z.number().min(0, 'Total cannot be negative'),
    paymentMethod: zod_1.z.string().min(1, 'Payment method is required'),
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string().min(1, 'Product ID (SN) is required'),
        price: zod_1.z.number().min(0, 'Price cannot be negative'),
        discount: zod_1.z.number().min(0).default(0),
        subtotal: zod_1.z.number().min(0, 'Subtotal cannot be negative')
    })).min(1, 'At least one item is required in the transaction'),
    promoCode: zod_1.z.string().optional().nullable(),
    promoCampaignId: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
    splitPayments: zod_1.z.array(zod_1.z.object({
        method: zod_1.z.string(),
        amount: zod_1.z.number()
    })).optional().nullable(),
    overrideToken: zod_1.z.string().optional().nullable()
});
//# sourceMappingURL=transaction.validation.js.map