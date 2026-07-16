import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import { resetDummyData } from '../controllers/system.controller';

const router = Router();

router.post('/reset-dummy', authenticateJWT, authorizeRole(['Super Admin']), resetDummyData);

export default router;
