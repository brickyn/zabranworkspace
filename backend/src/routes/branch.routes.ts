import { Router } from 'express';
import { getBranches, getBranchById, createBranch, updateBranch, deleteBranch } from '../controllers/branch.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getBranches);
router.get('/:id', authenticateJWT, getBranchById);
router.post('/', authenticateJWT, authorizeRole(['Super Admin']), createBranch);
router.put('/:id', authenticateJWT, authorizeRole(['Super Admin']), updateBranch);
router.delete('/:id', authenticateJWT, authorizeRole(['Super Admin']), deleteBranch);

export default router;
