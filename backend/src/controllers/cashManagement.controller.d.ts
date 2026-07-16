import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getCashManagements: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createCashManagement: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteCashManagement: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCashBalance: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=cashManagement.controller.d.ts.map