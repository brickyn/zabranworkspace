import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, importBulkProducts, bulkUpdateProducts, bulkDeleteProducts } from '../controllers/product.controller';
import { authenticateJWT, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, requirePermission('Inventory.View'), getProducts);
router.post('/bulk', authenticateJWT, requirePermission('Inventory.Create'), importBulkProducts);
router.put('/bulk', authenticateJWT, requirePermission('Inventory.Edit'), bulkUpdateProducts);
router.delete('/bulk', authenticateJWT, requirePermission('Inventory.Delete'), bulkDeleteProducts);
router.get('/:id', authenticateJWT, requirePermission('Inventory.View'), getProductById);
router.post('/', authenticateJWT, requirePermission('Inventory.Create'), createProduct);
router.put('/:id', authenticateJWT, requirePermission('Inventory.Edit'), updateProduct);
router.delete('/:id', authenticateJWT, requirePermission('Inventory.Delete'), deleteProduct);

export default router;
