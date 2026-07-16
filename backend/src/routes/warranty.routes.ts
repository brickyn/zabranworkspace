import { Router } from 'express';
import { getWarranties, updateWarrantyStatus } from '../controllers/warranty.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getWarranties);
router.patch('/:id/status', authenticateJWT, updateWarrantyStatus);

export default router;
