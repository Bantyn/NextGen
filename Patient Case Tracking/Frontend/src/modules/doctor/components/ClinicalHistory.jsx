import React from 'react';
import { FileText, Pill, Leaf, Sparkles, Activity, Clock } from 'lucide-react';

/**
 * ClinicalHistory Component
 * Structured Clinical History & SOCRATES Symptom Breakdown.
 * All AI-derived fields explicitly carry the "AI Generated / Needs Doctor Review" banner.
 */
export const ClinicalHistory = ({
  history = {},
  ayushPariksha = {},
  isEditing = false,
  onChange,
}) => {
  const hpi = history.hpi || {};

  return (
    <div className="space-y-5">
      {/* 1. Chief Complaint & SOCRATES HPI */}
      <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <span>1. Chief Complaint & HPI (SOCRATES Framework)</span>
          </h2>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 font-medium">
            <Sparkles className="w-3 h-3 text-sky-500" />
            AI Generated / Needs Doctor Review
          </span>
        </div>

        {/* Chief Complaint */}
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
            Chief Complaint (મુખ્ય તકલીફ / मुख्य शिकायत)
          </span>
          {isEditing ? (
            <textarea
              rows="2"
              value={history.chiefComplaint || ''}
              onChange={(e) => onChange('chiefComplaint', e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 text-xs font-normal text-slate-900 focus:ring-1 focus:ring-slate-400"
            />
          ) : (
            <p className="text-sm font-normal text-slate-900 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              {history.chiefComplaint || 'No chief complaint recorded.'}
            </p>
          )}
        </div>

        {/* SOCRATES Breakdown */}
        {hpi && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                SOCRATES Symptom Breakdown
              </span>
              <span className="text-[10px] text-slate-400 italic">
                Derived from Voice Dialogue
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-normal">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-400 block text-[10px] uppercase font-medium">Site & Location (S)</span>
                <span className="text-slate-900 font-medium">{hpi.site || 'N/A'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-400 block text-[10px] uppercase font-medium">Onset & Duration (O)</span>
                <span className="text-slate-900 font-medium">{hpi.onset || 'N/A'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-400 block text-[10px] uppercase font-medium">Character & Sensation (C)</span>
                <span className="text-slate-900 font-medium">{hpi.character || 'N/A'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-400 block text-[10px] uppercase font-medium">Associated Symptoms (A)</span>
                <span className="text-slate-900 font-medium">{hpi.associated || 'None'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-400 block text-[10px] uppercase font-medium">Exacerbating & Relieving Factors (E)</span>
                <span className="text-slate-900 font-medium">{hpi.exacerbating || 'N/A'} — {hpi.relieving || 'N/A'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-slate-400 block text-[10px] uppercase font-medium">Severity Scale (S)</span>
                <span className="text-rose-700 font-semibold">{hpi.severity || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Medical, Surgical, Drug, Allergy & Personal History */}
      <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Pill className="w-4 h-4 text-slate-700" />
            <span>2. Past Medical, Medications & Personal Profile</span>
          </h2>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 font-medium">
            <Sparkles className="w-3 h-3 text-sky-500" />
            AI Generated / Needs Doctor Review
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-normal">
          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-medium mb-1">Past Medical History</span>
            {isEditing ? (
              <textarea
                rows="2"
                value={history.pastMedicalHistory || ''}
                onChange={(e) => onChange('pastMedicalHistory', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            ) : (
              <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                {history.pastMedicalHistory || 'No significant past medical history.'}
              </p>
            )}
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-medium mb-1">Current Drug & Allergy History</span>
            {isEditing ? (
              <textarea
                rows="2"
                value={history.medicationHistory || ''}
                onChange={(e) => onChange('medicationHistory', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            ) : (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1">
                <p className="text-slate-800">{history.medicationHistory || 'None reported.'}</p>
                {history.allergyHistory && (
                  <p className="text-rose-700 font-medium text-[11px]">
                    Allergies: {history.allergyHistory}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-medium mb-1">Family History</span>
            <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              {history.familyHistory || 'Non-contributory.'}
            </p>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-medium mb-1">Personal / Ahara-Vihara Routine</span>
            <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
              {history.personalHistory || 'No specific habits reported.'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. AYUSH Dashavidha Pariksha (if present) */}
      {ayushPariksha && ayushPariksha.prakriti && (
        <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-medium uppercase tracking-wider text-slate-900">
                AYUSH Dashavidha Pariksha (Clinical Assessment)
              </h3>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
              Ayurveda Clinical Profile
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-normal">
            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-slate-500 block text-[10px] uppercase">Prakriti</span>
              <strong className="text-emerald-950 font-medium">{ayushPariksha.prakriti}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block text-[10px] uppercase">Vikriti</span>
              <strong className="text-slate-900 font-medium">{ayushPariksha.vikriti}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block text-[10px] uppercase">Ahara Shakti</span>
              <strong className="text-slate-900 font-medium">{ayushPariksha.aharaShakti}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block text-[10px] uppercase">Vyayama</span>
              <strong className="text-slate-900 font-medium">{ayushPariksha.vyayamaShakti}</strong>
            </div>
          </div>

          {ayushPariksha.suspectedDiagnosis && (
            <div className="p-3 rounded-xl bg-slate-900 text-white text-xs mt-2 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">
                  Suspected Clinical Correlation
                </span>
                <span className="font-normal text-slate-200">{ayushPariksha.suspectedDiagnosis}</span>
              </div>
              <span className="text-[10px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                Doctor Verification Required
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClinicalHistory;
