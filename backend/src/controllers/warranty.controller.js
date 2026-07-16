"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWarrantyStatus = exports.getWarranties = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getWarranties = async (req, res) => {
    try {
        const { status, search } = req.query;
        const where = {};
        if (status && status !== 'all') {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { customerName: { contains: String(search), mode: 'insensitive' } },
                { customerPhone: { contains: String(search), mode: 'insensitive' } },
                { transactionItem: { product: { name: { contains: String(search), mode: 'insensitive' } } } },
                { transactionItem: { product: { id: { contains: String(search), mode: 'insensitive' } } } }
            ];
        }
        const warranties = await prisma_1.default.warranty.findMany({
            where,
            include: {
                transactionItem: {
                    include: {
                        product: { select: { id: true, name: true } },
                        transaction: { select: { branch: { select: { name: true } } } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: warranties });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch warranties' });
    }
};
exports.getWarranties = getWarranties;
const updateWarrantyStatus = async (req, res) => {
    try {
        const id = String(req.params.id);
        const { status } = req.body;
        const warranty = await prisma_1.default.warranty.update({
            where: { id },
            data: { status }
        });
        res.json({ success: true, data: warranty });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to update warranty' });
    }
};
exports.updateWarrantyStatus = updateWarrantyStatus;
//# sourceMappingURL=warranty.controller.js.map