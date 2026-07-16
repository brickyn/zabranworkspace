import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { getEODSummary, submitEOD } from '../controllers/pos.controller';

const router = Router();

router.get('/eod-summary', authenticateJWT, getEODSummary);
router.post('/eod', authenticateJWT, submitEOD);

export default router;
