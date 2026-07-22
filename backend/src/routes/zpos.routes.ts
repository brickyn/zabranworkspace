import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import { ZPOSController } from '../controllers/zpos.controller';

const router = Router();
const zposController = new ZPOSController();

// All ZPOS routes must be authenticated. 
// Typically accessed by Cashier, Leader, Manager, Super Admin, Owner.
router.use(authenticateJWT);
router.use(authorizeRole(['Cashier', 'Leader', 'Manager', 'Super Admin', 'Owner']));

// Transaction History (ZPOS restricted view)
router.get('/transactions', zposController.getTransactions);

// Store Receiving (Incoming Transfers)
router.get('/transfers/incoming', zposController.getIncomingTransfers);

// Transfer History (All transfers for this store)
router.get('/transfers', zposController.getTransferHistory);

// Transfer Detail
router.get('/transfers/:id', zposController.getTransferDetail);

// Receive Goods & Report Discrepancy
router.post('/transfers/:id/receive', authorizeRole(['Cashier', 'Leader', 'Manager', 'Super Admin']), zposController.receiveTransfer);

// Sales Dashboard (Restricted to Leader & above)
router.get('/dashboard', authorizeRole(['Leader', 'Manager', 'Super Admin', 'Owner']), zposController.getSalesDashboard);

export default router;
