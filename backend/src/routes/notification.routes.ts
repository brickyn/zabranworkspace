import { Router } from 'express';
import { getNotifications, markAsRead, markAllRead } from '../controllers/notification.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticateJWT);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.post('/mark-all-read', markAllRead);

export default router;
