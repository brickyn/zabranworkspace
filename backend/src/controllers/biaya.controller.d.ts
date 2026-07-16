import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getExpenses: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createExpense: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteExpense: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=biaya.controller.d.ts.map