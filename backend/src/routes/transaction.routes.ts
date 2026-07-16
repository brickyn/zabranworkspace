import { Router } from 'express';
import { getTransactions, createTransaction, voidTransaction, returnTransaction } from '../controllers/transaction.controller';
import { authenticateJWT, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, requirePermission('POS.View'), getTransactions);
router.post('/', authenticateJWT, requirePermission('POS.Create'), createTransaction);
router.patch('/:id/void', authenticateJWT, requirePermission('POS.Void'), voidTransaction);
router.post('/:id/return', authenticateJWT, requirePermission('POS.Refund'), returnTransaction);

export default router;
