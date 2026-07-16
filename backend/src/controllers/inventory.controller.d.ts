import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare const getStock: (req: Request, res: Response) => Promise<void>;
export declare const getStockSummary: (req: AuthRequest, res: Response) => Promise<void>;
export declare const validateSerialNumber: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addStock: (req: AuthRequest, res: Response) => Promise<void>;
export declare const bulkImport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const batchEdit: (req: AuthRequest, res: Response) => Promise<void>;
export declare const setPromotion: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTransfers: (req: Request, res: Response) => Promise<void>;
export declare const getSuratJalanById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createTransfers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateTransferStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const bulkReceiveTransfers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getProductLogs: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=inventory.controller.d.ts.map