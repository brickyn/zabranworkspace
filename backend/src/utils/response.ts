import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  message?: string;
  data?: T;
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}

export const sendSuccess = <T>(res: Response, data?: T, message?: string, statusCode = 200) => {
  const response: SuccessResponse<T> = { success: true };
  if (message) response.message = message;
  if (data !== undefined) response.data = data;
  
  return res.status(statusCode).json(response);
};

export const sendError = (res: Response, error: string, statusCode = 500, details?: any) => {
  const response: ErrorResponse = { success: false, error };
  if (details) response.details = details;
  
  return res.status(statusCode).json(response);
};
