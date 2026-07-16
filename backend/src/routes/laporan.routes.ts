import { Router } from 'express';
import { getLaporan, exportLaporan } from '../controllers/laporan.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

const allowedRoles = ['Super Admin', 'Admin', 'Management', 'Finance', 'Manager'];

router.get('/', authenticateJWT, authorizeRole(allowedRoles), getLaporan);
router.get('/export', authenticateJWT, authorizeRole(allowedRoles), exportLaporan);

export default router;
