import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Building, FileBadge, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import { ROLES, ROLE_CONFIGS } from '../../../core/config/roles';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Toast } from '../../../components/feedback/Toast';
import { RoleCardSelector } from './RoleCardSelector';

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: ROLES.DOCTOR,
    department: 'Ayush & Integrative Medicine',
    license: '',
    password: '',
    confirmPassword: '',
    acceptTerms: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMessage('');
  };

  // Password strength calculator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2 || score === 3) return { score: 2, label: 'Moderate', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const pwdStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      setErrorMessage('Please fill in all mandatory fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (!formData.acceptTerms) {
      setErrorMessage('Please accept the Institutional Data Protection & DPDP terms.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
        license: formData.license || `AIIA-${formData.role.slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`,
        password: formData.password,
      });

      setSuccessMessage('Staff account created successfully! Redirecting...');
      setTimeout(() => {
        const targetRoute = ROLE_CONFIGS[result?.user?.role]?.defaultRoute || '/doctor';
        navigate(targetRoute, { replace: true });
      }, 800);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {errorMessage && (
        <Toast
          type="error"
          message={errorMessage}
          onClose={() => setErrorMessage('')}
          className="animate-fadeIn"
        />
      )}
      {successMessage && (
        <Toast
          type="success"
          message={successMessage}
          className="animate-fadeIn"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Select Staff Role */}
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-2">
            Select Hospital Role <span className="text-rose-500">*</span>
          </label>
          <RoleCardSelector
            selectedRole={formData.role}
            onSelectRole={(role) => handleChange('role', role)}
          />
        </div>

        {/* Step 2: Personal & Contact Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name & Title"
            required
            placeholder="e.g. Dr. Aarav Sharma"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            icon={User}
          />

          <Input
            label="Hospital Email Address"
            type="email"
            required
            placeholder="e.g. doctor@sehat.org"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            icon={Mail}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Mobile Number (+91)"
            type="tel"
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            icon={Phone}
          />

          <Input
            label="Medical License / Staff ID"
            placeholder="e.g. AIIA-DOC-8941"
            value={formData.license}
            onChange={(e) => handleChange('license', e.target.value)}
            icon={FileBadge}
          />
        </div>

        <Input
          label="Clinical Department / Unit"
          placeholder="e.g. Kayachikitsa & Ayush OPD"
          value={formData.department}
          onChange={(e) => handleChange('department', e.target.value)}
          icon={Building}
        />

        {/* Step 3: Password & Security */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Password"
              isPassword
              required
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              icon={Lock}
            />
            {formData.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full transition-all ${pwdStrength.color}`}
                    style={{ width: `${(pwdStrength.score / 3) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                  {pwdStrength.label}
                </span>
              </div>
            )}
          </div>

          <Input
            label="Confirm Password"
            isPassword
            required
            placeholder="••••••••••••"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            icon={Lock}
          />
        </div>

        {/* Institutional Consent Checkbox */}
        <div className="p-3 rounded-xl bg-[var(--surface-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => handleChange('acceptTerms', e.target.checked)}
              className="mt-0.5 rounded border-[var(--border-subtle)] text-[var(--primary)] focus:ring-0 accent-[var(--primary)]"
            />
            <span className="leading-relaxed">
              I agree to abide by the AIIA Clinical Protocol, DPDP Act 2023 regulations, and patient data confidentiality guidelines.
            </span>
          </label>
        </div>

        {/* Submit Action */}
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
            Create Staff Account
          </Button>
        </div>
      </form>

      {/* Login Switch Link */}
      <div className="pt-4 border-t border-[var(--border-subtle)] text-center">
        <p className="text-xs text-[var(--text-secondary)]">
          Already have a staff account?{' '}
          <Link
            to="/login"
            className="text-sky-400 font-medium hover:text-sky-300 transition hover:underline ml-1"
          >
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
