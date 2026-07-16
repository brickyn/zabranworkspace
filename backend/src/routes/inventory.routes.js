"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controller_1 = require("../controllers/inventory.controller");
const stock_opname_controller_1 = require("../controllers/stock-opname.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = (0, express_1.Router)();
router.get('/stock', auth_middleware_1.authenticateJWT, inventory_controller_1.getStock);
router.get('/stock/summary', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.View'), inventory_controller_1.getStockSummary);
router.post('/validate-sn', auth_middleware_1.authenticateJWT, inventory_controller_1.validateSerialNumber);
// Transfers
router.get('/transfers', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.View'), inventory_controller_1.getTransfers);
router.post('/transfers', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.Transfer'), inventory_controller_1.createTransfers);
router.put('/transfers/:id/status', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.ApproveTransfer'), inventory_controller_1.updateTransferStatus);
router.post('/transfers/:id/receive', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.Receive'), inventory_controller_1.bulkReceiveTransfers);
// Surat Jalan (Delivery Order)
router.get('/surat-jalan/:batchId', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.View'), inventory_controller_1.getSuratJalanById);
// Product Audit Log
router.get('/logs/:productId', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.View'), inventory_controller_1.getProductLogs);
// Opname
router.get('/opname', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.StockOpname'), stock_opname_controller_1.getOpnames);
router.post('/opname/init', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.StockOpname'), stock_opname_controller_1.initOpname);
router.get('/opname/template/:branchId', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.StockOpname'), stock_opname_controller_1.downloadTemplate);
router.post('/opname/:id/upload', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.StockOpname'), upload_middleware_1.upload.single('file'), stock_opname_controller_1.uploadOpname);
router.get('/opname/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.StockOpname'), stock_opname_controller_1.getOpnameDetail);
router.patch('/opname/:id/items/:itemId/notes', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.StockOpname'), stock_opname_controller_1.updateItemNotes);
router.patch('/opname/:id/verify', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.StockOpname'), stock_opname_controller_1.verifyOpname);
router.patch('/opname/:id/cancel', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.StockOpname'), stock_opname_controller_1.cancelOpname);
// Admin routes – only Super Admin can modify inventory
router.post('/stock', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.Create'), inventory_controller_1.addStock);
router.post('/stock/bulk', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.Create'), upload_middleware_1.upload.single('file'), inventory_controller_1.bulkImport);
router.patch('/stock/batch', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.Edit'), inventory_controller_1.batchEdit);
router.patch('/stock/:id/promo', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.Edit'), inventory_controller_1.setPromotion);
exports.default = router;
//# sourceMappingURL=inventory.routes.js.map