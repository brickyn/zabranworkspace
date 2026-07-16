import { Router } from 'express';
import { getSalesTargets, setSalesTarget } from '../controllers/sales-targets.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, authorizeRole(['Super Admin', 'Admin', 'Management']), getSalesTargets);
router.post('/', authenticateJWT, authorizeRole(['Super Admin', 'Management']), setSalesTarget);

export default router;
