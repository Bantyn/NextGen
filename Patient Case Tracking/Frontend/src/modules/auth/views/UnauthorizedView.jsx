import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Stethoscope, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import { ROLES, ROLE_CONFIGS } from '../../../core/config/roles';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

/**
 * UnauthorizedView Component (403 Forbidden)
 * Displays access restriction notice with instant demo role switcher for evaluators.
 */
export const UnauthorizedView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, switchDemoRole } = useAuth();

  const requestedRoles = location.state?.requestedRole || ['DOCTOR'];
  const userRoleConfig = ROLE_CONFIGS[role] || {};

  const handleQuickSwitchToDoctor = () => {
    switchDemoRole(ROLES.DOCTOR);
    navigate('/doctor', { replace: true });
  };

  return (
    <div className="w-full min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 text-center">
      <div className="max-w-md w-full rounded-[28px] bg-[var(--surface-card)] border border-rose-500/20 shadow-2xl backdrop-blur-2xl p-8 space-y-6">
        {/* Shield Alert Icon */}
        <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <Badge variant="danger" size="sm" className="mb-2">
            403 • Access Restricted
          </Badge>
          <h1 className="text-2xl font-normal text-[var(--text-main)] tracking-tight">
            Role Authorization Required
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 font-normal leading-relaxed">
            Your current account (<span className="text-[var(--text-main)] font-medium">{user?.name || 'Staff User'}</span>) has role{' '}
            <strong className="text-sky-400">{userRoleConfig.label || role}</strong>, which does not have permission to view this clinical module.
          </p>
        </div>

        {/* Evaluator Quick Role Switch Box */}
        <div className="p-4 rounded-2xl bg-[var(--surface-input)] border border-[var(--border-subtle)] text-left space-y-2">
          <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Hackathon Evaluator Quick-Switch</span>
          </span>
          <p className="text-[11px] text-[var(--text-muted)] leading-normal">
            Switch your active profile to Physician / Doctor to preview clinical case review & prescription features:
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            fullWidth
            onClick={handleQuickSwitchToDoctor}
            icon={Stethoscope}
          >
            Switch to Dr. Aarav Sharma (Doctor Role)
          </Button>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate('/')}
            icon={ArrowLeft}
          >
            Return to Home
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => navigate('/login')}
          >
            Switch Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedView;
