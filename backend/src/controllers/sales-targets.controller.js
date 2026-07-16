"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSalesTarget = exports.getSalesTargets = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getSalesTargets = async (req, res) => {
    try {
        const { branchId, month, year } = req.query;
        const whereClause = {};
        if (branchId && branchId !== 'all') {
            whereClause.branchId = branchId;
        }
        if (month)
            whereClause.month = Number(month);
        if (year)
            whereClause.year = Number(year);
        const targets = await prisma_1.default.salesTarget.findMany({
            where: whereClause,
            include: { branch: true },
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });
        // We also want to compute the current sales for these targets to return the progress
        const targetsWithProgress = await Promise.all(targets.map(async (t) => {
            const startDate = new Date(t.year, t.month - 1, 1);
            const endDate = new Date(t.year, t.month, 0, 23, 59, 59);
            // Get all transaction items for the branch in this period
            const transactions = await prisma_1.default.transaction.findMany({
                where: {
                    branchId: t.branchId,
                    status: 'completed',
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                include: {
                    items: {
                        include: { product: true }
                    }
                }
            });
            let currentSales = 0;
            let currentServiceSales = 0;
            let currentAksesorisSales = 0;
            let currentItemsSold = 0;
            transactions.forEach(tx => {
                tx.items.forEach(item => {
                    const cat = item.product.category?.toLowerCase() || '';
                    if (cat.includes('service')) {
                        currentServiceSales += item.subtotal;
                    }
                    else if (cat.includes('aksesoris')) {
                        currentAksesorisSales += item.subtotal;
                        currentItemsSold += 1; // Assuming accessories count towards item target too
                    }
                    else {
                        currentSales += item.subtotal;
                        currentItemsSold += 1;
                    }
                });
            });
            return {
                ...t,
                currentSales,
                currentItemsSold,
                currentServiceSales,
                currentAksesorisSales,
                progressPercentage: t.targetAmount > 0 ? (currentSales / t.targetAmount) * 100 : 0,
                progressItemsPercentage: t.targetItemQty > 0 ? (currentItemsSold / t.targetItemQty) * 100 : 0,
                progressServicePercentage: t.targetServiceAmount > 0 ? (currentServiceSales / t.targetServiceAmount) * 100 : 0,
                progressAksesorisPercentage: t.targetAccessoryAmount > 0 ? (currentAksesorisSales / t.targetAccessoryAmount) * 100 : 0
            };
        }));
        res.json({ success: true, data: targetsWithProgress });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch sales targets' });
    }
};
exports.getSalesTargets = getSalesTargets;
const setSalesTarget = async (req, res) => {
    try {
        const { branchId, month, year, targetAmount, targetItemQty, targetServiceAmount, targetAksesorisAmount } = req.body;
        if (!branchId || !month || !year || targetAmount === undefined || targetItemQty === undefined || targetServiceAmount === undefined) {
            res.status(400).json({ success: false, error: 'Missing required fields' });
            return;
        }
        const target = await prisma_1.default.salesTarget.upsert({
            where: {
                branchId_month_year: {
                    branchId,
                    month: Number(month),
                    year: Number(year)
                }
            },
            update: {
                targetAmount: Number(targetAmount),
                targetItemQty: Number(targetItemQty),
                targetServiceAmount: Number(targetServiceAmount),
                targetAccessoryAmount: Number(targetAksesorisAmount || 0)
            },
            create: {
                branchId,
                month: Number(month),
                year: Number(year),
                targetAmount: Number(targetAmount),
                targetItemQty: Number(targetItemQty),
                targetServiceAmount: Number(targetServiceAmount),
                targetAccessoryAmount: Number(targetAksesorisAmount || 0)
            },
            include: { branch: true }
        });
        res.status(200).json({ success: true, data: target });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to set sales target' });
    }
};
exports.setSalesTarget = setSalesTarget;
//# sourceMappingURL=sales-targets.controller.js.map