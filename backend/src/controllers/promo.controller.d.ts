import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getPromos: (req: Request, res: Response) => Promise<void>;
export declare const createPromo: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updatePromo: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deletePromo: (req: AuthRequest, res: Response) => Promise<void>;
export declare const validateVoucher: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=promo.controller.d.ts.map