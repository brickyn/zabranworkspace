"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const laporan_controller_1 = require("../controllers/laporan.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const allowedRoles = ['Super Admin', 'Admin', 'Management', 'Finance', 'Manager'];
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(allowedRoles), laporan_controller_1.getLaporan);
router.get('/export', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(allowedRoles), laporan_controller_1.exportLaporan);
exports.default = router;
//# sourceMappingURL=laporan.routes.js.map