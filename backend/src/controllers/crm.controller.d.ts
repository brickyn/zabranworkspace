import { Request, Response } from 'express';
export declare const getCRMMetrics: (req: Request, res: Response) => Promise<void>;
export declare const getActivities: (req: Request, res: Response) => Promise<void>;
export declare const createActivity: (req: Request, res: Response) => Promise<void>;
export declare const getDailyReviews: (req: Request, res: Response) => Promise<void>;
export declare const createDailyReview: (req: Request, res: Response) => Promise<void>;
export declare const getCustomerData: (req: Request, res: Response) => Promise<void>;
export declare const createCustomerData: (req: Request, res: Response) => Promise<void>;
export declare const updateCustomerData: (req: Request, res: Response) => Promise<void>;
export declare const importCustomerData: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getLeaderboard: (req: Request, res: Response) => Promise<void>;
export declare const getMysteryGuests: (req: Request, res: Response) => Promise<void>;
export declare const createMysteryGuest: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=crm.controller.d.ts.map