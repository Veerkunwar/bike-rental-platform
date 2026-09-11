import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  let statusCode = err instanceof ApiError ? err.statusCode : 500;
  let message = err.message || 'Something went wrong. Please try again.';

  // Normalize known Mongoose / library errors into user-friendly messages
  // instead of leaking internal details.
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map((e: any) => e.message)
      .join(', ') || 'Invalid input.';
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} is already in use.` : 'Duplicate value.';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier supplied.';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired or invalid. Please log in again.';
  } else if (!err.isOperational && env.nodeEnv === 'production') {
    // Unknown/unexpected error in production: never leak raw internals.
    message = 'Something went wrong on our end. Please try again shortly.';
  }

  if (env.nodeEnv !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.nodeEnv !== 'production' ? { stack: err.stack } : {}),
  });
}
