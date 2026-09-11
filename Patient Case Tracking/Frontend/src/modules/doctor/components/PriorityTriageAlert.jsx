import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

/**
 * PriorityTriageAlert Component
 * Prominently highlights red-flag clinical alerts without claiming diagnostic certainty.
 */
export const PriorityTriageAlert = ({ reason }) => {
  return (
    <div className="w-full bg-rose-50/90 border-2 border-rose-300 rounded-[24px] p-5 sm:p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-bounce">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-rose-200/80 text-rose-900">
              <ShieldAlert className="w-3.5 h-3.5" />
              Priority Triage Alert
            </span>
            <span className="text-[11px] font-medium text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
              Immediate Clinical Attention Required
            </span>
          </div>

          <h3 className="text-sm font-semibold text-rose-950">
            AI detected a potential priority concern.
          </h3>

          <p className="text-xs text-rose-900 leading-relaxed font-normal bg-white/70 p-3 rounded-xl border border-rose-200">
            <strong>Triage Trigger: </strong>
            {reason || 'Acute chest discomfort, exertional shortness of breath, or critical vital abnormality detected.'}
          </p>

          <p className="text-[11px] text-rose-700 italic">
            * Medical Safety Note: This alert indicates priority triage based on reported symptoms. It does not establish a confirmed diagnosis. Immediate physician evaluation and diagnostic workup are advised.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriorityTriageAlert;
