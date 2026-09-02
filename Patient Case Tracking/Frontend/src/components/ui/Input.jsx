import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

/**
 * Input Component — Reusable Base Form Input
 * Supports floating helper labels, left icons, password reveal toggles, and validation error states.
 */
export const Input = ({
  label,
  error,
  helperText,
  icon: Icon,
  type = 'text',
  isPassword = false,
  required = false,
  fullWidth = true,
  className = '',
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1.5 text-left ${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-[var(--text-secondary)] flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          type={resolvedType}
          required={required}
          className={`w-full text-sm font-normal rounded-xl bg-[var(--surface-input)] border transition-all duration-200 outline-none
            text-[var(--text-main)] placeholder:text-[var(--text-muted)]
            ${Icon ? 'pl-10' : 'pl-3.5'}
            ${isPassword ? 'pr-10' : 'pr-3.5'}
            py-2.5
            ${
              error
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-[var(--border-subtle)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]'
            }`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-md transition cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error ? (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-0.5 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Input;
