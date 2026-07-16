import { Router } from 'express';
import { globalSearch } from '../controllers/search.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, globalSearch);

export default router;
