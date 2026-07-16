import { Router } from 'express';
import { getScalevDashboardStats } from '../controllers/scalev.controller';

const router = Router();

router.get('/dashboard-stats', getScalevDashboardStats);

export default router;
