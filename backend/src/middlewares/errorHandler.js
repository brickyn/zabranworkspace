"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../utils/AppError");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    console.error('[GLOBAL ERROR]', err);
    // Prisma Client Errors
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            const field = err.meta?.target?.join(', ') || 'Field';
            error = new AppError_1.AppError(`Duplicate entry for ${field}`, 400);
        }
        else if (err.code === 'P2025') {
            error = new AppError_1.AppError('Record not found', 404);
        }
    }
    else if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        error = new AppError_1.AppError('Invalid database query', 400);
    }
    // Zod Validation Errors
    if (err instanceof zod_1.ZodError) {
        const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        error = new AppError_1.AppError(`Validation failed: ${messages}`, 400);
    }
    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        error = new AppError_1.AppError('Invalid token, please login again.', 401);
    }
    else if (err.name === 'TokenExpiredError') {
        error = new AppError_1.AppError('Token expired, please login again.', 401);
    }
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        error: process.env.NODE_ENV === 'production' && !error.isOperational ? 'Internal Server Error' : message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map