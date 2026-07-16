"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ?? new client_1.PrismaClient();
// Global Soft Delete Middleware
const SOFT_DELETE_MODELS = ['Branch', 'Product', 'Customer'];
exports.prisma.$use(async (params, next) => {
    if (SOFT_DELETE_MODELS.includes(params.model || '')) {
        if (params.action === 'findUnique' || params.action === 'findFirst') {
            params.action = 'findFirst';
            params.args.where = { ...params.args.where, deletedAt: null };
        }
        if (params.action === 'findMany') {
            if (params.args.where) {
                if (params.args.where.deletedAt === undefined) {
                    params.args.where.deletedAt = null;
                }
            }
            else {
                params.args.where = { deletedAt: null };
            }
        }
        // Update to soft delete
        if (params.action === 'delete') {
            params.action = 'update';
            params.args.data = { deletedAt: new Date() };
        }
        if (params.action === 'deleteMany') {
            params.action = 'updateMany';
            if (params.args.data) {
                params.args.data.deletedAt = new Date();
            }
            else {
                params.args.data = { deletedAt: new Date() };
            }
        }
    }
    return next(params);
});
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map