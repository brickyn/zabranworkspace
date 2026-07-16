import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getProducts: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getProductById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createProduct: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateProduct: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteProduct: (req: AuthRequest, res: Response) => Promise<void>;
export declare const importBulkProducts: (req: AuthRequest, res: Response) => Promise<void>;
export declare const bulkUpdateProducts: (req: AuthRequest, res: Response) => Promise<void>;
export declare const bulkDeleteProducts: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=product.controller.d.ts.map