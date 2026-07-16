import { Router } from 'express';
import {
  getSuppliers,
  createSupplier,
  getPurchases,
  createPurchase,
  completePurchase,
  cancelPurchase
} from '../controllers/pembelian.controller';
import { authenticateJWT, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// Suppliers
router.get('/suppliers', authenticateJWT, requirePermission('Purchase.View'), getSuppliers);
router.post('/suppliers', authenticateJWT, requirePermission('Purchase.Manage'), createSupplier);

// Purchases
router.get('/', authenticateJWT, requirePermission('Purchase.View'), getPurchases);
router.post('/', authenticateJWT, requirePermission('Purchase.Manage'), createPurchase);
router.patch('/:id/complete', authenticateJWT, requirePermission('Purchase.Manage'), completePurchase);
router.patch('/:id/cancel', authenticateJWT, requirePermission('Purchase.Manage'), cancelPurchase);

export default router;
