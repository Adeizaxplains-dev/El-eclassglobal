import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Single place that turns any thrown error into the API's standard
 * error envelope. Must be registered LAST, after all routes.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => e.message);
    message = 'Validation failed';
  }

  // Mongoose bad ObjectId cast
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {}).join(', ');
    message = `Duplicate value for field: ${field}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  const isOperational = err.isOperational || statusCode < 500;

  if (!isOperational) {
    // Unexpected bug — log full detail server-side, never leak internals to client.
    logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.originalUrl });
    if (env.isProduction) {
      message = 'Internal server error';
    }
  } else {
    logger.warn('Handled operational error', { message, path: req.originalUrl });
  }

  return sendError(res, { message, statusCode, errors });
}
