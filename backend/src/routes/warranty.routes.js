"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const warranty_controller_1 = require("../controllers/warranty.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, warranty_controller_1.getWarranties);
router.patch('/:id/status', auth_middleware_1.authenticateJWT, warranty_controller_1.updateWarrantyStatus);
exports.default = router;
//# sourceMappingURL=warranty.routes.js.map