"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSalesSummary = exports.getHistoricalData = void 0;
const prisma_1 = __importDefault(require("../prisma"));
/**
 * Get historical dashboard data for multi-year comparison
 * GET /api/v1/dashboard/historical?yearFrom=2023&yearTo=2026&branchId=all
 */
const getHistoricalData = async (req, res) => {
    try {
        const { yearFrom, yearTo, branchId } = req.query;
        const startYear = Number(yearFrom) || new Date().getFullYear() - 2;
        const endYear = Number(yearTo) || new Date().getFullYear();
        const startDate = new Date(startYear, 0, 1);
        const endDate = new Date(endYear, 11, 31, 23, 59, 59);
        const txWhere = {
            status: 'completed',
            createdAt: { gte: startDate, lte: endDate },
        };
        if (branchId && branchId !== 'all') {
            txWhere.branchId = String(branchId);
        }
        const transactions = await prisma_1.default.transaction.findMany({
            where: txWhere,
            include: { items: { include: { product: true } }, branch: true },
            orderBy: { createdAt: 'asc' },
        });
        // Group by month/year
        const monthlyMap = {};
        transactions.forEach((tx) => {
            const d = new Date(tx.createdAt);
            const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
            if (!monthlyMap[key]) {
                monthlyMap[key] = { month: d.getMonth() + 1, year: d.getFullYear(), omzet: 0, hpp: 0, transaksi: 0, units: 0 };
            }
            monthlyMap[key].omzet += tx.totalAmount;
            monthlyMap[key].transaksi += 1;
            tx.items.forEach((item) => {
                monthlyMap[key].hpp += item.product?.buyPrice || 0;
                monthlyMap[key].units += 1;
            });
        });
        const data = Object.values(monthlyMap).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
        // Branch performance
        const branchMap = {};
        transactions.forEach((tx) => {
            const bid = tx.branchId;
            if (!branchMap[bid]) {
                branchMap[bid] = { name: tx.branch?.name || bid, omzet: 0, transaksi: 0 };
            }
            branchMap[bid].omzet += tx.totalAmount;
            branchMap[bid].transaksi += 1;
        });
        const branchPerformance = Object.values(branchMap).sort((a, b) => b.omzet - a.omzet);
        res.json({ success: true, data: { monthly: data, branchPerformance } });
    }
    catch (error) {
        console.error('Error fetching historical data:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch historical data' });
    }
};
exports.getHistoricalData = getHistoricalData;
/**
 * Get sales summary: payment methods, cashier perf, branch perf
 * GET /api/v1/dashboard/sales-summary?month=7&year=2026&branchId=all
 */
const getSalesSummary = async (req, res) => {
    try {
        const { month, year, branchId } = req.query;
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
        const txWhere = {
            status: 'completed',
            createdAt: { gte: startDate, lte: endDate },
        };
        if (branchId && branchId !== 'all')
            txWhere.branchId = String(branchId);
        const transactions = await prisma_1.default.transaction.findMany({
            where: txWhere,
            include: {
                items: { include: { product: true } },
                cashier: { select: { id: true, name: true } },
                branch: { select: { id: true, name: true } },
            },
        });
        // Payment method breakdown
        const paymentMap = {};
        // Cashier performance
        const cashierMap = {};
        // Branch performance
        const branchPerfMap = {};
        transactions.forEach((tx) => {
            // Payment
            const pm = tx.paymentMethod || 'Cash';
            if (!paymentMap[pm])
                paymentMap[pm] = { count: 0, total: 0 };
            paymentMap[pm].count += 1;
            paymentMap[pm].total += tx.totalAmount;
            // Cashier
            const cid = tx.cashierId || 'unknown';
            if (!cashierMap[cid])
                cashierMap[cid] = { name: tx.cashier?.name || 'Unknown', omzet: 0, transaksi: 0 };
            cashierMap[cid].omzet += tx.totalAmount;
            cashierMap[cid].transaksi += 1;
            // Branch
            const bid = tx.branchId;
            if (!branchPerfMap[bid])
                branchPerfMap[bid] = { name: tx.branch?.name || bid, omzet: 0, transaksi: 0, units: 0 };
            branchPerfMap[bid].omzet += tx.totalAmount;
            branchPerfMap[bid].transaksi += 1;
            branchPerfMap[bid].units += tx.items?.length || 0;
        });
        const paymentBreakdown = Object.entries(paymentMap).map(([method, data]) => ({
            method, ...data
        })).sort((a, b) => b.total - a.total);
        const cashierPerformance = Object.values(cashierMap).sort((a, b) => b.omzet - a.omzet);
        const branchPerformance = Object.values(branchPerfMap).sort((a, b) => b.omzet - a.omzet);
        const totalOmzet = transactions.reduce((s, t) => s + t.totalAmount, 0);
        const totalTx = transactions.length;
        res.json({
            success: true,
            data: {
                totalOmzet,
                totalTransactions: totalTx,
                avgPerTransaction: totalTx > 0 ? totalOmzet / totalTx : 0,
                paymentBreakdown,
                cashierPerformance,
                branchPerformance,
            },
        });
    }
    catch (error) {
        console.error('Error fetching sales summary:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch sales summary' });
    }
};
exports.getSalesSummary = getSalesSummary;
//# sourceMappingURL=dashboardExtra.controller.js.map