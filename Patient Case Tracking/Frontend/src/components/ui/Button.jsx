import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button Component — Reusable Base UI Control
 * Compliant with Sehat Theme & Design Tokens
 */
export const Button = ({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm hover:shadow-[var(--shadow-glow)] border border-transparent',
    secondary:
      'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700/50 shadow-xs',
    outline:
      'bg-transparent border border-[var(--border-medium)] text-[var(--text-main)] hover:bg-[var(--primary-light)] hover:border-[var(--primary-border)] hover:text-[var(--primary)]',
    ghost:
      'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--border-subtle)] border border-transparent',
    danger:
      'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 hover:border-rose-500/50',
    glass:
      'bg-[var(--glass-bg)] backdrop-blur-md text-[var(--text-main)] border border-[var(--glass-border)] hover:border-[var(--primary-border)] hover:bg-[var(--surface-card-hover)] shadow-xs',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;
