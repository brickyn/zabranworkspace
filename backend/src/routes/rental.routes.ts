import { Router } from 'express';
import { getRentals, createRental, updateRentalStatus } from '../controllers/rental.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getRentals);
router.post('/', authenticateJWT, authorizeRole(['Super Admin', 'Admin', 'Cashier', 'Management']), createRental);
router.patch('/:id/status', authenticateJWT, authorizeRole(['Super Admin', 'Admin', 'Cashier', 'Management']), updateRentalStatus);

export default router;
