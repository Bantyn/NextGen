import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Toast Alert Component
 */
export const Toast = ({
  type = 'info', // 'success' | 'error' | 'warning' | 'info'
  title,
  message,
  onClose,
  className = '',
}) => {
  const configs = {
    success: {
      icon: CheckCircle2,
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/40 text-emerald-300',
      iconColor: 'text-emerald-400',
    },
    error: {
      icon: AlertCircle,
      border: 'border-rose-500/30',
      bg: 'bg-rose-950/40 text-rose-300',
      iconColor: 'text-rose-400',
    },
    warning: {
      icon: AlertTriangle,
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/40 text-amber-300',
      iconColor: 'text-amber-400',
    },
    info: {
      icon: Info,
      border: 'border-sky-500/30',
      bg: 'bg-sky-950/40 text-sky-300',
      iconColor: 'text-sky-400',
    },
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md ${config.bg} ${config.border} shadow-lg transition-all ${className}`}
      role="alert"
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 text-left">
        {title && <h4 className="text-sm font-medium text-[var(--text-main)]">{title}</h4>}
        {message && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-lg transition cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Toast;
