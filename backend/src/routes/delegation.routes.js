"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const delegation_controller_1 = require("../controllers/delegation.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Settings.Roles'), delegation_controller_1.getDelegations);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Settings.Roles'), delegation_controller_1.createDelegation);
router.patch('/:id/revoke', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Settings.Roles'), delegation_controller_1.revokeDelegation);
exports.default = router;
//# sourceMappingURL=delegation.routes.js.map