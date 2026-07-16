"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeleteProducts = exports.bulkUpdateProducts = exports.importBulkProducts = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const product_validation_1 = require("../validations/product.validation");
const zod_1 = require("zod");
const getProducts = async (req, res) => {
    try {
        const { status, brand, search, page, pageSize, branchId } = req.query;
        const pageNum = Math.max(1, parseInt(String(page || '1')));
        const limit = Math.min(200, Math.max(1, parseInt(String(pageSize || '100')))); // Max 200 per page
        const skip = (pageNum - 1) * limit;
        const user = req.user;
        let whereClause = {
            deletedAt: null // Exclude soft-deleted products
        };
        // Automatically restrict to user's branch if they are not higher management
        if (user && !['Super Admin', 'Management', 'Manager', 'Finance'].includes(user.role)) {
            whereClause.branchId = user.branchId;
        }
        else if (branchId && branchId !== 'all') {
            whereClause.branchId = branchId;
        }
        if (status)
            whereClause.status = status;
        if (brand)
            whereClause.brand = brand;
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { id: { contains: search, mode: 'insensitive' } },
                { serialNumber: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
            ];
        }
        // Branch Isolation Logic
        if (req.user && ['Cashier', 'Leader'].includes(req.user.role) && req.user.branchId) {
            whereClause.branchId = req.user.branchId;
        }
        const [products, total, categoryCounts] = await Promise.all([
            prisma_1.default.product.findMany({
                where: whereClause,
                include: { branch: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.default.product.count({ where: whereClause }),
            prisma_1.default.product.groupBy({
                by: ['category'],
                where: whereClause,
                _count: { id: true }
            })
        ]);
        const summary = categoryCounts.reduce((acc, curr) => {
            const cat = curr.category || 'Laptop';
            acc[cat] = (acc[cat] || 0) + curr._count.id;
            return acc;
        }, {});
        res.json({
            success: true,
            data: products,
            summary,
            pagination: { page: pageNum, pageSize: limit, total, totalPages: Math.ceil(total / limit) }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch products' });
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await prisma_1.default.product.findUnique({
            where: { id },
            include: { branch: true }
        });
        if (!product) {
            res.status(404).json({ success: false, error: 'Product not found' });
            return;
        }
        // Branch Isolation
        if (req.user && ['Cashier', 'Leader'].includes(req.user.role) && req.user.branchId) {
            if (product.branchId !== req.user.branchId) {
                res.status(403).json({ success: false, error: 'Forbidden: Product belongs to another branch' });
                return;
            }
        }
        res.json({ success: true, data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch product' });
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res) => {
    try {
        const validatedData = product_validation_1.createProductSchema.parse(req.body);
        // Only Admin or Super Admin can create products (or if you want to allow leaders)
        // You can enforce this via Role Middleware in routes, but here is an extra check:
        if (req.user && req.user.role === 'Cashier') {
            res.status(403).json({ success: false, error: 'Cashier cannot add master products' });
            return;
        }
        const product = await prisma_1.default.product.create({
            data: validatedData,
        });
        res.status(201).json({ success: true, message: 'Product created', data: product });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, error: error.errors });
            return;
        }
        if (error.code === 'P2002') {
            res.status(400).json({ success: false, error: 'ID Produk sudah terdaftar (Duplicate)' });
            return;
        }
        if (error.code === 'P2003') {
            res.status(400).json({ success: false, error: 'Invalid Branch ID' });
            return;
        }
        res.status(500).json({ success: false, error: 'Failed to create product' });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const validatedData = product_validation_1.updateProductSchema.parse(req.body);
        const product = await prisma_1.default.product.update({
            where: { id },
            data: validatedData,
        });
        res.json({ success: true, message: 'Product updated', data: product });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, error: error.errors });
            return;
        }
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, error: 'Product not found' });
            return;
        }
        res.status(500).json({ success: false, error: 'Failed to update product' });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;
        // Enforce role
        if (req.user && req.user.role === 'Cashier') {
            res.status(403).json({ success: false, error: 'Cashier cannot delete products' });
            return;
        }
        // Check if product has transaction history — prevent orphan data
        const hasHistory = await prisma_1.default.transactionItem.findFirst({ where: { productId: id } });
        if (hasHistory) {
            // Soft delete — keep record for audit trail
            await prisma_1.default.product.update({ where: { id }, data: { deletedAt: new Date() } });
            res.status(200).json({ success: true, message: 'Product archived (has transaction history)' });
            return;
        }
        // Hard delete only if no transaction history
        await prisma_1.default.product.delete({ where: { id } });
        // Audit log
        await prisma_1.default.log.create({
            data: {
                userId: req.user?.id,
                action: 'DELETE_PRODUCT',
                entityType: 'Product',
                entityId: id,
                details: `Product ${id} deleted`,
                ipAddress: req.ip || null
            }
        });
        res.status(200).json({ success: true, message: 'Product deleted' });
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ success: false, error: 'Product not found' });
            return;
        }
        res.status(500).json({ success: false, error: 'Failed to delete product' });
    }
};
exports.deleteProduct = deleteProduct;
const importBulkProducts = async (req, res) => {
    try {
        const products = req.body.products;
        if (!Array.isArray(products) || products.length === 0) {
            res.status(400).json({ success: false, error: 'Invalid or empty products array' });
            return;
        }
        if (req.user && req.user.role === 'Cashier') {
            res.status(403).json({ success: false, error: 'Cashier cannot import products' });
            return;
        }
        // Process and validate all products
        const validProducts = [];
        const errors = [];
        for (let i = 0; i < products.length; i++) {
            try {
                const validated = product_validation_1.createProductSchema.parse(products[i]);
                validProducts.push(validated);
            }
            catch (err) {
                errors.push({ row: i + 1, error: err });
            }
        }
        if (errors.length > 0) {
            res.status(400).json({ success: false, error: 'Validation failed for some rows', details: errors });
            return;
        }
        // Check for duplicate IDs in the incoming array itself
        const idsInArray = validProducts.map(p => p.id);
        const uniqueIds = new Set(idsInArray);
        if (uniqueIds.size !== idsInArray.length) {
            const duplicatesInArray = idsInArray.filter((item, index) => idsInArray.indexOf(item) !== index);
            res.status(400).json({
                success: false,
                error: 'Terdapat ID Produk ganda di dalam file yang diunggah.',
                details: Array.from(new Set(duplicatesInArray))
            });
            return;
        }
        // Check for duplicate IDs in the database
        const existingProducts = await prisma_1.default.product.findMany({
            where: { id: { in: idsInArray } },
            select: { id: true }
        });
        if (existingProducts.length > 0) {
            res.status(400).json({
                success: false,
                error: 'ID Produk berikut sudah terdaftar di database (Duplicate ID).',
                details: existingProducts.map(p => p.id)
            });
            return;
        }
        // Insert all products since there are no duplicates
        const results = await prisma_1.default.product.createMany({
            data: validProducts,
            skipDuplicates: false, // We already checked for duplicates
        });
        res.status(200).json({ success: true, message: `${results.count} products imported successfully` });
    }
    catch (error) {
        console.error("Bulk Import Error:", error);
        res.status(500).json({ success: false, error: 'Failed to import products', details: error.message || error });
    }
};
exports.importBulkProducts = importBulkProducts;
const bulkUpdateProducts = async (req, res) => {
    try {
        const { ids, updateData } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ success: false, error: 'No product IDs provided' });
            return;
        }
        if (req.user && req.user.role === 'Cashier') {
            res.status(403).json({ success: false, error: 'Cashier cannot update products' });
            return;
        }
        const result = await prisma_1.default.product.updateMany({
            where: { id: { in: ids } },
            data: updateData
        });
        res.status(200).json({ success: true, message: `${result.count} products updated successfully` });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to bulk update products' });
    }
};
exports.bulkUpdateProducts = bulkUpdateProducts;
const bulkDeleteProducts = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ success: false, error: 'No product IDs provided' });
            return;
        }
        if (req.user && req.user.role === 'Cashier') {
            res.status(403).json({ success: false, error: 'Cashier cannot delete products' });
            return;
        }
        // Soft delete all — safest approach for bulk ops to preserve history
        const result = await prisma_1.default.product.updateMany({
            where: { id: { in: ids } },
            data: { deletedAt: new Date() }
        });
        // Audit log
        await prisma_1.default.log.create({
            data: {
                userId: req.user?.id,
                action: 'BULK_DELETE_PRODUCT',
                entityType: 'Product',
                details: `Bulk soft-deleted ${result.count} products: [${ids.join(', ')}]`,
                ipAddress: req.ip || null
            }
        });
        res.status(200).json({ success: true, message: `${result.count} products archived successfully` });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to bulk delete products' });
    }
};
exports.bulkDeleteProducts = bulkDeleteProducts;
//# sourceMappingURL=product.controller.js.map