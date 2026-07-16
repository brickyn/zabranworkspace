"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const dashboardExtra_controller_1 = require("../controllers/dashboardExtra.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/metrics', auth_middleware_1.authenticateJWT, dashboard_controller_1.getDashboardMetrics);
router.get('/historical', auth_middleware_1.authenticateJWT, dashboardExtra_controller_1.getHistoricalData);
router.get('/sales-summary', auth_middleware_1.authenticateJWT, dashboardExtra_controller_1.getSalesSummary);
router.get('/cashier', auth_middleware_1.authenticateJWT, dashboard_controller_1.getCashierDashboard);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map