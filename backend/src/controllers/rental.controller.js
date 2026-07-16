"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRentalStatus = exports.createRental = exports.getRentals = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getRentals = async (req, res) => {
    try {
        const { branchId, status } = req.query;
        const where = {};
        if (branchId && branchId !== 'all')
            where.branchId = branchId;
        if (status && status !== 'all')
            where.status = status;
        const rentals = await prisma_1.default.rental.findMany({
            where,
            include: { branch: true, product: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: rentals });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch rentals' });
    }
};
exports.getRentals = getRentals;
const createRental = async (req, res) => {
    try {
        const { branchId, customerName, customerPhone, customerIdentity, productId, startDate, endDate, rentalType, totalFee, deposit, shippingFee, installationFee, otherFee, notes } = req.body;
        if (!branchId || !customerName || !productId || !startDate || !endDate) {
            res.status(400).json({ success: false, error: 'Missing required fields' });
            return;
        }
        // Update Product Status to "Rented"
        await prisma_1.default.product.update({
            where: { id: productId },
            data: { status: 'Rented' }
        });
        const rental = await prisma_1.default.rental.create({
            data: {
                branchId,
                customerName,
                customerPhone,
                customerIdentity,
                productId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                rentalType: rentalType || 'Harian',
                totalFee: Number(totalFee || 0),
                deposit: Number(deposit || 0),
                shippingFee: Number(shippingFee || 0),
                installationFee: Number(installationFee || 0),
                otherFee: Number(otherFee || 0),
                notes,
                status: 'Active'
            },
            include: { product: true }
        });
        res.status(201).json({ success: true, data: rental });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to create rental' });
    }
};
exports.createRental = createRental;
const updateRentalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const rental = await prisma_1.default.rental.update({
            where: { id: String(id) },
            data: {
                status,
                ...(notes && { notes })
            }
        });
        if (status === 'Returned') {
            await prisma_1.default.product.update({
                where: { id: rental.productId },
                data: { status: 'Available' }
            });
        }
        res.json({ success: true, data: rental });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to update rental' });
    }
};
exports.updateRentalStatus = updateRentalStatus;
//# sourceMappingURL=rental.controller.js.map