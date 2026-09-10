import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * AdminStatsCard Component
 * High-density operational KPI card with trend indicators and click target.
 */
export const AdminStatsCard = ({
  title,
  value,
  comparison,
  trend, // 'up' | 'down' | 'neutral'
  icon: Icon,
  iconBg = 'bg-slate-100 text-slate-700',
  onClick,
  active = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white border transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''
      } ${
        active ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-xs' : 'border-slate-200/80'
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-slate-500 tracking-tight">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl ${iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-slate-900">
          {value !== undefined && value !== null ? value : '—'}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-medium ${
              trend === 'up'
                ? 'text-emerald-600'
                : trend === 'down'
                ? 'text-rose-600'
                : 'text-slate-500'
            }`}
          >
            {trend === 'up' ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="w-3.5 h-3.5" />
            ) : null}
          </span>
        )}
      </div>

      {comparison && (
        <p className="mt-1 text-[11px] text-slate-400 font-normal truncate">{comparison}</p>
      )}
    </div>
  );
};

export default AdminStatsCard;
