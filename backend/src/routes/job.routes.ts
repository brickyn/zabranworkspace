import { Router } from 'express';
import { 
  getJobs, 
  retryJob, 
  cancelJob, 
  enqueueTestJob 
} from '../controllers/job.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Protect all job routes
router.use(authenticateJWT);
// Restrict to Super Admin
router.use(authorizeRole(['Super Admin']));

router.get('/', getJobs);
router.post('/test', enqueueTestJob);
router.post('/:id/retry', retryJob);
router.post('/:id/cancel', cancelJob);

export default router;
