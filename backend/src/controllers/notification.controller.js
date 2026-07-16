"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.markAllRead = exports.markAsRead = exports.getNotifications = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getNotifications = async (req, res) => {
    try {
        const userRole = req.user?.role;
        const userId = req.user?.id;
        const notifications = await prisma_1.default.notification.findMany({
            where: {
                OR: [
                    { targetRole: userRole },
                    { targetUserId: userId },
                    { targetRole: null, targetUserId: null }, // broadcast
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        const unreadCount = notifications.filter(n => !n.isRead).length;
        res.json({ success: true, data: { notifications, unreadCount } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        const id = String(req.params.id);
        await prisma_1.default.notification.update({ where: { id }, data: { isRead: true } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to mark as read' });
    }
};
exports.markAsRead = markAsRead;
const markAllRead = async (req, res) => {
    try {
        const userRole = req.user?.role;
        const userId = req.user?.id;
        await prisma_1.default.notification.updateMany({
            where: {
                isRead: false,
                OR: [
                    { targetRole: userRole },
                    { targetUserId: userId },
                    { targetRole: null, targetUserId: null },
                ],
            },
            data: { isRead: true },
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed' });
    }
};
exports.markAllRead = markAllRead;
// Helper to create notification (used from other controllers)
const createNotification = async (data) => {
    return prisma_1.default.notification.create({ data });
};
exports.createNotification = createNotification;
//# sourceMappingURL=notification.controller.js.map