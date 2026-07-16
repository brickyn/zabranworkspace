import { Router } from 'express';
import { 
  getBSBMetrics, 
  getBSBTransactions, createBSBTransaction,
  getBSBActivities, createBSBActivity,
  getBSBExpenses, createBSBExpense
} from '../controllers/bsb.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticateJWT);

router.get('/metrics', getBSBMetrics);
router.get('/transactions', getBSBTransactions);
router.post('/transactions', createBSBTransaction);
router.get('/activities', getBSBActivities);
router.post('/activities', createBSBActivity);
router.get('/expenses', getBSBExpenses);
router.post('/expenses', createBSBExpense);

export default router;
