import { Router } from 'express';
import { 
  createRule, 
  updateRule, 
  getRules, 
  getEvaluationHistory, 
  evaluateRuleTest 
} from '../controllers/rule.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Protect all rule routes
router.use(authenticateJWT);
// Restrict to Super Admin
router.use(authorizeRole(['Super Admin']));

router.get('/', getRules);
router.post('/', createRule);
router.patch('/:ruleId', updateRule);

router.get('/history', getEvaluationHistory);
router.post('/evaluate', evaluateRuleTest);

export default router;
