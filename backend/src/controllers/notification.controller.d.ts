import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getNotifications: (req: AuthRequest, res: Response) => Promise<void>;
export declare const markAsRead: (req: AuthRequest, res: Response) => Promise<void>;
export declare const markAllRead: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createNotification: (data: {
    type: string;
    title: string;
    message: string;
    targetRole?: string;
    targetUserId?: string;
    referenceId?: string;
}) => Promise<{
    type: string;
    message: string;
    id: string;
    createdAt: Date;
    title: string;
    isRead: boolean;
    targetRole: string | null;
    targetUserId: string | null;
    referenceId: string | null;
}>;
//# sourceMappingURL=notification.controller.d.ts.map