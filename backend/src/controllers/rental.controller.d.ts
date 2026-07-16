import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getRentals: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createRental: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateRentalStatus: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=rental.controller.d.ts.map