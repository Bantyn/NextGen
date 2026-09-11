import React from 'react';

/**
 * AdminStatusBadge Component
 * Standardized status indicators across the Sehat Admin Panel.
 */
export const AdminStatusBadge = ({ status, variant, size = 'sm' }) => {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (variant === 'priority' || ['EMERGENCY', 'CRITICAL', 'HIGH_PRIORITY'].includes(normalized)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200/80';
  } else if (['URGENT', 'WARNING', 'MODERATE', 'TRIAGE_REQUIRED'].includes(normalized)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200/80';
  } else if (['AVAILABLE', 'HEALTHY', 'COMPLETED', 'RESOLVED', 'ON_DUTY', 'ALL_SYSTEMS_OPERATIONAL', 'CHECKED_IN'].includes(normalized)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  } else if (['IN_PROGRESS', 'READY_FOR_DOCTOR', 'BUSY', 'BROADCASTING'].includes(normalized)) {
    styles = 'bg-sky-50 text-sky-700 border-sky-200/80';
  } else if (['OFFLINE', 'ON_BREAK', 'CANCELLED'].includes(normalized)) {
    styles = 'bg-slate-100 text-slate-500 border-slate-200';
  }

  const sizeClass = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full tracking-wide capitalize ${sizeClass} ${styles}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{normalized.replace(/_/g, ' ').toLowerCase()}</span>
    </span>
  );
};

export default AdminStatusBadge;
