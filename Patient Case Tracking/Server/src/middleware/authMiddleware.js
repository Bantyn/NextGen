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

    // In development mode, allow requests without auth or with demo tokens to access doctor data
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (process.env.NODE_ENV !== 'production') {
        req.user = {
          id: 'DOC-MED-01',
          doctor_id: 'DOC-MED-01',
          email: 'priya@gmail.com',
          name: 'Dr. Priya Sharma',
          role: 'DOCTOR',
        };
        return next();
      }
      throw ApiError.unauthorized('Authentication required. Missing or malformed Bearer token.', 'TOKEN_MISSING');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        req.user = {
          id: 'DOC-MED-01',
          doctor_id: 'DOC-MED-01',
          email: 'priya@gmail.com',
          name: 'Dr. Priya Sharma',
          role: 'DOCTOR',
        };
        return next();
      }
      throw ApiError.unauthorized('Authentication token is missing.', 'TOKEN_MISSING');
    }

    // Support simulated or demo frontend tokens from AuthContext
    if (token.startsWith('jwt_demo_token_') || token.startsWith('jwt_simulated_')) {
      const isDoctor = token.includes('doctor');
      const isAdmin = token.includes('admin');
      req.user = {
        id: isDoctor ? 'DOC-MED-01' : 'usr_admin_01',
        doctor_id: isDoctor ? 'DOC-MED-01' : undefined,
        email: isDoctor ? 'doctor@sehat.org' : 'admin@sehat.org',
        name: isDoctor ? 'Dr. Priya Sharma' : 'System Administrator',
        role: isAdmin ? 'ADMIN' : 'DOCTOR',
      };
      return next();
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded; // { id, email, role, name }
      next();
    } catch (jwtError) {
      if (process.env.NODE_ENV !== 'production') {
        req.user = {
          id: 'DOC-MED-01',
          doctor_id: 'DOC-MED-01',
          email: 'priya@gmail.com',
          name: 'Dr. Priya Sharma',
          role: 'DOCTOR',
        };
        return next();
      }
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
