"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customer_controller_1 = require("../controllers/customer.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
router.get('/', (0, auth_middleware_1.requirePermission)('CRM.View'), customer_controller_1.getCustomers);
router.get('/:id', (0, auth_middleware_1.requirePermission)('CRM.View'), customer_controller_1.getCustomerById);
router.post('/', (0, auth_middleware_1.requirePermission)('CRM.Manage'), customer_controller_1.createCustomer);
router.patch('/:id', (0, auth_middleware_1.requirePermission)('CRM.Manage'), customer_controller_1.updateCustomer);
router.delete('/:id', (0, auth_middleware_1.requirePermission)('CRM.Manage'), customer_controller_1.deleteCustomer);
exports.default = router;
//# sourceMappingURL=customer.routes.js.map