"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const workflow_controller_1 = require("../controllers/workflow.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protect all workflow routes
router.use(auth_middleware_1.authenticateJWT);
// Management routes (Super Admin only)
router.post('/', (0, auth_middleware_1.authorizeRole)(['Super Admin']), workflow_controller_1.createWorkflow);
router.post('/:workflowId/states', (0, auth_middleware_1.authorizeRole)(['Super Admin']), workflow_controller_1.addState);
router.post('/:workflowId/transitions', (0, auth_middleware_1.authorizeRole)(['Super Admin']), workflow_controller_1.addTransition);
// Execution routes
router.get('/instances/:instanceId/history', workflow_controller_1.getWorkflowHistory);
router.get('/instances/:instanceId/transitions', workflow_controller_1.getAvailableTransitions);
router.post('/instances/:instanceId/execute', workflow_controller_1.executeTransition);
exports.default = router;
//# sourceMappingURL=workflow.routes.js.map