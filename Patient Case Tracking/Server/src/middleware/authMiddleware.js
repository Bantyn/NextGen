import { verifyToken } from '../utils/generateToken.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

/**
 * Authentication Middleware
 * Extracts and verifies JWT from Authorization header
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication required. Missing or malformed Bearer token.', 'TOKEN_MISSING');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw ApiError.unauthorized('Authentication token is missing.', 'TOKEN_MISSING');
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded; // { id, email, role, name }
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Authentication token has expired. Please log in again.', 'TOKEN_EXPIRED');
      }
      throw ApiError.unauthorized('Invalid authentication token signature.', 'TOKEN_INVALID');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Authentication Middleware
 * Populates req.user if token is present, but doesn't block if missing
 */
export const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
  } catch (err) {
    logger.debug('[OptionalAuth] Token present but invalid, proceeding as anonymous');
  }

  next();
};

export default {
  authenticate,
  optionalAuthenticate,
};
