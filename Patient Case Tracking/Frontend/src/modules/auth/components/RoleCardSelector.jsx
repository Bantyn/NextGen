import React from 'react';
import { Stethoscope, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ROLES, ROLE_CONFIGS } from '../../../core/config/roles';

const ROLE_ICONS = {
  [ROLES.DOCTOR]: Stethoscope,
  [ROLES.ADMIN]: ShieldCheck,
};

const ALLOWED_REGISTRATION_ROLES = [ROLES.DOCTOR, ROLES.ADMIN];

/**
 * RoleCardSelector Component
 * Interactive visual role selection grid for registration and role configuration.
 */
export const RoleCardSelector = ({ selectedRole, onSelectRole, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${className}`}>
      {ALLOWED_REGISTRATION_ROLES.map((roleKey) => {
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
                ? 'bg-sky-50/80 border-sky-300 ring-1 ring-sky-400/40 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                isSelected
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5">
                <h4
                  className={`text-xs font-medium truncate ${
                    isSelected ? 'text-slate-900 font-semibold' : 'text-slate-800'
                  }`}
                >
                  {config.shortLabel || roleKey}
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                {config.description}
              </p>
            </div>

            {isSelected && (
              <div className="absolute top-3 right-3 text-sky-600">
                <CheckCircle2 className="w-4 h-4 fill-sky-600 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default RoleCardSelector;
