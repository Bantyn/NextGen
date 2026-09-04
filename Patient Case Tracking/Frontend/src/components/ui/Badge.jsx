import React from 'react';

/**
 * Badge Component — Reusable Clinical & Status Badge
 */
export const Badge = ({
  children,
  variant = 'neutral', // 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral'
  size = 'sm', // 'xs' | 'sm' | 'md'
  icon: Icon,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
  };

  const variantStyles = {
    primary: 'bg-sky-500/10 text-sky-400 border border-sky-500/25',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/25',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/25',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/25',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/25',
    neutral: 'bg-slate-500/10 text-slate-300 border border-slate-500/20',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
