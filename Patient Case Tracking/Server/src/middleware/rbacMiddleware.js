import { ApiError } from '../utils/apiError.js';

/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route execution to specific system roles
 *
 * @param  {...string} allowedRoles Roles permitted to access the resource
 */
export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication is required before authorization check.', 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Required: [${allowedRoles.join(', ')}]`,
          'FORBIDDEN_ROLE'
        )
      );
    }

    next();
  };
};

export default restrictTo;
