import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Circle, Clock } from 'lucide-react';

/**
 * TriageBadge Component
 * Displays severity and clinical triage indicators matching the design reference.
 * Supports standard, moderate, red-flag, approved, completed, and pending.
 */
export const TriageBadge = ({ level = 'NORMAL', status = '', triage = '' }) => {
  const normLevel = (triage || level || '').toUpperCase();
  const normStatus = (status || '').toUpperCase();

  if (normLevel === 'RED_FLAG' || normLevel === 'RED-FLAG' || normLevel === 'HIGH' || normLevel === 'EMERGENCY') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>Red-Flag Alert</span>
      </span>
    );
  }

  if (normLevel === 'MEDIUM' || normLevel === 'MODERATE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Moderate</span>
      </span>
    );
  }

  if (normStatus === 'APPROVED' || normLevel === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Approved</span>
      </span>
    );
  }

  if (normStatus === 'COMPLETED' || normLevel === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Completed</span>
      </span>
    );
  }

  if (normStatus === 'WAITING' || normStatus === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-amber-50 text-amber-700 border border-amber-200/60 shadow-2xs">
        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
        <span>Waiting</span>
      </span>
    );
  }

  // Default Standard
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-slate-100 text-slate-600 border border-slate-200/70 shadow-2xs">
      <Circle className="w-2 h-2 text-slate-400 fill-current" />
      <span>Standard</span>
    </span>
  );
};

export default TriageBadge;
