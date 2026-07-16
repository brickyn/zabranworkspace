import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getBSBMetrics: (req: Request, res: Response) => Promise<void>;
export declare const getBSBTransactions: (req: Request, res: Response) => Promise<void>;
export declare const createBSBTransaction: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getBSBActivities: (req: Request, res: Response) => Promise<void>;
export declare const createBSBActivity: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getBSBExpenses: (req: Request, res: Response) => Promise<void>;
export declare const createBSBExpense: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=bsb.controller.d.ts.map