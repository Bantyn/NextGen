import React from 'react';
import { Sparkles, ShieldAlert, CheckCircle2, AlertTriangle, Edit3 } from 'lucide-react';

/**
 * ClinicalSummary Component
 * Displays the physician-friendly clinical summary with mandatory verification notice.
 */
export const ClinicalSummary = ({
  summary = {},
  doctorRxNotes = '',
  onNotesChange,
  isEditing = false,
}) => {
  return (
    <div className="space-y-5">
      {/* 1. AI Summary Card */}
      <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-2xs space-y-4">
        {/* Header with Mandatory Safety Notice */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Physician-Friendly Clinical Summary
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-medium">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            AI Generated — Doctor Verification Required
          </span>
        </div>

        {/* Structured Summary Grid */}
        <div className="space-y-3 text-xs font-normal text-slate-700">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <strong className="text-slate-900 block mb-0.5 text-[11px] uppercase font-semibold">
              Chief Complaint & HPI:
            </strong>
            <p className="text-slate-800 leading-relaxed">
              {summary.historyOfPresentIllness || summary.chiefComplaint || 'N/A'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <strong className="text-slate-900 block mb-0.5 text-[11px] uppercase font-semibold">
                Relevant Medical History:
              </strong>
              <p className="text-slate-800">
                {summary.relevantMedicalHistory || 'None reported.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <strong className="text-slate-900 block mb-0.5 text-[11px] uppercase font-semibold">
                Current Medications & Allergies:
              </strong>
              <p className="text-slate-800">
                Meds: {summary.currentMedications || 'None'} • Allergies: {summary.allergies || 'NKDA'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <strong className="text-slate-900 block mb-0.5 text-[11px] uppercase font-semibold">
              Prior Investigations / Lab Findings:
            </strong>
            <p className="text-slate-800 leading-relaxed">
              {summary.investigations || 'No prior labs recorded.'}
            </p>
          </div>

          {summary.redFlags && summary.redFlags !== 'None detected. Vitals stable.' && summary.redFlags !== 'None.' && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
              <strong className="text-rose-950 block mb-0.5 text-[11px] uppercase font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Red-Flag Clinical Findings:
              </strong>
              <p className="text-rose-800 leading-relaxed font-medium">
                {summary.redFlags}
              </p>
            </div>
          )}

          {summary.aiNotes && (
            <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/80 text-sky-950">
              <strong className="text-sky-900 block mb-0.5 text-[11px] uppercase font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                AI Clinical Synthesizer Notes:
              </strong>
              <p className="text-sky-900 leading-relaxed text-[11px]">
                {summary.aiNotes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Physician Prescription & Plan of Care */}
      <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Physician Prescription & Plan of Care (Doctor Controlled)</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-normal">
            Physician retains final clinical authority
          </span>
        </div>

        <textarea
          rows="4"
          value={doctorRxNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Enter prescription medicines, dietary advice (Pathya-Apathya), and follow-up consultation plan..."
          className="w-full p-3.5 rounded-xl border border-slate-300 text-xs font-normal text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
        />
      </div>
    </div>
  );
};

export default ClinicalSummary;
