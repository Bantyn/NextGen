import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

/**
 * DashboardHeader Component
 * Clean clinical hero banner matching the reference design.
 */
export const DashboardHeader = () => {
  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:justify-between gap-6 shadow-xs relative overflow-hidden">
      {/* Subtle Background Halos */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-sky-100/50 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-48 h-48 bg-indigo-100/40 rounded-full blur-[50px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-[10px] uppercase tracking-widest font-medium mb-3 border border-sky-100 shadow-2xs">
          <Sparkles className="w-3 h-3 text-sky-500" />
          <span>Sehat Health Tech</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-slate-900 max-w-xl leading-snug">
          Autonomous Clinical History Intake for Next-Gen OPDs
        </h1>
      </div>

      <div className="relative z-10 shrink-0 hidden sm:flex">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-sky-50 border border-sky-100 shadow-2xs">
          <CheckCircle2 className="w-6 h-6 text-sky-500" />
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
