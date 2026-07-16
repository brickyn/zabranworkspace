"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kpi_controller_1 = require("../controllers/kpi.controller");
const router = (0, express_1.Router)();
router.get('/', kpi_controller_1.getKPI);
router.post('/', kpi_controller_1.setKPI);
exports.default = router;
//# sourceMappingURL=kpi.routes.js.map