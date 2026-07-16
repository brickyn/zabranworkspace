"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bsb_controller_1 = require("../controllers/bsb.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
router.get('/metrics', bsb_controller_1.getBSBMetrics);
router.get('/transactions', bsb_controller_1.getBSBTransactions);
router.post('/transactions', bsb_controller_1.createBSBTransaction);
router.get('/activities', bsb_controller_1.getBSBActivities);
router.post('/activities', bsb_controller_1.createBSBActivity);
router.get('/expenses', bsb_controller_1.getBSBExpenses);
router.post('/expenses', bsb_controller_1.createBSBExpense);
exports.default = router;
//# sourceMappingURL=bsb.routes.js.map