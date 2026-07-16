"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const meta_controller_1 = require("../controllers/meta.controller");
const ai_controller_1 = require("../controllers/ai.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Endpoint Meta (dilindungi JWT & Role/Permissions)
router.get('/ad-accounts', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin', 'Management']), meta_controller_1.getAdAccounts);
router.get('/campaigns', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin', 'Management']), meta_controller_1.getCampaigns);
router.get('/campaign-insights', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin', 'Management']), meta_controller_1.getCampaignInsights);
router.get('/dashboard', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin', 'Management']), meta_controller_1.getDashboard);
router.get('/dashboard-stats', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin', 'Management']), meta_controller_1.getDashboardStats);
// AI Analyst Endpoints
router.post('/ai-analyze', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin', 'Management']), ai_controller_1.analyzeCampaign);
router.post('/ai-chat', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin', 'Management']), ai_controller_1.aiChat);
exports.default = router;
//# sourceMappingURL=meta.routes.js.map