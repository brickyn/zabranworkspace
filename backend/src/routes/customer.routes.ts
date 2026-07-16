import { Router } from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customer.controller';
import { authenticateJWT, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', requirePermission('CRM.View'), getCustomers);
router.get('/:id', requirePermission('CRM.View'), getCustomerById);
router.post('/', requirePermission('CRM.Manage'), createCustomer);
router.patch('/:id', requirePermission('CRM.Manage'), updateCustomer);
router.delete('/:id', requirePermission('CRM.Manage'), deleteCustomer);

export default router;
