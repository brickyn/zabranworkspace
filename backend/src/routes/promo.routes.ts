import { Router } from 'express';
import { getPromos, createPromo, updatePromo, deletePromo, validateVoucher } from '../controllers/promo.controller';
import { authenticateJWT, requirePermission } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticateJWT);

router.get('/', requirePermission('Marketing.View'), getPromos);
router.post('/', requirePermission('Marketing.Manage'), createPromo);
router.post('/validate', validateVoucher); // Allow any authenticated user to validate
router.patch('/:id', requirePermission('Marketing.Manage'), updatePromo);
router.delete('/:id', requirePermission('Marketing.Manage'), deletePromo);

export default router;
