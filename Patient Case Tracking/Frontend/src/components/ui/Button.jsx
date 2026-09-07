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
    'inline-flex items-center justify-center font-normal rounded-2xl transition-all duration-200 cursor-pointer select-none active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  const sizeStyles = {
    sm: 'px-3.5 py-2 text-xs gap-1.5 rounded-xl',
    md: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
    lg: 'px-6 py-3.5 text-sm sm:text-base gap-2.5 rounded-2xl',
  };

  const variantStyles = {
    primary:
      'bg-slate-950 hover:bg-slate-800 text-white shadow-xs border border-transparent',
    secondary:
      'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-2xs',
    outline:
      'bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900',
    ghost:
      'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent',
    danger:
      'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200',
    glass:
      'bg-white/90 backdrop-blur-md text-slate-800 border border-slate-200 hover:bg-slate-50 shadow-2xs',
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
