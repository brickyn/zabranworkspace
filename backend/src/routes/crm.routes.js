"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const crm_controller_1 = require("../controllers/crm.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
router.get('/metrics', crm_controller_1.getCRMMetrics);
// Customer Data
router.get('/customers', crm_controller_1.getCustomerData);
router.post('/customers', crm_controller_1.createCustomerData);
router.post('/customers/import', crm_controller_1.importCustomerData);
router.put('/customers/:id', crm_controller_1.updateCustomerData);
// Leaderboard
router.get('/leaderboard', crm_controller_1.getLeaderboard);
// Daily Reviews (Google Maps)
router.get('/daily-reviews', crm_controller_1.getDailyReviews);
router.post('/daily-reviews', crm_controller_1.createDailyReview);
// Activities
router.get('/activities', crm_controller_1.getActivities);
router.post('/activities', crm_controller_1.createActivity);
// Mystery Guests
router.get('/mystery-guests', crm_controller_1.getMysteryGuests);
router.post('/mystery-guests', crm_controller_1.createMysteryGuest);
exports.default = router;
//# sourceMappingURL=crm.routes.js.map