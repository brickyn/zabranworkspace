import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getSuppliers: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createSupplier: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPurchases: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createPurchase: (req: AuthRequest, res: Response) => Promise<void>;
export declare const completePurchase: (req: AuthRequest, res: Response) => Promise<void>;
export declare const cancelPurchase: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=pembelian.controller.d.ts.map