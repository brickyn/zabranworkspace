import { Router } from 'express';
import { getPartners, createPartner, updatePartner, deletePartner, getActivities, createActivity, getB2BMetrics, getTransactions, createTransaction, getMaintenanceLogs, createMaintenanceLog, getSchedules, createSchedule, createBatchSchedules } from '../controllers/b2b.controller';
import { authenticateJWT, requirePermission } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticateJWT);

router.get('/metrics', requirePermission('B2B.View'), getB2BMetrics);
router.get('/partners', requirePermission('B2B.View'), getPartners);
router.post('/partners', requirePermission('B2B.Manage'), createPartner);
router.patch('/partners/:id', requirePermission('B2B.Manage'), updatePartner);
router.delete('/partners/:id', requirePermission('B2B.Manage'), deletePartner);
router.get('/activities', requirePermission('B2B.View'), getActivities);
router.post('/activities', requirePermission('B2B.Manage'), createActivity);
router.get('/schedules', requirePermission('B2B.View'), getSchedules);
router.post('/schedules', requirePermission('B2B.Manage'), createSchedule);
router.post('/schedules/batch', requirePermission('B2B.Manage'), createBatchSchedules);
router.get('/transactions', requirePermission('B2B.View'), getTransactions);
router.post('/transactions', requirePermission('B2B.Manage'), createTransaction);
router.get('/maintenance', requirePermission('B2B.View'), getMaintenanceLogs);
router.post('/maintenance', requirePermission('B2B.Manage'), createMaintenanceLog);

export default router;
