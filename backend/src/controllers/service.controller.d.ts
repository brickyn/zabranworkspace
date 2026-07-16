import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getServiceJobs: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createServiceJob: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateServiceJobStatus: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=service.controller.d.ts.map