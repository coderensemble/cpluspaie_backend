import { Request, Response, NextFunction } from 'express';
import { env } from '../config/environment.js';

interface CustomError extends Error {
  status?: number;
  details?: unknown;
}

export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      error: 'Invalid token',
      message: err.message,
    });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation failed',
      details: err.details,
    });
    return;
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};