import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getOpnames: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getOpnameDetail: (req: AuthRequest, res: Response) => Promise<void>;
export declare const initOpname: (req: AuthRequest, res: Response) => Promise<void>;
export declare const downloadTemplate: (req: AuthRequest, res: Response) => Promise<void>;
export declare const uploadOpname: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateItemNotes: (req: AuthRequest, res: Response) => Promise<void>;
export declare const verifyOpname: (req: AuthRequest, res: Response) => Promise<void>;
export declare const cancelOpname: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=stock-opname.controller.d.ts.map