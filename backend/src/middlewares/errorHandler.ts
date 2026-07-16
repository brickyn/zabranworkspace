import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;
  
  console.error('[GLOBAL ERROR]', err);

  // Prisma Client Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') || 'Field';
      error = new AppError(`Duplicate entry for ${field}`, 400);
    } else if (err.code === 'P2025') {
      error = new AppError('Record not found', 404);
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    error = new AppError('Invalid database query', 400);
  }

  // Zod Validation Errors
  if (err instanceof ZodError) {
    const messages = (err as any).errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
    error = new AppError(`Validation failed: ${messages}`, 400);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token, please login again.', 401);
  } else if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired, please login again.', 401);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' && !error.isOperational ? 'Internal Server Error' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
