"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOverrideToken = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const auth_validation_1 = require("../validations/auth.validation");
const zod_1 = require("zod");
const JWT_SECRET = process.env.JWT_SECRET;
// Note: Server will crash at startup (index.ts) if JWT_SECRET is missing — no fallback.
const register = async (req, res) => {
    try {
        const validatedData = auth_validation_1.registerSchema.parse(req.body);
        // Check if user exists
        const existingUser = await prisma_1.default.user.findFirst({
            where: {
                OR: [
                    { id: validatedData.id },
                    { email: validatedData.email }
                ]
            }
        });
        if (existingUser) {
            res.status(400).json({ error: 'User ID or Email already exists' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(validatedData.password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                id: validatedData.id,
                email: validatedData.email,
                password: hashedPassword,
                name: validatedData.name,
                role: validatedData.role,
                branchId: validatedData.branchId
            },
            select: { id: true, email: true, name: true, role: true, branchId: true }
        });
        res.status(201).json({ success: true, message: 'User created successfully', data: user });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        res.status(500).json({ error: 'Internal server error during registration' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        console.log('[LOGIN] Parsing request body');
        const { email, password } = auth_validation_1.loginSchema.parse(req.body);
        console.log('[LOGIN] Finding user', email);
        const user = await prisma_1.default.user.findUnique({
            where: { email },
            include: {
                branch: true,
                userRole: {
                    include: {
                        permissions: {
                            include: { permission: true }
                        }
                    }
                },
                roleDelegationsTo: {
                    where: { isActive: true, validUntil: { gte: new Date() } },
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: { permission: true }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!user) {
            console.log('[LOGIN] User not found');
            res.status(401).json({ success: false, error: 'Invalid credentials' });
            return;
        }
        console.log('[LOGIN] Comparing password');
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('[LOGIN] Invalid password');
            res.status(401).json({ success: false, error: 'Invalid credentials' });
            return;
        }
        console.log('[LOGIN] Generating JWT');
        // Resolve permissions from main role and active delegations
        const permissionSet = new Set();
        if (user.userRole) {
            user.userRole.permissions.forEach(rp => permissionSet.add(rp.permission.action));
        }
        user.roleDelegationsTo.forEach(delegation => {
            delegation.role.permissions.forEach(rp => permissionSet.add(rp.permission.action));
        });
        const compiledPermissions = Array.from(permissionSet);
        const resolvedRole = user.userRole?.name || user.role;
        // Generate JWT payload based on API Spec
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            name: user.name,
            role: resolvedRole,
            branchId: user.branchId,
            permissions: compiledPermissions
        }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    role: resolvedRole,
                    jobTitle: user.jobTitle,
                    division: user.division,
                    permissions: compiledPermissions,
                    branch_id: user.branchId,
                    branch_name: user.branch?.name || null
                }
            }
        });
    }
    catch (error) {
        console.error('[LOGIN ERROR]', error);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: error.errors });
            return;
        }
        res.status(500).json({ success: false, error: 'Internal server error during login' });
    }
};
exports.login = login;
const generateOverrideToken = async (req, res) => {
    try {
        const { email, password, action } = req.body;
        if (!email || !password || !action) {
            res.status(400).json({ success: false, error: 'Email, password, and action are required' });
            return;
        }
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
            return;
        }
        if (!['Super Admin', 'Owner', 'Manager'].includes(user.role)) {
            res.status(403).json({ success: false, error: 'Unauthorized role for override' });
            return;
        }
        const overrideToken = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, action }, JWT_SECRET, { expiresIn: '5m' });
        res.json({ success: true, overrideToken, approverName: user.name });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to generate override token' });
    }
};
exports.generateOverrideToken = generateOverrideToken;
//# sourceMappingURL=auth.controller.js.map