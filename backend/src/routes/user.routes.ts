import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser, getRoles } from '../controllers/user.controller';
import { authenticateJWT, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, requirePermission('Settings.Users'), getUsers);
router.get('/roles', authenticateJWT, getRoles);
router.get('/:id', authenticateJWT, requirePermission('Settings.Users'), getUserById);
router.post('/', authenticateJWT, requirePermission('User.Manage'), createUser);
router.put('/:id', authenticateJWT, requirePermission('User.Manage'), updateUser);
router.delete('/:id', authenticateJWT, requirePermission('User.Manage'), deleteUser);

export default router;
