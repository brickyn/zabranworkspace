"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = require("../controllers/transaction.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('POS.View'), transaction_controller_1.getTransactions);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('POS.Create'), transaction_controller_1.createTransaction);
router.patch('/:id/void', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('POS.Void'), transaction_controller_1.voidTransaction);
router.post('/:id/return', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('POS.Refund'), transaction_controller_1.returnTransaction);
exports.default = router;
//# sourceMappingURL=transaction.routes.js.map