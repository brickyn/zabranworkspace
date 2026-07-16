import { Router } from 'express';
import { login, register, generateOverrideToken } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/override', generateOverrideToken);

export default router;
