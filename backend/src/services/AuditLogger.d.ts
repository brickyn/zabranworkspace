import { Request } from 'express';
interface LogParams {
    req: Request | any;
    action: string;
    entityType: string;
    entityId?: string;
    details?: string;
    userId?: string;
}
export declare class AuditLogger {
    static log({ req, action, entityType, entityId, details, userId }: LogParams): Promise<void>;
}
export {};
//# sourceMappingURL=AuditLogger.d.ts.map