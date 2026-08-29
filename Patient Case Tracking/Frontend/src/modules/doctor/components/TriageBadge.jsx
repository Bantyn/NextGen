import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Circle } from 'lucide-react';

/**
 * TriageBadge Component
 * Displays severity and status indicators with Untitled UI / Lucide icons (no emojis).
 */
export const TriageBadge = ({ level = 'NORMAL', status = '' }) => {
  if (level === 'RED_FLAG' || level === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-rose-50 text-rose-700 border border-rose-200/80 animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>Red-Flag Alert</span>
      </span>
    );
  }

  if (level === 'MEDIUM' || level === 'MODERATE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-amber-50 text-amber-700 border border-amber-200/80">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Moderate</span>
      </span>
    );
  }

  if (status === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Approved</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-slate-100 text-slate-600 border border-slate-200/60">
      <Circle className="w-2.5 h-2.5 text-slate-400 fill-current" />
      <span>Standard</span>
    </span>
  );
};

export default TriageBadge;
