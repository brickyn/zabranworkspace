"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'Product ID is required'),
    name: zod_1.z.string().min(1, 'Name is required'),
    brand: zod_1.z.string().optional(),
    model: zod_1.z.string().optional(),
    processor: zod_1.z.string().optional(),
    ram: zod_1.z.string().optional(),
    storage: zod_1.z.string().optional(),
    gpu: zod_1.z.string().optional(),
    screenSize: zod_1.z.string().optional(),
    condition: zod_1.z.string().optional(),
    grade: zod_1.z.string().optional(),
    completeness: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    buyPrice: zod_1.z.number().min(0, 'Buy Price must be positive'),
    sellPrice: zod_1.z.number().min(0, 'Sell Price must be positive'),
    promoPrice: zod_1.z.number().optional().nullable(),
    status: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    serialNumber: zod_1.z.string().optional(), // Optional — SN can be same as product ID or absent
    branchId: zod_1.z.string().min(1, 'Branch ID is required'),
});
exports.updateProductSchema = exports.createProductSchema.partial();
//# sourceMappingURL=product.validation.js.map