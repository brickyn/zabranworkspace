"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const system_controller_1 = require("../controllers/system.controller");
const router = (0, express_1.Router)();
router.post('/reset-dummy', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin']), system_controller_1.resetDummyData);
exports.default = router;
//# sourceMappingURL=system.routes.js.map