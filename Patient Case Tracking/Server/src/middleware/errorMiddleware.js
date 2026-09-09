import { ApiError } from '../utils/apiError.js';
import { sendError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { logger } from '../utils/logger.js';

/**
 * Global Centralized Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  // If headers are already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  logger.error(`[ErrorHandler] ${req.method} ${req.originalUrl} - Error: ${err.message}`, {
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    code: err.code,
  });

  // 1. Handled Operational ApiError
  if (err instanceof ApiError) {
    return sendError(res, err.statusCode, err.message, err.code, err.details);
  }

  // 2. Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const message = `Duplicate value entered for unique field: '${field}'. Value already exists.`;
    return sendError(res, HTTP_STATUS.CONFLICT, message, 'DUPLICATE_KEY', { field });
  }

  // 3. Mongoose Cast Error (Invalid ObjectId or Type)
  if (err.name === 'CastError') {
    const message = `Invalid identifier format: '${err.value}' for field '${err.path}'.`;
    return sendError(res, HTTP_STATUS.BAD_REQUEST, message, 'INVALID_ID_FORMAT', { field: err.path });
  }

  // 4. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Mongoose validation failed', 'VALIDATION_ERROR', errors);
  }

  // 5. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid authentication token', 'TOKEN_INVALID');
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication token expired', 'TOKEN_EXPIRED');
  }

  // 6. Multer File Upload Errors
  if (err.name === 'MulterError') {
    return sendError(res, HTTP_STATUS.BAD_REQUEST, `File upload error: ${err.message}`, 'FILE_UPLOAD_ERROR');
  }

  // 7. Generic Unhandled Server Error (500)
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd ? 'An unexpected internal server error occurred.' : err.message;
  return sendError(
    res,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message,
    'INTERNAL_SERVER_ERROR',
    !isProd ? { stack: err.stack } : null
  );
};

/**
 * 404 Route Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`, 'ROUTE_NOT_FOUND'));
};

export default {
  errorHandler,
  notFoundHandler,
};
