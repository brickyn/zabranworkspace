"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogger = void 0;
const prisma_1 = __importDefault(require("../prisma"));
class AuditLogger {
    static async log({ req, action, entityType, entityId, details, userId }) {
        try {
            // Determine userId. Priority: Explicit param > req.user?.id
            const actualUserId = userId || req?.user?.id || null;
            // Extract client information safely
            const ipAddress = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || null;
            const userAgent = req?.headers?.['user-agent'] || null;
            await prisma_1.default.log.create({
                data: {
                    userId: actualUserId,
                    action,
                    entityType,
                    entityId: entityId || null,
                    details: details || null,
                    ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
                    userAgent: userAgent ? userAgent.substring(0, 255) : null,
                }
            });
        }
        catch (error) {
            // Fail silently to prevent interrupting the main business logic
            // But log to console for debugging
            console.error('[AUDIT_LOGGER_ERROR]', error);
        }
    }
}
exports.AuditLogger = AuditLogger;
//# sourceMappingURL=AuditLogger.js.map