"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promo_controller_1 = require("../controllers/promo.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
router.get('/', (0, auth_middleware_1.requirePermission)('Marketing.View'), promo_controller_1.getPromos);
router.post('/', (0, auth_middleware_1.requirePermission)('Marketing.Manage'), promo_controller_1.createPromo);
router.post('/validate', promo_controller_1.validateVoucher); // Allow any authenticated user to validate
router.patch('/:id', (0, auth_middleware_1.requirePermission)('Marketing.Manage'), promo_controller_1.updatePromo);
router.delete('/:id', (0, auth_middleware_1.requirePermission)('Marketing.Manage'), promo_controller_1.deletePromo);
exports.default = router;
//# sourceMappingURL=promo.routes.js.map