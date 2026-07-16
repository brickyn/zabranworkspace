"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const pos_controller_1 = require("../controllers/pos.controller");
const router = (0, express_1.Router)();
router.get('/eod-summary', auth_middleware_1.authenticateJWT, pos_controller_1.getEODSummary);
router.post('/eod', auth_middleware_1.authenticateJWT, pos_controller_1.submitEOD);
exports.default = router;
//# sourceMappingURL=pos.routes.js.map