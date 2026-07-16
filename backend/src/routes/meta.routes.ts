import { Router } from 'express';
import { getAdAccounts, getCampaigns, getCampaignInsights, getDashboard, getDashboardStats } from '../controllers/meta.controller';
import { analyzeCampaign, aiChat } from '../controllers/ai.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint Meta (dilindungi JWT & Role/Permissions)
router.get('/ad-accounts', authenticateJWT, authorizeRole(['Super Admin', 'Management']), getAdAccounts);
router.get('/campaigns', authenticateJWT, authorizeRole(['Super Admin', 'Management']), getCampaigns);
router.get('/campaign-insights', authenticateJWT, authorizeRole(['Super Admin', 'Management']), getCampaignInsights);
router.get('/dashboard', authenticateJWT, authorizeRole(['Super Admin', 'Management']), getDashboard);
router.get('/dashboard-stats', authenticateJWT, authorizeRole(['Super Admin', 'Management']), getDashboardStats);

// AI Analyst Endpoints
router.post('/ai-analyze', authenticateJWT, authorizeRole(['Super Admin', 'Management']), analyzeCampaign);
router.post('/ai-chat', authenticateJWT, authorizeRole(['Super Admin', 'Management']), aiChat);

export default router;
