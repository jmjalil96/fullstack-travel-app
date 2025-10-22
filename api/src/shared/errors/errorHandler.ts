import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors.js';
import { env } from '../../config/env.js';
import { logger } from '../middleware/logger.js';

interface ErrorResponse {
  error: string;
  statusCode: number;
  metadata?: Record<string, unknown>;
  stack?: string;
}

/**
 * Global error handling middleware
 * Must be registered LAST in the middleware chain
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default to 500 if not an operational error
  let statusCode = 500;
  let message = 'Internal server error';
  let metadata: Record<string, unknown> | undefined;
  let isOperational = false;

  // Handle known AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    metadata = err.metadata;
    isOperational = err.isOperational;
  } else {
    // Unexpected error - log full details
    message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  }

  // Log error
  if (!isOperational || statusCode >= 500) {
    logger.error(
      {
        err,
        statusCode,
        path: req.path,
        method: req.method,
        isOperational,
      },
      err.message
    );
  }

  // Build response
  const response: ErrorResponse = {
    error: message,
    statusCode,
  };

  if (metadata) {
    response.metadata = metadata;
  }

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
