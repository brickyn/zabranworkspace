import { Router } from 'express';
import { getCashManagements, createCashManagement, deleteCashManagement, getCashBalance } from '../controllers/cashManagement.controller';
import { authenticateJWT, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/balance/:branchId', authenticateJWT, requirePermission('Finance.View'), getCashBalance);
router.get('/', authenticateJWT, requirePermission('Finance.View'), getCashManagements);
router.post('/', authenticateJWT, requirePermission('Finance.Manage'), createCashManagement);
router.delete('/:id', authenticateJWT, requirePermission('Finance.Manage'), deleteCashManagement);

export default router;
