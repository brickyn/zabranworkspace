"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const service_controller_1 = require("../controllers/service.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, service_controller_1.getServiceJobs);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin', 'Admin', 'Cashier', 'Management']), service_controller_1.createServiceJob);
router.patch('/:id/status', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin', 'Admin', 'Cashier', 'Management']), service_controller_1.updateServiceJobStatus);
exports.default = router;
//# sourceMappingURL=service.routes.js.map