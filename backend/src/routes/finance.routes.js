"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const finance_controller_1 = require("../controllers/finance.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin', 'Admin', 'Management']), finance_controller_1.getFinanceReport);
exports.default = router;
//# sourceMappingURL=finance.routes.js.map