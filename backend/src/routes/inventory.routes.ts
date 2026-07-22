import { Router } from 'express';
import {
  getStock,
  getStockSummary,
  validateSerialNumber,
  validateBulkSerialNumber,
  addStock,
  bulkImport,
  batchEdit,
  setPromotion,
  getTransfers,
  createTransfers,
  updateTransferStatus,
  bulkReceiveTransfers,
  getSuratJalanById,
  getProductLogs,
} from '../controllers/inventory.controller';
import {
  getOpnames,
  getOpnameDetail,
  initOpname,
  downloadTemplate,
  uploadOpname,
  updateItemNotes,
  verifyOpname,
  cancelOpname
} from '../controllers/stock-opname.controller';
import { authenticateJWT, authorizeRole, requirePermission } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { processInbound } from '../controllers/inbound.controller';

const router = Router();

router.get('/stock', authenticateJWT, getStock);
router.get('/stock/summary', authenticateJWT, requirePermission('Inventory.View'), getStockSummary);
router.post('/validate-sn', authenticateJWT, validateSerialNumber);
router.post('/validate-bulk-sn', authenticateJWT, validateBulkSerialNumber);

// Transfers
router.get('/transfers', authenticateJWT, requirePermission('Inventory.View'), getTransfers);
router.post('/transfers', authenticateJWT, requirePermission('Inventory.Transfer'), createTransfers);
router.put('/transfers/:id/status', authenticateJWT, requirePermission('Inventory.ApproveTransfer'), updateTransferStatus);
router.post('/transfers/:id/receive', authenticateJWT, requirePermission('Inventory.Receive'), bulkReceiveTransfers);

// Surat Jalan (Delivery Order)
router.get('/surat-jalan/:batchId', authenticateJWT, requirePermission('Inventory.View'), getSuratJalanById);

// Product Audit Log
router.get('/logs/:productId', authenticateJWT, requirePermission('Inventory.View'), getProductLogs);

// Opname
router.get('/opname', authenticateJWT, requirePermission('Inventory.StockOpname'), getOpnames);
router.post('/opname/init', authenticateJWT, requirePermission('Inventory.StockOpname'), initOpname);
router.get('/opname/template/:branchId', authenticateJWT, requirePermission('Inventory.StockOpname'), downloadTemplate);
router.post('/opname/:id/upload', authenticateJWT, requirePermission('Inventory.StockOpname'), upload.single('file'), uploadOpname);
router.get('/opname/:id', authenticateJWT, requirePermission('Inventory.StockOpname'), getOpnameDetail);
router.patch('/opname/:id/items/:itemId/notes', authenticateJWT, requirePermission('Inventory.StockOpname'), updateItemNotes);
router.patch('/opname/:id/verify', authenticateJWT, requirePermission('Inventory.StockOpname'), verifyOpname);
router.patch('/opname/:id/cancel', authenticateJWT, requirePermission('Inventory.StockOpname'), cancelOpname);

// Admin routes – only Super Admin can modify inventory
router.post('/stock', authenticateJWT, requirePermission('Inventory.Create'), addStock);
router.post('/stock/bulk', authenticateJWT, requirePermission('Inventory.Create'), upload.single('file'), bulkImport);
router.patch('/stock/batch', authenticateJWT, requirePermission('Inventory.Edit'), batchEdit);
router.patch('/stock/:id/promo', authenticateJWT, requirePermission('Inventory.Edit'), setPromotion);

// Inbound Batch (Master-Detail Architecture)
router.post('/inbound', authenticateJWT, requirePermission('Inventory.Create'), processInbound);

export default router;
