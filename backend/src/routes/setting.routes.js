"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const setting_controller_1 = require("../controllers/setting.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// All settings routes require authentication
router.get('/', auth_middleware_1.authenticateJWT, setting_controller_1.getSettings);
// Only Super Admin can UPDATE settings
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin']), setting_controller_1.updateSettings);
router.put('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin']), setting_controller_1.updateSettings);
exports.default = router;
//# sourceMappingURL=setting.routes.js.map