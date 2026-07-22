import { Router } from 'express';
import { getCurrentSession, openSession, closeSession } from '../controllers/session.controller';
import { authenticateJWT, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint to get the current open session for the cashier
router.get('/current', authenticateJWT, requirePermission('POS.View'), getCurrentSession);

// Endpoint to open a new register session
router.post('/open', authenticateJWT, requirePermission('POS.Create'), openSession);

// Endpoint to close the current register session
router.post('/close', authenticateJWT, requirePermission('POS.Create'), closeSession);

export default router;
