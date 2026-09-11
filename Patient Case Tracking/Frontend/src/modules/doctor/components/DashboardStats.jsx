import React from 'react';
import { Users, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * DashboardStats Component
 * Displays the 4 primary clinical KPI cards.
 */
export const DashboardStats = ({ stats, onTriageClick, onPendingClick, onCompletedClick }) => {
  const {
    totalOPD = 28,
    awaitingReview = 3,
    emergencyTriage = 1,
    completedToday = 24,
  } = stats || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total OPD Intake */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400 font-medium mb-1">
          <span>Total OPD Intake</span>
          <Users className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-normal text-slate-900">{totalOPD} Patients</span>
          <span className="text-xs text-slate-400 font-normal">Today</span>
        </div>
      </div>

      {/* 2. Awaiting Review */}
      <div
        onClick={onPendingClick}
        className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-sm transition cursor-pointer"
        title="View pending reviews"
      >
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400 font-medium mb-1">
          <span>Awaiting Review</span>
          <Clock className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-normal text-slate-900">{awaitingReview} Active</span>
          <span className="text-xs text-amber-600 font-medium">In Lounge</span>
        </div>
      </div>

      {/* 3. Emergency Triage */}
      <div
        onClick={onTriageClick}
        className={`p-5 rounded-2xl border shadow-xs transition cursor-pointer ${
          emergencyTriage > 0
            ? 'bg-rose-50/70 border-rose-200 text-rose-900 hover:bg-rose-100/70'
            : 'bg-white border-slate-200/80 hover:border-slate-300'
        }`}
        title="View emergency triage alerts"
      >
        <div className="flex items-center justify-between text-xs uppercase tracking-wider font-medium mb-1 opacity-70">
          <span>Emergency Triage</span>
          <AlertTriangle className={`w-4 h-4 ${emergencyTriage > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-normal">
            {emergencyTriage > 0 ? `${emergencyTriage} Red-Flag` : '0 Alerts'}
          </span>
          <span className="text-xs opacity-75">Immediate Attention</span>
        </div>
      </div>

      {/* 4. Completed Today */}
      <div
        onClick={onCompletedClick}
        className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-sm transition cursor-pointer"
        title="View completed cases"
      >
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400 font-medium mb-1">
          <span>Completed Today</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-normal text-slate-900">{completedToday} Discharged</span>
          <span className="text-xs text-emerald-600 font-medium">Verified</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
