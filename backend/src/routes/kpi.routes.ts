import { Router } from 'express';
import { getKPI, setKPI } from '../controllers/kpi.controller';

const router = Router();

router.get('/', getKPI);
router.post('/', setKPI);

export default router;
