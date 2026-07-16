"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getRoles = exports.getUsers = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const getUsers = async (req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                jobTitle: true,
                division: true,
                permissions: true,
                branchId: true,
                branch: { select: { name: true } },
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: users });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
};
exports.getUsers = getUsers;
const getRoles = async (req, res) => {
    try {
        const roles = await prisma_1.default.role.findMany({
            select: { id: true, name: true, description: true }
        });
        res.status(200).json({ success: true, data: roles });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch roles' });
    }
};
exports.getRoles = getRoles;
const getUserById = async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: String(req.params.id) },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                jobTitle: true,
                division: true,
                permissions: true,
                branchId: true,
                branch: { select: { name: true } }
            }
        });
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        res.status(200).json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch user' });
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
    try {
        const { id, email, password, name, role, branchId, jobTitle, division, permissions } = req.body;
        // Check if email already exists
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ success: false, error: 'Email already in use' });
            return;
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                id: id || String(Math.floor(100000 + Math.random() * 900000)), // Generate 6 digit random ID if none provided
                email,
                password: hashedPassword,
                name,
                role: role || 'User',
                jobTitle: jobTitle || undefined,
                division: division || undefined,
                permissions: permissions || undefined,
                branchId
            }
        });
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({ success: true, data: userWithoutPassword });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create user' });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { email, password, name, role, branchId, jobTitle, division, permissions } = req.body;
        const updateData = { name, role, branchId, jobTitle, division, permissions };
        if (email)
            updateData.email = email;
        if (password)
            updateData.password = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.update({
            where: { id: String(req.params.id) },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                jobTitle: true,
                division: true,
                permissions: true,
                branchId: true,
            }
        });
        res.status(200).json({ success: true, data: user });
    }
    catch (error) {
        if (error.code === 'P2002') {
            res.status(400).json({ success: false, error: 'Email already in use' });
            return;
        }
        res.status(500).json({ success: false, error: 'Failed to update user' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        // Check if user has transactions
        const txCount = await prisma_1.default.transaction.count({ where: { cashierId: String(req.params.id) } });
        if (txCount > 0) {
            res.status(400).json({
                success: false,
                error: `Cannot delete user because they are linked to ${txCount} transactions.`
            });
            return;
        }
        await prisma_1.default.user.delete({
            where: { id: String(req.params.id) }
        });
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=user.controller.js.map