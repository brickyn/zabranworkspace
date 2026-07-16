"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeDelegation = exports.createDelegation = exports.getDelegations = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getDelegations = async (req, res) => {
    try {
        const user = req.user;
        let whereClause = {};
        // If not super admin, only show delegations created by them or for them
        if (user?.role !== 'Super Admin' && user?.role !== 'Owner') {
            whereClause.OR = [
                { fromUserId: user?.id },
                { toUserId: user?.id }
            ];
        }
        const delegations = await prisma_1.default.roleDelegation.findMany({
            where: whereClause,
            include: {
                fromUser: { select: { id: true, name: true, role: true } },
                toUser: { select: { id: true, name: true, role: true } },
                role: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: delegations });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch delegations' });
    }
};
exports.getDelegations = getDelegations;
const createDelegation = async (req, res) => {
    try {
        const { toUserId, roleId, validUntil } = req.body;
        const fromUserId = req.user?.id;
        if (!fromUserId || !toUserId || !roleId || !validUntil) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        // You cannot delegate to yourself
        if (fromUserId === toUserId) {
            return res.status(400).json({ success: false, error: 'Cannot delegate to yourself' });
        }
        // Ensure delegator is admin/owner
        if (req.user?.role !== 'Super Admin' && req.user?.role !== 'Owner') {
            return res.status(403).json({ success: false, error: 'Only Super Admin or Owner can delegate roles' });
        }
        const delegation = await prisma_1.default.roleDelegation.create({
            data: {
                fromUserId,
                toUserId,
                roleId,
                validUntil: new Date(validUntil),
                isActive: true,
            },
            include: {
                fromUser: { select: { id: true, name: true } },
                toUser: { select: { id: true, name: true } },
                role: { select: { id: true, name: true } }
            }
        });
        res.status(201).json({ success: true, data: delegation, message: 'Delegation created successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to create delegation' });
    }
};
exports.createDelegation = createDelegation;
const revokeDelegation = async (req, res) => {
    try {
        const id = String(req.params.id);
        const delegation = await prisma_1.default.roleDelegation.findUnique({ where: { id } });
        if (!delegation) {
            return res.status(404).json({ success: false, error: 'Delegation not found' });
        }
        if (req.user?.role !== 'Super Admin' && req.user?.role !== 'Owner' && req.user?.id !== delegation.fromUserId) {
            return res.status(403).json({ success: false, error: 'Unauthorized to revoke this delegation' });
        }
        const updated = await prisma_1.default.roleDelegation.update({
            where: { id },
            data: { isActive: false },
            include: {
                toUser: { select: { name: true } }
            }
        });
        res.json({ success: true, message: `Delegation for ${updated.toUser.name} revoked`, data: updated });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to revoke delegation' });
    }
};
exports.revokeDelegation = revokeDelegation;
//# sourceMappingURL=delegation.controller.js.map