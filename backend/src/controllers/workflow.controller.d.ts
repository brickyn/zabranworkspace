import { Request, Response } from 'express';
export declare const createWorkflow: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const addState: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const addTransition: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getWorkflowHistory: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getAvailableTransitions: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const executeTransition: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=workflow.controller.d.ts.map