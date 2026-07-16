"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitEOD = exports.getEODSummary = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getEODSummary = async (req, res) => {
    try {
        const cashierId = req.user?.id;
        if (!cashierId) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }
        // Get the last EOD for this cashier today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const lastEOD = await prisma_1.default.endOfDay.findFirst({
            where: { cashierId, date: { gte: startOfDay } },
            orderBy: { createdAt: 'desc' }
        });
        const sinceDate = lastEOD ? lastEOD.createdAt : startOfDay;
        // Fetch transactions
        const transactions = await prisma_1.default.transaction.findMany({
            where: {
                cashierId,
                createdAt: { gt: sinceDate },
                status: { in: ['completed'] }
            }
        });
        let expectedCash = 0;
        let expectedTransfer = 0;
        transactions.forEach(tx => {
            // Split payments could exist
            if (tx.splitPayments && Array.isArray(tx.splitPayments)) {
                tx.splitPayments.forEach((split) => {
                    if (split.method.toLowerCase() === 'cash') {
                        expectedCash += split.amount;
                    }
                    else {
                        expectedTransfer += split.amount;
                    }
                });
            }
            else {
                if (tx.paymentMethod.toLowerCase() === 'cash') {
                    expectedCash += tx.totalAmount;
                }
                else {
                    expectedTransfer += tx.totalAmount;
                }
            }
        });
        res.json({
            success: true,
            data: {
                totalTransactions: transactions.length,
                expectedCash,
                expectedTransfer
            }
        });
    }
    catch (error) {
        console.error('[EOD SUMMARY ERROR]', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getEODSummary = getEODSummary;
const submitEOD = async (req, res) => {
    try {
        const cashierId = req.user?.id;
        const branchId = req.user?.branchId;
        if (!cashierId || !branchId) {
            res.status(401).json({ success: false, error: 'Unauthorized' });
            return;
        }
        const { expectedCash, actualCash, expectedTransfer, actualTransfer, totalTransactions, notes } = req.body;
        // Variance = Actual - Expected
        const variance = (Number(actualCash) - Number(expectedCash)) + (Number(actualTransfer) - Number(expectedTransfer));
        const eod = await prisma_1.default.endOfDay.create({
            data: {
                cashierId,
                branchId,
                date: new Date(),
                totalTransactions: Number(totalTransactions),
                expectedCash: Number(expectedCash),
                actualCash: Number(actualCash),
                expectedTransfer: Number(expectedTransfer),
                actualTransfer: Number(actualTransfer),
                variance,
                notes
            }
        });
        res.status(201).json({ success: true, data: eod });
    }
    catch (error) {
        console.error('[SUBMIT EOD ERROR]', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.submitEOD = submitEOD;
//# sourceMappingURL=pos.controller.js.map