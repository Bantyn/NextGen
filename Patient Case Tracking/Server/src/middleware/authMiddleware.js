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

    // Support simulated patient tokens for backward compatibility
    if (token.startsWith('jwt_patient_')) {
      const parts = token.split('_');
      const pId = parts.slice(2, parts.length - 1).join('_') || parts[2] || 'PATIENT';
      req.user = {
        id: pId,
        patient_id: pId,
        email: `${pId.toLowerCase()}@sehat.org`,
        name: 'Patient',
        role: 'PATIENT',
      };
      return next();
    }

    // Support simulated staff tokens for backward compatibility
    if (token.startsWith('jwt_demo_token_') || token.startsWith('jwt_simulated_') || token.startsWith('jwt_demo_')) {
      const isDoctor = token.includes('doctor');
      const isAdmin = token.includes('admin');
      req.user = {
        id: isDoctor ? 'DOC-MED-01' : 'usr_admin_01',
        doctor_id: isDoctor ? 'DOC-MED-01' : undefined,
        email: isDoctor ? 'priya@gmail.com' : 'admin@sehat.org',
        name: isDoctor ? 'Dr. Priya Sharma' : 'System Administrator',
        role: isAdmin ? 'ADMIN' : 'DOCTOR',
      };
      return next();
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded; // { id, patient_id, doctor_id, email, role, name }
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
 * Populates req.user if valid token is present, but doesn't block if missing
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

  // Check simulated tokens
  if (token.startsWith('jwt_patient_')) {
    const parts = token.split('_');
    const pId = parts.slice(2, parts.length - 1).join('_') || parts[2] || 'PATIENT';
    req.user = {
      id: pId,
      patient_id: pId,
      email: `${pId.toLowerCase()}@sehat.org`,
      name: 'Patient',
      role: 'PATIENT',
    };
    return next();
  }

  if (token.startsWith('jwt_demo_token_') || token.startsWith('jwt_simulated_') || token.startsWith('jwt_demo_')) {
    const isDoctor = token.includes('doctor');
    const isAdmin = token.includes('admin');
    req.user = {
      id: isDoctor ? 'DOC-MED-01' : 'usr_admin_01',
      doctor_id: isDoctor ? 'DOC-MED-01' : undefined,
      email: isDoctor ? 'priya@gmail.com' : 'admin@sehat.org',
      name: isDoctor ? 'Dr. Priya Sharma' : 'System Administrator',
      role: isAdmin ? 'ADMIN' : 'DOCTOR',
    };
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
