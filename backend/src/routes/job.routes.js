"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const job_controller_1 = require("../controllers/job.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protect all job routes
router.use(auth_middleware_1.authenticateJWT);
// Restrict to Super Admin
router.use((0, auth_middleware_1.authorizeRole)(['Super Admin']));
router.get('/', job_controller_1.getJobs);
router.post('/test', job_controller_1.enqueueTestJob);
router.post('/:id/retry', job_controller_1.retryJob);
router.post('/:id/cancel', job_controller_1.cancelJob);
exports.default = router;
//# sourceMappingURL=job.routes.js.map