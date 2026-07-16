import { Router } from 'express';
import { getServiceJobs, createServiceJob, updateServiceJobStatus } from '../controllers/service.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getServiceJobs);
router.post('/', authenticateJWT, authorizeRole(['Super Admin', 'Admin', 'Cashier', 'Management']), createServiceJob);
router.patch('/:id/status', authenticateJWT, authorizeRole(['Super Admin', 'Admin', 'Cashier', 'Management']), updateServiceJobStatus);

export default router;
