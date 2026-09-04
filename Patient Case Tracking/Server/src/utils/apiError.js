import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Standardized Operational Application Error
 */
export class ApiError extends Error {
  constructor(
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message = 'An unexpected error occurred',
    code = 'INTERNAL_ERROR',
    details = null
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Invalid request parameters', code = 'BAD_REQUEST', details = null) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, code, details);
  }

  static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED', details = null) {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message, code, details);
  }

  static forbidden(message = 'Access forbidden: Insufficient permissions', code = 'FORBIDDEN', details = null) {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message, code, details);
  }

  static notFound(message = 'Requested resource was not found', code = 'NOT_FOUND', details = null) {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message, code, details);
  }

  static conflict(message = 'Resource conflict detected', code = 'CONFLICT', details = null) {
    return new ApiError(HTTP_STATUS.CONFLICT, message, code, details);
  }

  static unprocessable(message = 'Validation failed', code = 'VALIDATION_ERROR', details = null) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, code, details);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR', details = null) {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, code, details);
  }
}

export default ApiError;
