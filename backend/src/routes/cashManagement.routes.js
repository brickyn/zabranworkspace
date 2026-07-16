"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cashManagement_controller_1 = require("../controllers/cashManagement.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/balance/:branchId', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Finance.View'), cashManagement_controller_1.getCashBalance);
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Finance.View'), cashManagement_controller_1.getCashManagements);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Finance.Manage'), cashManagement_controller_1.createCashManagement);
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Finance.Manage'), cashManagement_controller_1.deleteCashManagement);
exports.default = router;
//# sourceMappingURL=cashManagement.routes.js.map