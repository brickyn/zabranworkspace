import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        name: string;
        role: string;
        branchId: string | null;
        permissions?: string[];
    };
}
export declare const authenticateJWT: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const authorizeRole: (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requirePermission: (permission: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map