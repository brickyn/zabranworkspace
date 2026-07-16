import { Request, Response } from 'express';
/**
 * Get historical dashboard data for multi-year comparison
 * GET /api/v1/dashboard/historical?yearFrom=2023&yearTo=2026&branchId=all
 */
export declare const getHistoricalData: (req: Request, res: Response) => Promise<void>;
/**
 * Get sales summary: payment methods, cashier perf, branch perf
 * GET /api/v1/dashboard/sales-summary?month=7&year=2026&branchId=all
 */
export declare const getSalesSummary: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=dashboardExtra.controller.d.ts.map