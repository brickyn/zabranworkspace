import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const notifications = await prisma.notification.findMany({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.notification.update({ where: { id }, data: { isRead: true } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
};

export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    await prisma.notification.updateMany({
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
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed' });
  }
};

// Helper to create notification (used from other controllers)
export const createNotification = async (data: {
  type: string; title: string; message: string;
  targetRole?: string; targetUserId?: string; referenceId?: string;
}) => {
  return prisma.notification.create({ data });
};
