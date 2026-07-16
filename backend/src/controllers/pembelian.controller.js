"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelPurchase = exports.completePurchase = exports.createPurchase = exports.getPurchases = exports.createSupplier = exports.getSuppliers = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const AuditLogger_1 = require("../services/AuditLogger");
const getSuppliers = async (req, res) => {
    try {
        const suppliers = await prisma_1.default.supplier.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: suppliers });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch suppliers' });
    }
};
exports.getSuppliers = getSuppliers;
const createSupplier = async (req, res) => {
    try {
        const { name, contact, address } = req.body;
        const supplier = await prisma_1.default.supplier.create({
            data: { name, contact, address }
        });
        await AuditLogger_1.AuditLogger.log({
            req,
            action: 'CREATE_SUPPLIER',
            entityType: 'Supplier',
            entityId: supplier.id,
            details: `Created supplier: ${name}`
        });
        res.status(201).json({ success: true, data: supplier });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create supplier' });
    }
};
exports.createSupplier = createSupplier;
const getPurchases = async (req, res) => {
    try {
        const { branchId } = req.query;
        let whereClause = {};
        if (branchId && branchId !== 'all') {
            whereClause.branchId = branchId;
        }
        const purchases = await prisma_1.default.purchaseOrder.findMany({
            where: whereClause,
            include: {
                supplier: true,
                branch: true,
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: purchases });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch purchases' });
    }
};
exports.getPurchases = getPurchases;
const createPurchase = async (req, res) => {
    try {
        const { supplierId, branchId, items } = req.body; // items is array of PurchaseOrderItem
        if (!items || items.length === 0) {
            res.status(400).json({ success: false, error: 'Items cannot be empty' });
            return;
        }
        let totalAmount = 0;
        const poItems = items.map((item) => {
            const sub = item.buyPrice * item.quantity;
            totalAmount += sub;
            return {
                name: item.name,
                category: item.category,
                brand: item.brand,
                buyPrice: item.buyPrice,
                sellPrice: item.sellPrice,
                quantity: item.quantity,
                subtotal: sub
            };
        });
        const po = await prisma_1.default.purchaseOrder.create({
            data: {
                supplierId,
                branchId,
                totalAmount,
                status: 'pending',
                items: {
                    create: poItems
                }
            },
            include: { items: true, supplier: true, branch: true }
        });
        res.status(201).json({ success: true, data: po });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to create purchase order' });
    }
};
exports.createPurchase = createPurchase;
const completePurchase = async (req, res) => {
    try {
        const id = String(req.params.id);
        const po = await prisma_1.default.purchaseOrder.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!po) {
            res.status(404).json({ success: false, error: 'PO not found' });
            return;
        }
        if (po.status === 'completed') {
            res.status(400).json({ success: false, error: 'PO is already completed' });
            return;
        }
        // Generate products for inventory
        const productsToCreate = [];
        const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
        for (const item of po.items) {
            for (let i = 0; i < item.quantity; i++) {
                // Generate pseudo-random Serial Number: e.g. PO-260705-ABC
                const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
                productsToCreate.push({
                    id: `PO-${datePrefix}-${randomStr}`,
                    name: item.name,
                    category: item.category,
                    brand: item.brand,
                    buyPrice: item.buyPrice,
                    sellPrice: item.sellPrice,
                    status: 'Available',
                    branchId: po.branchId
                });
            }
        }
        // Transaction to update PO and insert products
        await prisma_1.default.$transaction([
            prisma_1.default.purchaseOrder.update({
                where: { id: String(id) },
                data: { status: 'completed' }
            }),
            prisma_1.default.product.createMany({
                data: productsToCreate
            })
        ]);
        res.json({ success: true, message: `PO Completed. ${productsToCreate.length} items added to inventory.` });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to complete PO' });
    }
};
exports.completePurchase = completePurchase;
const cancelPurchase = async (req, res) => {
    try {
        const id = String(req.params.id);
        const po = await prisma_1.default.purchaseOrder.findUnique({
            where: { id }
        });
        if (!po) {
            res.status(404).json({ success: false, error: 'PO not found' });
            return;
        }
        if (po.status === 'cancelled') {
            res.status(400).json({ success: false, error: 'PO is already cancelled' });
            return;
        }
        if (po.status === 'completed') {
            res.status(400).json({ success: false, error: 'Cannot cancel a completed PO' });
            return;
        }
        await prisma_1.default.purchaseOrder.update({
            where: { id: String(id) },
            data: { status: 'cancelled' }
        });
        res.json({ success: true, message: `PO Cancelled successfully.` });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to cancel PO' });
    }
};
exports.cancelPurchase = cancelPurchase;
//# sourceMappingURL=pembelian.controller.js.map