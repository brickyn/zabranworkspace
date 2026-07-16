"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rule_controller_1 = require("../controllers/rule.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protect all rule routes
router.use(auth_middleware_1.authenticateJWT);
// Restrict to Super Admin
router.use((0, auth_middleware_1.authorizeRole)(['Super Admin']));
router.get('/', rule_controller_1.getRules);
router.post('/', rule_controller_1.createRule);
router.patch('/:ruleId', rule_controller_1.updateRule);
router.get('/history', rule_controller_1.getEvaluationHistory);
router.post('/evaluate', rule_controller_1.evaluateRuleTest);
exports.default = router;
//# sourceMappingURL=rule.routes.js.map