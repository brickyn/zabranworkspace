"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExpense = exports.createExpense = exports.getExpenses = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getExpenses = async (req, res) => {
    try {
        const { branchId, month, year } = req.query;
        const whereClause = {};
        if (branchId && branchId !== 'all') {
            whereClause.branchId = branchId;
        }
        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
            whereClause.date = {
                gte: startDate,
                lte: endDate
            };
        }
        const expenses = await prisma_1.default.expense.findMany({
            where: whereClause,
            include: { branch: true },
            orderBy: { date: 'desc' }
        });
        res.json({ success: true, data: expenses });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch expenses' });
    }
};
exports.getExpenses = getExpenses;
const createExpense = async (req, res) => {
    try {
        const { branchId, amount, category, description, date } = req.body;
        if (!branchId || !amount || !category) {
            res.status(400).json({ success: false, error: 'Missing required fields' });
            return;
        }
        const expense = await prisma_1.default.expense.create({
            data: {
                branchId,
                amount: Number(amount),
                category,
                description,
                date: date ? new Date(date) : new Date()
            },
            include: { branch: true }
        });
        res.status(201).json({ success: true, data: expense });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to create expense' });
    }
};
exports.createExpense = createExpense;
const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.expense.delete({ where: { id: String(id) } });
        res.json({ success: true, message: 'Expense deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to delete expense' });
    }
};
exports.deleteExpense = deleteExpense;
//# sourceMappingURL=biaya.controller.js.map