import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import {
  getCRMMetrics,
  getActivities,
  createActivity,
  getDailyReviews,
  createDailyReview,
  getCustomerData,
  createCustomerData,
  updateCustomerData,
  importCustomerData,
  getLeaderboard,
  getMysteryGuests,
  createMysteryGuest,
} from '../controllers/crm.controller';

const router = Router();

router.use(authenticateJWT);

router.get('/metrics', getCRMMetrics);

// Customer Data
router.get('/customers', getCustomerData);
router.post('/customers', createCustomerData);
router.post('/customers/import', importCustomerData);
router.put('/customers/:id', updateCustomerData);

// Leaderboard
router.get('/leaderboard', getLeaderboard);

// Daily Reviews (Google Maps)
router.get('/daily-reviews', getDailyReviews);
router.post('/daily-reviews', createDailyReview);

// Activities
router.get('/activities', getActivities);
router.post('/activities', createActivity);

// Mystery Guests
router.get('/mystery-guests', getMysteryGuests);
router.post('/mystery-guests', createMysteryGuest);

export default router;
