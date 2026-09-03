import React from 'react';
import { Stethoscope, HeartPulse, UserCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ROLES, ROLE_CONFIGS } from '../../../core/config/roles';

const ROLE_ICONS = {
  [ROLES.DOCTOR]: Stethoscope,
  [ROLES.NURSE]: HeartPulse,
  [ROLES.RECEPTIONIST]: UserCheck,
  [ROLES.ADMIN]: ShieldCheck,
};

/**
 * RoleCardSelector Component
 * Interactive visual role selection grid for registration and role configuration.
 */
export const RoleCardSelector = ({ selectedRole, onSelectRole, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${className}`}>
      {Object.values(ROLES).map((roleKey) => {
        const config = ROLE_CONFIGS[roleKey] || {};
        const Icon = ROLE_ICONS[roleKey] || Stethoscope;
        const isSelected = selectedRole === roleKey;

        return (
          <button
            key={roleKey}
            type="button"
            onClick={() => onSelectRole(roleKey)}
            className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer select-none relative ${
              isSelected
                ? 'bg-[var(--primary-light)] border-[var(--primary)] shadow-[0_0_16px_var(--primary-glow)] ring-1 ring-[var(--primary)]'
                : 'bg-[var(--surface-input)] border-[var(--border-subtle)] hover:border-[var(--border-medium)] hover:bg-[var(--surface-card-hover)]'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                isSelected
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-slate-800 text-[var(--text-secondary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5">
                <h4
                  className={`text-xs font-medium truncate ${
                    isSelected ? 'text-[var(--text-main)] font-semibold' : 'text-[var(--text-main)]'
                  }`}
                >
                  {config.shortLabel || roleKey}
                </h4>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-0.5 leading-tight">
                {config.description}
              </p>
            </div>

            {isSelected && (
              <div className="absolute top-3 right-3 text-[var(--primary)]">
                <CheckCircle2 className="w-4 h-4 fill-[var(--primary)] text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default RoleCardSelector;
