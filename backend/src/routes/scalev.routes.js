"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scalev_controller_1 = require("../controllers/scalev.controller");
const router = (0, express_1.Router)();
router.get('/dashboard-stats', scalev_controller_1.getScalevDashboardStats);
exports.default = router;
//# sourceMappingURL=scalev.routes.js.map