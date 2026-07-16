import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getPartners: (req: Request, res: Response) => Promise<void>;
export declare const createPartner: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updatePartner: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deletePartner: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getActivities: (req: Request, res: Response) => Promise<void>;
export declare const createActivity: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getSchedules: (req: Request, res: Response) => Promise<void>;
export declare const createSchedule: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createBatchSchedules: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTransactions: (req: Request, res: Response) => Promise<void>;
export declare const createTransaction: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMaintenanceLogs: (req: Request, res: Response) => Promise<void>;
export declare const createMaintenanceLog: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getB2BMetrics: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=b2b.controller.d.ts.map