import { Router } from 'express';
import { getDashboardMetrics, getCashierDashboard } from '../controllers/dashboard.controller';
import { getHistoricalData, getSalesSummary } from '../controllers/dashboardExtra.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.get('/metrics', authenticateJWT, getDashboardMetrics);
router.get('/historical', authenticateJWT, getHistoricalData);
router.get('/sales-summary', authenticateJWT, getSalesSummary);
router.get('/cashier', authenticateJWT, getCashierDashboard);

export default router;
