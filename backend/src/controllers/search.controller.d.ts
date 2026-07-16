import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
/**
 * Global Search endpoint — search Products, Customers, Transactions, Service Jobs
 * GET /api/v1/search?q=<query>&type=all|product|customer|transaction|service
 */
export declare const globalSearch: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=search.controller.d.ts.map