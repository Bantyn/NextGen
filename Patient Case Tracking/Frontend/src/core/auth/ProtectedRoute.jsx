import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ROLES, ROLE_CONFIGS } from '../config/roles';

/**
 * ProtectedRoute Component
 * Guards routes against unauthenticated access and enforces strict Role-Based Access Control (RBAC).
 * Enforces mutual exclusivity:
 * - Patient cannot open Doctor or Admin URLs (redirects to /patient/dashboard).
 * - Doctor cannot open Admin or Patient URLs (redirects to /doctor).
 * - Admin cannot open Doctor or Patient URLs (redirects to /admin).
 */
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[var(--text-muted)] font-normal">Authenticating session...</span>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated: Redirect to the appropriate portal login
  if (!isAuthenticated) {
    const isPatientTarget = allowedRoles.includes(ROLES.PATIENT);
    const loginTarget = isPatientTarget ? '/patient/login' : '/login';
    return <Navigate to={loginTarget} state={{ from: location }} replace />;
  }

  // 2. Authenticated but Unauthorized Role: Instant smart redirection to their own portal
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const targetRoute = ROLE_CONFIGS[role]?.defaultRoute || '/';
    return <Navigate to={targetRoute} state={{ unauthorizedAttempt: location.pathname }} replace />;
  }

  return children;
};

/**
 * PublicOnlyRoute Component
 * For login/register pages. If a user is ALREADY authenticated, redirects them directly
 * to their respective dashboard instead of showing the login forms:
 * - Patient -> /patient/dashboard
 * - Doctor  -> /doctor
 * - Admin   -> /admin
 */
export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && role) {
    const targetRoute = ROLE_CONFIGS[role]?.defaultRoute || '/';
    return <Navigate to={targetRoute} replace />;
  }

  return children;
};

/**
 * PatientKioskRoute Component
 * For hospital kiosk intake pages (/patient/register, /patient/intake, /patient/success).
 * Allows unauthenticated kiosk users or logged-in patients.
 * If a Doctor or Admin is logged in, redirects them back to their doctor/admin workspace.
 */
export const PatientKioskRoute = ({ children }) => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && (role === ROLES.DOCTOR || role === ROLES.ADMIN)) {
    const targetRoute = ROLE_CONFIGS[role]?.defaultRoute || '/';
    return <Navigate to={targetRoute} replace />;
  }

  return children;
};

export default ProtectedRoute;

