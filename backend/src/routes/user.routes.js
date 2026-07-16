"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Settings.Users'), user_controller_1.getUsers);
router.get('/roles', auth_middleware_1.authenticateJWT, user_controller_1.getRoles);
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('Settings.Users'), user_controller_1.getUserById);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('User.Manage'), user_controller_1.createUser);
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('User.Manage'), user_controller_1.updateUser);
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.requirePermission)('User.Manage'), user_controller_1.deleteUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map