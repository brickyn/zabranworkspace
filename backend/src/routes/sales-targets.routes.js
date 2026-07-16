"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sales_targets_controller_1 = require("../controllers/sales-targets.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin', 'Admin', 'Management']), sales_targets_controller_1.getSalesTargets);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin', 'Management']), sales_targets_controller_1.setSalesTarget);
exports.default = router;
//# sourceMappingURL=sales-targets.routes.js.map