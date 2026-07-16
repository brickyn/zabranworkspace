"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.authorizeRole = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                res.status(403).json({ success: false, error: 'Forbidden: Invalid Token' });
                return;
            }
            req.user = decoded;
            next();
        });
    }
    else {
        res.status(401).json({ success: false, error: 'Unauthorized: Missing Token' });
    }
};
exports.authenticateJWT = authenticateJWT;
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
            return;
        }
        // Super Admin can access everything
        if (req.user.role === 'Super Admin') {
            next();
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ success: false, error: 'Forbidden: Insufficient Permissions' });
            return;
        }
        next();
    };
};
exports.authorizeRole = authorizeRole;
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
            return;
        }
        // System Admins override
        if (req.user.role === 'Super Admin' || req.user.role === 'Owner') {
            next();
            return;
        }
        if (!req.user.permissions || !req.user.permissions.includes(permission)) {
            res.status(403).json({ success: false, error: `Forbidden: Missing Permission (${permission})` });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
//# sourceMappingURL=auth.middleware.js.map