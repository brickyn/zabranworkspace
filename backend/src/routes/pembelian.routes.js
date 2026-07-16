"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pembelian_controller_1 = require("../controllers/pembelian.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Suppliers
router.get('/suppliers', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Purchase.View'), pembelian_controller_1.getSuppliers);
router.post('/suppliers', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Purchase.Manage'), pembelian_controller_1.createSupplier);
// Purchases
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Purchase.View'), pembelian_controller_1.getPurchases);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Purchase.Manage'), pembelian_controller_1.createPurchase);
router.patch('/:id/complete', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Purchase.Manage'), pembelian_controller_1.completePurchase);
router.patch('/:id/cancel', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Purchase.Manage'), pembelian_controller_1.cancelPurchase);
exports.default = router;
//# sourceMappingURL=pembelian.routes.js.map