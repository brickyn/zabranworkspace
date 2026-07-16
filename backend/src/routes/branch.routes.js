"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const branch_controller_1 = require("../controllers/branch.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, branch_controller_1.getBranches);
router.get('/:id', auth_middleware_1.authenticateJWT, branch_controller_1.getBranchById);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin']), branch_controller_1.createBranch);
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin']), branch_controller_1.updateBranch);
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin']), branch_controller_1.deleteBranch);
exports.default = router;
//# sourceMappingURL=branch.routes.js.map