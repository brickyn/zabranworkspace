"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const metadata_controller_1 = require("../controllers/metadata.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protect all metadata routes
router.use(auth_middleware_1.authenticateJWT);
// Schema management (Super Admin only)
router.post('/fields', (0, auth_middleware_1.authorizeRole)(['Super Admin']), metadata_controller_1.createField);
router.patch('/fields/:id', (0, auth_middleware_1.authorizeRole)(['Super Admin']), metadata_controller_1.updateField);
// Schema read (Everyone can read field definitions)
router.get('/fields', metadata_controller_1.getFields);
// Data read/write
router.get('/data/:entityType/:entityId', metadata_controller_1.getEntityData);
router.post('/data/:entityType/:entityId', metadata_controller_1.saveEntityData);
exports.default = router;
//# sourceMappingURL=metadata.routes.js.map