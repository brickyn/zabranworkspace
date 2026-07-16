"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rental_controller_1 = require("../controllers/rental.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, rental_controller_1.getRentals);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin', 'Admin', 'Cashier', 'Management']), rental_controller_1.createRental);
router.patch('/:id/status', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(['Super Admin', 'Admin', 'Cashier', 'Management']), rental_controller_1.updateRentalStatus);
exports.default = router;
//# sourceMappingURL=rental.routes.js.map