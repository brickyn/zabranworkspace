"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalSearch = void 0;
const prisma_1 = __importDefault(require("../prisma"));
/**
 * Global Search endpoint — search Products, Customers, Transactions, Service Jobs
 * GET /api/v1/search?q=<query>&type=all|product|customer|transaction|service
 */
const globalSearch = async (req, res) => {
    try {
        const { q, type = 'all' } = req.query;
        const query = String(q || '').trim();
        if (!query || query.length < 2) {
            res.status(400).json({ success: false, error: 'Query must be at least 2 characters' });
            return;
        }
        const branchFilter = (req.user && ['Cashier', 'Leader'].includes(req.user.role) && req.user.branchId)
            ? { branchId: req.user.branchId }
            : {};
        const results = {};
        const searchTypes = type === 'all' ? ['product', 'customer', 'transaction', 'service'] : [type];
        if (searchTypes.includes('product')) {
            results.products = await prisma_1.default.product.findMany({
                where: {
                    deletedAt: null,
                    ...branchFilter,
                    OR: [
                        { id: { contains: query, mode: 'insensitive' } },
                        { name: { contains: query, mode: 'insensitive' } },
                        { serialNumber: { contains: query, mode: 'insensitive' } },
                        { brand: { contains: query, mode: 'insensitive' } },
                        { model: { contains: query, mode: 'insensitive' } },
                    ]
                },
                include: { branch: { select: { name: true } } },
                take: 10,
                orderBy: { createdAt: 'desc' }
            });
        }
        if (searchTypes.includes('customer')) {
            results.customers = await prisma_1.default.customer.findMany({
                where: {
                    deletedAt: null,
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { phone: { contains: query } },
                        { email: { contains: query, mode: 'insensitive' } },
                    ]
                },
                take: 10,
                orderBy: { createdAt: 'desc' }
            });
        }
        if (searchTypes.includes('transaction')) {
            results.transactions = await prisma_1.default.transaction.findMany({
                where: {
                    ...branchFilter,
                    OR: [
                        { id: { contains: query, mode: 'insensitive' } },
                    ]
                },
                include: {
                    customer: { select: { name: true, phone: true } },
                    cashier: { select: { name: true } }
                },
                take: 10,
                orderBy: { createdAt: 'desc' }
            });
        }
        if (searchTypes.includes('service')) {
            results.serviceJobs = await prisma_1.default.serviceJob.findMany({
                where: {
                    ...branchFilter,
                    OR: [
                        { customerName: { contains: query, mode: 'insensitive' } },
                        { customerPhone: { contains: query } },
                        { deviceModel: { contains: query, mode: 'insensitive' } },
                        { id: { contains: query, mode: 'insensitive' } },
                    ]
                },
                take: 10,
                orderBy: { createdAt: 'desc' }
            });
        }
        const totalResults = Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0);
        res.json({ success: true, query, totalResults, data: results });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Search failed' });
    }
};
exports.globalSearch = globalSearch;
//# sourceMappingURL=search.controller.js.map