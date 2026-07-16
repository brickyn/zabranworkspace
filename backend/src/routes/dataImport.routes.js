"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataImport_controller_1 = require("../controllers/dataImport.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.use(auth_middleware_1.authenticateJWT);
router.post('/transactions', upload.single('file'), dataImport_controller_1.importTransactions);
router.post('/products', upload.single('file'), dataImport_controller_1.importProducts);
exports.default = router;
//# sourceMappingURL=dataImport.routes.js.map