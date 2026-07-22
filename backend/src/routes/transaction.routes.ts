import { Router } from 'express';
import { getTransactions, createTransaction, voidTransaction, returnTransaction } from '../controllers/transaction.controller';
import { authenticateJWT, requirePermission, requireRealtimePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, requirePermission('POS.View'), getTransactions);
router.post('/', authenticateJWT, requirePermission('POS.Create'), createTransaction);
router.post('/checkout', authenticateJWT, requirePermission('POS.Create'), createTransaction);

// Void Transaction using Stateful Real-time Auth
router.post('/:id/void', authenticateJWT, requireRealtimePermission('VOID_TRANSACTION'), voidTransaction);

router.post('/:id/return', authenticateJWT, requirePermission('POS.Refund'), returnTransaction);

export default router;
