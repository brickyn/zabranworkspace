import { Router } from 'express';
import { getDelegations, createDelegation, revokeDelegation } from '../controllers/delegation.controller';
import { authenticateJWT, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, requirePermission('Settings.Roles'), getDelegations);
router.post('/', authenticateJWT, requirePermission('Settings.Roles'), createDelegation);
router.patch('/:id/revoke', authenticateJWT, requirePermission('Settings.Roles'), revokeDelegation);

export default router;
