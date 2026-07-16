import { Router } from 'express';
import { getExpenses, createExpense, deleteExpense } from '../controllers/biaya.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, authorizeRole(['Super Admin', 'Admin', 'Management']), getExpenses);
router.post('/', authenticateJWT, authorizeRole(['Super Admin', 'Admin', 'Management']), createExpense);
router.delete('/:id', authenticateJWT, authorizeRole(['Super Admin']), deleteExpense);

export default router;
