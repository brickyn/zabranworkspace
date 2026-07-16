"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCashBalance = exports.deleteCashManagement = exports.createCashManagement = exports.getCashManagements = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getCashManagements = async (req, res) => {
    try {
        const { branchId, month, year } = req.query;
        const whereClause = {};
        if (branchId && branchId !== 'all') {
            whereClause.branchId = branchId;
        }
        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
            whereClause.date = { gte: startDate, lte: endDate };
        }
        const data = await prisma_1.default.cashManagement.findMany({
            where: whereClause,
            include: { branch: { select: { name: true } } },
            orderBy: { date: 'desc' }
        });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch cash managements' });
    }
};
exports.getCashManagements = getCashManagements;
const createCashManagement = async (req, res) => {
    try {
        const { branchId, type, amount, notes, date, picName, suratJalanUrl, buktiTransferUrl } = req.body;
        if (!branchId || !type || !amount) {
            return res.status(400).json({ success: false, error: 'Branch, type, and amount are required' });
        }
        const newCash = await prisma_1.default.cashManagement.create({
            data: {
                branchId,
                type,
                amount: Number(amount),
                notes,
                picName: picName || 'Leader',
                suratJalanUrl,
                buktiTransferUrl,
                date: date ? new Date(date) : new Date()
            }
        });
        res.status(201).json({ success: true, message: 'Cash management created', data: newCash });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to create cash management' });
    }
};
exports.createCashManagement = createCashManagement;
const deleteCashManagement = async (req, res) => {
    try {
        const id = String(req.params.id);
        await prisma_1.default.cashManagement.delete({ where: { id } });
        res.json({ success: true, message: 'Deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to delete cash management' });
    }
};
exports.deleteCashManagement = deleteCashManagement;
const getCashBalance = async (req, res) => {
    try {
        const branchId = String(req.params.branchId);
        if (!branchId) {
            return res.status(400).json({ success: false, error: 'Branch ID is required' });
        }
        // 1. Get total cash payments from completed POS transactions
        // The paymentMethod should be 'Cash' or splitPayments array should contain 'Cash'
        // To simplify and be accurate, we need to iterate transactions that are 'completed' and sum the Cash amounts.
        const cashTransactions = await prisma_1.default.transaction.findMany({
            where: {
                branchId,
                status: 'completed'
            },
            select: {
                paymentMethod: true,
                totalAmount: true,
                splitPayments: true
            }
        });
        let totalCashSales = 0;
        cashTransactions.forEach(tx => {
            if (tx.paymentMethod === 'Split') {
                if (tx.splitPayments && Array.isArray(tx.splitPayments)) {
                    const cashSplit = tx.splitPayments.find((p) => p.method === 'Cash');
                    if (cashSplit)
                        totalCashSales += Number(cashSplit.amount);
                }
            }
            else if (tx.paymentMethod === 'Cash') {
                totalCashSales += tx.totalAmount;
            }
        });
        // 2. Get total cash deposits (Setoran Tunai)
        const deposits = await prisma_1.default.cashManagement.aggregate({
            where: {
                branchId,
                type: 'Setoran Tunai'
            },
            _sum: {
                amount: true
            }
        });
        const totalDeposits = deposits?._sum?.amount || 0;
        const balance = totalCashSales - totalDeposits;
        res.json({ success: true, data: { totalCashSales, totalDeposits, balance } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch cash balance' });
    }
};
exports.getCashBalance = getCashBalance;
//# sourceMappingURL=cashManagement.controller.js.map