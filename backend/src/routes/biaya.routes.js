"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const biaya_controller_1 = require("../controllers/biaya.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin', 'Admin', 'Management']), biaya_controller_1.getExpenses);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin', 'Admin', 'Management']), biaya_controller_1.createExpense);
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin']), biaya_controller_1.deleteExpense);
exports.default = router;
//# sourceMappingURL=biaya.routes.js.map