"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBSBExpense = exports.getBSBExpenses = exports.createBSBActivity = exports.getBSBActivities = exports.createBSBTransaction = exports.getBSBTransactions = exports.getBSBMetrics = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getBSBMetrics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let whereClause = {};
        if (startDate && endDate) {
            whereClause.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        // Get transactions in range
        const txs = await prisma_1.default.bSBTransaction.findMany({ where: whereClause });
        // Get expenses in range
        const exps = await prisma_1.default.bSBExpense.findMany({ where: whereClause });
        // Get activities in range
        const acts = await prisma_1.default.bSBActivity.findMany({ where: whereClause });
        let omzetBsb = 0;
        let bukuTerjual = 0;
        let ebookTerjual = 0;
        let bundlingTerjual = 0;
        let totalBerhasil = 0;
        let totalGagal = 0;
        txs.forEach(t => {
            omzetBsb += t.amount;
            if (t.type === 'Buku Fisik')
                bukuTerjual += t.qty;
            else if (t.type === 'E-book')
                ebookTerjual += t.qty;
            else if (t.type === 'Bundling')
                bundlingTerjual += t.qty;
            if (t.shippingStatus === 'Sukses')
                totalBerhasil += t.qty;
            else if (t.shippingStatus === 'Gagal/Retur')
                totalGagal += t.qty;
        });
        const totalExpense = exps.reduce((acc, curr) => acc + curr.amount, 0);
        res.json({
            success: true,
            data: {
                omzetBsb,
                bukuTerjual,
                ebookTerjual,
                bundlingTerjual,
                totalBerhasil,
                totalGagal,
                totalExpense,
                netProfit: omzetBsb - totalExpense,
                totalActivities: acts.length,
                contentCreationCount: acts.filter(a => a.type === 'Pembuatan Konten').length
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
    }
};
exports.getBSBMetrics = getBSBMetrics;
// Transactions
const getBSBTransactions = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let whereClause = {};
        if (startDate && endDate) {
            whereClause.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        const data = await prisma_1.default.bSBTransaction.findMany({
            where: whereClause,
            orderBy: { date: 'desc' }
        });
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
    }
};
exports.getBSBTransactions = getBSBTransactions;
const createBSBTransaction = async (req, res) => {
    try {
        const data = await prisma_1.default.bSBTransaction.create({
            data: {
                type: req.body.type,
                qty: Number(req.body.qty) || 1,
                amount: Number(req.body.amount) || 0,
                platform: req.body.platform,
                shippingStatus: req.body.shippingStatus || 'Proses',
                picName: req.body.picName,
                buyerName: req.body.buyerName,
                buyerContact: req.body.buyerContact,
                date: req.body.date ? new Date(req.body.date) : new Date(),
            }
        });
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create transaction' });
    }
};
exports.createBSBTransaction = createBSBTransaction;
// Activities
const getBSBActivities = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let whereClause = {};
        if (startDate && endDate) {
            whereClause.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        const data = await prisma_1.default.bSBActivity.findMany({
            where: whereClause,
            orderBy: { date: 'desc' }
        });
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch activities' });
    }
};
exports.getBSBActivities = getBSBActivities;
const createBSBActivity = async (req, res) => {
    try {
        const data = await prisma_1.default.bSBActivity.create({
            data: {
                type: req.body.type,
                description: req.body.description,
                picName: req.body.picName,
                title: req.body.title,
                platform: req.body.platform,
                date: req.body.date ? new Date(req.body.date) : new Date(),
            }
        });
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create activity' });
    }
};
exports.createBSBActivity = createBSBActivity;
// Expenses
const getBSBExpenses = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let whereClause = {};
        if (startDate && endDate) {
            whereClause.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        const data = await prisma_1.default.bSBExpense.findMany({
            where: whereClause,
            orderBy: { date: 'desc' }
        });
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch expenses' });
    }
};
exports.getBSBExpenses = getBSBExpenses;
const createBSBExpense = async (req, res) => {
    try {
        const data = await prisma_1.default.bSBExpense.create({
            data: {
                category: req.body.category,
                amount: Number(req.body.amount) || 0,
                description: req.body.description,
                picName: req.body.picName,
                date: req.body.date ? new Date(req.body.date) : new Date(),
            }
        });
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create expense' });
    }
};
exports.createBSBExpense = createBSBExpense;
//# sourceMappingURL=bsb.controller.js.map