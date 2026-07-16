import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/setting.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// All settings routes require authentication
router.get('/', authenticateJWT, getSettings);

// Only Super Admin can UPDATE settings
router.post('/', authenticateJWT, authorizeRole(['Super Admin']), updateSettings);
router.put('/', authenticateJWT, authorizeRole(['Super Admin']), updateSettings);

export default router;
