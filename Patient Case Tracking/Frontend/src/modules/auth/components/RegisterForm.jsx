import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, Phone, Lock, Building, FileBadge,
  ArrowRight, Calendar, ChevronDown, Search, Loader2,
} from 'lucide-react';
import { useAuth } from '../../../core/auth/useAuth';
import { ROLES, ROLE_CONFIGS } from '../../../core/config/roles';
import { Input } from '../../../components/ui/Input';
import { Toast } from '../../../components/feedback/Toast';
import { RoleCardSelector } from './RoleCardSelector';
import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/api/apiEndpoints';

// Static fallback if server is unreachable
const FALLBACK_DEPARTMENTS = [
  'Ayush & Integrative Medicine',
  'Kayachikitsa (Internal Medicine)',
  'Panchakarma & Detox Therapy',
  'Shalya Tantra (Ayurvedic Surgery)',
  'Shalakya Tantra (ENT & Ophthalmology)',
  'Stri Roga & Prasuti Tantra (Gynaecology & Obstetrics)',
  'Kaumar Bhritya (Paediatrics)',
  'Manas Roga (Psychiatry & Mental Health)',
  'Rasayana & Geriatric Wellness',
  'Yoga & Naturopathy OPD',
  'General OPD',
  'Emergency & Triage',
  'Dermatology (Twak Roga)',
  'Orthopaedics & Marma',
  'Swasthavritta & Preventive Health',
  'Nidana (Diagnostics & Pathology)',
];

/**
 * DepartmentSelector — Searchable dropdown with live DB fetch
 */
const DepartmentSelector = ({ value, onChange }) => {
  const [departments, setDepartments] = useState(FALLBACK_DEPARTMENTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customInput, setCustomInput] = useState(false);
  const dropdownRef = useRef(null);

  // Live fetch from backend
  useEffect(() => {
    apiClient
      .get(API_ENDPOINTS.AUTH_DEPARTMENTS)
      .then((res) => {
        const data = res?.data?.data || res?.data;
        if (Array.isArray(data) && data.length > 0) {
          setDepartments(data);
        }
      })
      .catch(() => {}) // silently use fallback
      .finally(() => setIsLoading(false));
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = departments.filter((d) =>
    d.toLowerCase().includes(search.toLowerCase())
  );

  if (customInput) {
    return (
      <div className="flex flex-col gap-1.5 text-left w-full">
        <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-0.5">
          Clinical Department / Unit <span className="text-rose-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your department name..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoFocus
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30"
          />
          <button
            type="button"
            onClick={() => setCustomInput(false)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            List ↑
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 text-left w-full" ref={dropdownRef}>
      <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-0.5">
        Clinical Department / Unit <span className="text-rose-500">*</span>
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-left cursor-pointer hover:border-slate-300 transition focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30"
      >
        <span className="flex items-center gap-2 text-slate-700 truncate">
          <Building className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">{value || 'Select department...'}</span>
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {isLoading && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search departments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length > 0 ? (
              filtered.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => {
                    onChange(dept);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-4 py-2 text-xs cursor-pointer transition hover:bg-sky-50 hover:text-sky-700 ${
                    value === dept ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  {dept}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-slate-400 text-center">No matching departments</div>
            )}
          </div>

          {/* Custom input option */}
          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setCustomInput(true);
                onChange('');
              }}
              className="w-full text-xs text-sky-600 font-medium hover:text-sky-700 py-1.5 px-2 rounded-lg hover:bg-sky-50 transition cursor-pointer text-left"
            >
              + Enter custom department name
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'MALE',
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

    if (!formData.department) {
      setErrorMessage('Please select a clinical department.');
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

    if (formData.phone) {
      const cleanDigits = formData.phone.replace(/[^0-9]/g, '');
      if (cleanDigits.length < 10) {
        setErrorMessage('Please enter a valid 10-digit mobile number.');
        return;
      }
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
        age: formData.age ? Number(formData.age) : undefined,
        gender: formData.gender,
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
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
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
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-2">
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
            label="Age (Years)"
            type="number"
            min="18"
            max="120"
            placeholder="e.g. 34"
            value={formData.age}
            onChange={(e) => handleChange('age', e.target.value)}
            icon={Calendar}
          />

          <div className="flex flex-col gap-1.5 text-left w-full">
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-0.5">
              Gender
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'MALE', label: 'Male' },
                { id: 'FEMALE', label: 'Female' },
                { id: 'OTHER', label: 'Other' },
              ].map((g) => {
                const isSelected = formData.gender === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleChange('gender', g.id)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer text-center select-none ${
                      isSelected
                        ? 'bg-sky-50 border-sky-400 text-sky-700 font-semibold ring-1 ring-sky-400/30 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>
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

        {/* Live Department Selector */}
        <div className="relative">
          <DepartmentSelector
            value={formData.department}
            onChange={(val) => handleChange('department', val)}
          />
        </div>

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
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full transition-all ${pwdStrength.color}`}
                    style={{ width: `${(pwdStrength.score / 3) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
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
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => handleChange('acceptTerms', e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-0 accent-slate-900"
            />
            <span className="leading-relaxed">
              I agree to abide by the AIIA Clinical Protocol, DPDP Act 2023 regulations, and patient data confidentiality guidelines.
            </span>
          </label>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white text-sm font-normal transition active:scale-[0.99] cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Creating account...</span>
            ) : (
              <>
                <span>Create Staff Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Login Switch Link */}
      <div className="pt-4 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500 font-normal">
          Already have a staff account?{' '}
          <Link
            to="/login"
            className="text-sky-600 font-medium hover:text-sky-700 transition hover:underline ml-1"
          >
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
