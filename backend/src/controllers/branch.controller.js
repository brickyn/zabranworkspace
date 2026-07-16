"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBranch = exports.updateBranch = exports.createBranch = exports.getBranchById = exports.getBranches = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getBranches = async (req, res) => {
    try {
        const branches = await prisma_1.default.branch.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: branches });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch branches' });
    }
};
exports.getBranches = getBranches;
const getBranchById = async (req, res) => {
    try {
        const branch = await prisma_1.default.branch.findUnique({
            where: { id: String(req.params.id) }
        });
        if (!branch) {
            res.status(404).json({ success: false, error: 'Branch not found' });
            return;
        }
        res.status(200).json({ success: true, data: branch });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch branch' });
    }
};
exports.getBranchById = getBranchById;
const createBranch = async (req, res) => {
    try {
        const { id, name, brand, isWarehouse, address, phone } = req.body;
        if (!id || !name) {
            res.status(400).json({ success: false, error: 'Branch ID and Name are required' });
            return;
        }
        const branch = await prisma_1.default.branch.create({
            data: { id, name, brand, isWarehouse: !!isWarehouse, address, phone }
        });
        res.status(201).json({ success: true, data: branch });
    }
    catch (error) {
        if (error.code === 'P2002') {
            res.status(400).json({ success: false, error: 'Branch ID already exists' });
            return;
        }
        res.status(500).json({ success: false, error: 'Failed to create branch' });
    }
};
exports.createBranch = createBranch;
const updateBranch = async (req, res) => {
    try {
        const { name, brand, isWarehouse, address, phone } = req.body;
        const branch = await prisma_1.default.branch.update({
            where: { id: String(req.params.id) },
            data: { name, brand, isWarehouse, address, phone }
        });
        res.json({ success: true, data: branch });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update branch' });
    }
};
exports.updateBranch = updateBranch;
const deleteBranch = async (req, res) => {
    try {
        // Check if there are users or products tied to this branch
        const usersCount = await prisma_1.default.user.count({ where: { branchId: String(req.params.id) } });
        const productsCount = await prisma_1.default.product.count({ where: { branchId: String(req.params.id) } });
        if (usersCount > 0 || productsCount > 0) {
            res.status(400).json({
                success: false,
                error: `Cannot delete branch because it is linked to ${usersCount} users and ${productsCount} products.`
            });
            return;
        }
        await prisma_1.default.branch.delete({
            where: { id: String(req.params.id) }
        });
        res.status(200).json({ success: true, message: 'Branch deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete branch' });
    }
};
exports.deleteBranch = deleteBranch;
//# sourceMappingURL=branch.controller.js.map