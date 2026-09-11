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
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/70 to-slate-50 border border-sky-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Instant Demo Logins (Click to Autofill):</span>
          </span>
          <span className="text-[11px] text-slate-500 font-normal">1-Click Fast Track</span>
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
                className={`px-3.5 py-2.5 rounded-xl text-xs font-normal transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <DemoIcon className="w-4 h-4 shrink-0 text-current" />
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
      <form onSubmit={handleSubmit} className="space-y-5">
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
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-0 accent-slate-900"
            />
            <span>Remember this device</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-sky-600 hover:text-sky-700 font-medium transition hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button — Identical to Patient Intake Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white text-sm font-normal transition active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In to Clinical Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Register Switch Link */}
      <div className="pt-4 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500 font-normal">
          Need a new hospital staff or doctor account?{' '}
          <Link
            to="/register"
            className="text-sky-600 font-medium hover:text-sky-700 transition hover:underline ml-1"
          >
            Register Staff Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
