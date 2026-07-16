import { Request } from 'express';
import prisma from '../prisma';

interface LogParams {
  req: Request | any;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  userId?: string;
}

export class AuditLogger {
  static async log({ req, action, entityType, entityId, details, userId }: LogParams) {
    try {
      // Determine userId. Priority: Explicit param > req.user?.id
      const actualUserId = userId || req?.user?.id || null;

      // Extract client information safely
      const ipAddress = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || null;
      const userAgent = req?.headers?.['user-agent'] || null;

      await prisma.log.create({
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
    } catch (error) {
      // Fail silently to prevent interrupting the main business logic
      // But log to console for debugging
      console.error('[AUDIT_LOGGER_ERROR]', error);
    }
  }
}
