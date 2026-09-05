import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles, Stethoscope, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import { DEMO_USERS, ROLES, ROLE_CONFIGS } from '../../../core/config/roles';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Toast } from '../../../components/feedback/Toast';

export const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedDemoRole, setSelectedDemoRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Destination redirect path
  const from = location.state?.from?.pathname || null;

  // Handle Quick Demo Role Pill Click
  const handleSelectDemo = (demoUser) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
    setSelectedDemoRole(demoUser.role);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both your staff email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await login(email, password);
      const userRole = result?.user?.role || ROLES.DOCTOR;
      const targetRoute = from || ROLE_CONFIGS[userRole]?.defaultRoute || '/doctor';
      navigate(targetRoute, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1-Click Quick Demo Access Bar for Fast Review */}
      <div className="p-3.5 rounded-2xl bg-[var(--surface-input)] border border-[var(--border-subtle)] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Demo Logins (Click to Autofill):</span>
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">1-Click Fast Track</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {DEMO_USERS.map((demo) => {
            const isSelected = selectedDemoRole === demo.role || email === demo.email;
            const DemoIcon = demo.role === ROLES.ADMIN ? ShieldCheck : Stethoscope;

            return (
              <button
                key={demo.role}
                type="button"
                onClick={() => handleSelectDemo(demo)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                    : 'bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-main)] hover:border-[var(--border-medium)]'
                }`}
              >
                <DemoIcon className="w-4 h-4 shrink-0" />
                <span>{demo.role.charAt(0) + demo.role.slice(1).toLowerCase()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Toast
          type="error"
          message={errorMessage}
          onClose={() => setErrorMessage('')}
          className="animate-fadeIn"
        />
      )}

      {/* Login Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Hospital Staff Email"
          type="email"
          required
          autoComplete="email"
          placeholder="e.g. doctor@sehat.org"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrorMessage('');
          }}
          icon={Mail}
        />

        <Input
          label="Password"
          isPassword
          required
          autoComplete="current-password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrorMessage('');
          }}
          icon={Lock}
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-[var(--border-subtle)] text-[var(--primary)] focus:ring-0 focus:ring-offset-0 accent-[var(--primary)]"
            />
            <span>Remember this device</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-sky-400 hover:text-sky-300 transition hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            icon={ArrowRight}
            iconPosition="right"
          >
            Sign In to Clinical Workspace
          </Button>
        </div>
      </form>

      {/* Register Switch Link */}
      <div className="pt-4 border-t border-[var(--border-subtle)] text-center">
        <p className="text-xs text-[var(--text-secondary)]">
          Need a new hospital staff or doctor account?{' '}
          <Link
            to="/register"
            className="text-sky-400 font-medium hover:text-sky-300 transition hover:underline ml-1"
          >
            Register Staff Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
