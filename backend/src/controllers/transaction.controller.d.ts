import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getTransactions: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createTransaction: (req: AuthRequest, res: Response) => Promise<void>;
export declare const voidTransaction: (req: AuthRequest, res: Response) => Promise<void>;
export declare const returnTransaction: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=transaction.controller.d.ts.map