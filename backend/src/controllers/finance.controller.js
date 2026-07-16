"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinanceReport = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getFinanceReport = async (req, res) => {
    try {
        const { month, year, branchId } = req.query;
        if (!month || !year) {
            res.status(400).json({ success: false, error: 'Month and Year are required' });
            return;
        }
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
        const whereBranch = branchId && branchId !== 'all' ? { branchId: String(branchId) } : {};
        // 1. Get Income (Transactions & Service & Rentals)
        const transactions = await prisma_1.default.transaction.findMany({
            where: { ...whereBranch, status: 'completed', createdAt: { gte: startDate, lte: endDate } },
            include: { items: { include: { product: true } } }
        });
        const rentals = await prisma_1.default.rental.findMany({
            where: { ...whereBranch, createdAt: { gte: startDate, lte: endDate } }
        });
        const b2bWhere = (branchId && branchId !== 'all') ? { branchId: String(branchId) } : {};
        const b2bTxs = await prisma_1.default.b2BTransaction.findMany({
            where: { ...b2bWhere, date: { gte: startDate, lte: endDate } }
        });
        const bsbWhere = (branchId && branchId !== 'all') ? { branchId: String(branchId) } : {};
        const bsbTxs = await prisma_1.default.bSBTransaction.findMany({
            where: { ...bsbWhere, date: { gte: startDate, lte: endDate } }
        });
        let totalIncomeProduct = 0;
        let totalIncomeService = 0;
        let totalCOGS = 0;
        transactions.forEach(tx => {
            tx.items.forEach(item => {
                const cat = item.product.category?.toLowerCase() || '';
                if (cat.includes('service')) {
                    totalIncomeService += item.subtotal;
                }
                else {
                    totalIncomeProduct += item.subtotal;
                    totalCOGS += item.product.buyPrice;
                }
            });
        });
        const totalIncomeRental = rentals.reduce((acc, curr) => acc + curr.totalFee, 0);
        const totalIncomeB2B = b2bTxs.reduce((acc, curr) => acc + curr.amount, 0);
        const totalIncomeBSB = bsbTxs.reduce((acc, curr) => acc + curr.amount, 0);
        const totalRevenue = totalIncomeProduct + totalIncomeService + totalIncomeRental + totalIncomeB2B + totalIncomeBSB;
        const grossProfit = totalRevenue - totalCOGS;
        // 2. Get Expenses (Opex)
        const expenses = await prisma_1.default.expense.findMany({
            where: { ...whereBranch, date: { gte: startDate, lte: endDate } }
        });
        const totalOpex = expenses.reduce((acc, curr) => acc + curr.amount, 0);
        const expensesByCategory = expenses.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {});
        // 3. Get Asset Purchases (PO) - This doesn't affect P&L immediately but affects cash flow
        const purchases = await prisma_1.default.purchaseOrder.findMany({
            where: { ...whereBranch, status: 'completed', createdAt: { gte: startDate, lte: endDate } }
        });
        const totalAssetPurchase = purchases.reduce((acc, curr) => acc + curr.totalAmount, 0);
        const netProfit = grossProfit - totalOpex;
        res.json({
            success: true,
            data: {
                revenue: {
                    product: totalIncomeProduct,
                    service: totalIncomeService,
                    rental: totalIncomeRental,
                    b2b: totalIncomeB2B,
                    bsb: totalIncomeBSB,
                    total: totalRevenue
                },
                cogs: totalCOGS,
                grossProfit,
                expenses: totalOpex,
                expensesByCategory,
                netProfit,
                cashFlow: {
                    in: totalRevenue,
                    out: totalOpex + totalAssetPurchase,
                    net: totalRevenue - (totalOpex + totalAssetPurchase)
                }
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch finance report' });
    }
};
exports.getFinanceReport = getFinanceReport;
//# sourceMappingURL=finance.controller.js.map