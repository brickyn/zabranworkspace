"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.View'), product_controller_1.getProducts);
router.post('/bulk', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.Create'), product_controller_1.importBulkProducts);
router.put('/bulk', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.Edit'), product_controller_1.bulkUpdateProducts);
router.delete('/bulk', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.Delete'), product_controller_1.bulkDeleteProducts);
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.View'), product_controller_1.getProductById);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.Create'), product_controller_1.createProduct);
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.Edit'), product_controller_1.updateProduct);
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Inventory.Delete'), product_controller_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=product.routes.js.map