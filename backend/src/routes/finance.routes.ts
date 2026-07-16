import { Router } from 'express';
import { getFinanceReport } from '../controllers/finance.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, authorizeRole(['Super Admin', 'Admin', 'Management']), getFinanceReport);

export default router;
