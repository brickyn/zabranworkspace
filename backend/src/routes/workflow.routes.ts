import { Router } from 'express';
import { 
  createWorkflow, 
  addState, 
  addTransition, 
  getWorkflowHistory, 
  getAvailableTransitions, 
  executeTransition 
} from '../controllers/workflow.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Protect all workflow routes
router.use(authenticateJWT);

// Management routes (Super Admin only)
router.post('/', authorizeRole(['Super Admin']), createWorkflow);
router.post('/:workflowId/states', authorizeRole(['Super Admin']), addState);
router.post('/:workflowId/transitions', authorizeRole(['Super Admin']), addTransition);

// Execution routes
router.get('/instances/:instanceId/history', getWorkflowHistory);
router.get('/instances/:instanceId/transitions', getAvailableTransitions);
router.post('/instances/:instanceId/execute', executeTransition);

export default router;
