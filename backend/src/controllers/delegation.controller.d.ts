import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getDelegations: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createDelegation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const revokeDelegation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=delegation.controller.d.ts.map