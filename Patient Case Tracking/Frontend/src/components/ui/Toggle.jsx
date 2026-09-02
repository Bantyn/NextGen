import React from 'react';

/**
 * Toggle Component — Reusable Switch Control
 */
export const Toggle = ({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className = '',
}) => {
  const toggleId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <label
      htmlFor={toggleId}
      className={`flex items-start gap-3 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div className="relative inline-flex items-center shrink-0 mt-0.5">
        <input
          id={toggleId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange && onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-10 h-6 bg-[var(--surface-input)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)] border border-[var(--border-subtle)]" />
      </div>

      {(label || description) && (
        <div className="flex flex-col text-left">
          {label && <span className="text-sm font-medium text-[var(--text-main)]">{label}</span>}
          {description && <span className="text-xs text-[var(--text-muted)] mt-0.5">{description}</span>}
        </div>
      )}
    </label>
  );
};

export default Toggle;
