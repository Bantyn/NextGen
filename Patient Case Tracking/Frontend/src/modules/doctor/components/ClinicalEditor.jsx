import React from 'react';

/**
 * ClinicalEditor Component
 * Allows the physician to review, edit, and append notes to the AI-generated clinical summary.
 */
export const ClinicalEditor = ({ data, onChange }) => {
  const handleFieldChange = (field, val) => {
    if (onChange) {
      onChange({ ...data, [field]: val });
    }
  };

  return (
    <div className="space-y-4">
      {/* Chief Complaints */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5">
          Chief Complaints (AI Extracted)
        </label>
        <textarea
          value={data.chiefComplaints || ''}
          onChange={(e) => handleFieldChange('chiefComplaints', e.target.value)}
          rows="2"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-normal focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
        />
      </div>

      {/* History of Present Illness (HPI) */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5">
          History of Present Illness (HPI)
        </label>
        <textarea
          value={data.hpi || ''}
          onChange={(e) => handleFieldChange('hpi', e.target.value)}
          rows="3"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-normal focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
        />
      </div>

      {/* Ayush & Lifestyle Assessment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5">
            Ahara-Vihara (Diet & Sleep)
          </label>
          <input
            type="text"
            value={data.lifestyle || ''}
            onChange={(e) => handleFieldChange('lifestyle', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-normal focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5">
            Prakriti / Constitution Notes
          </label>
          <input
            type="text"
            value={data.prakriti || ''}
            onChange={(e) => handleFieldChange('prakriti', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-normal focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
          />
        </div>
      </div>

      {/* Physician Prescription & Clinical Notes */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1.5">
          Doctor Clinical Advice & Prescription Notes
        </label>
        <textarea
          value={data.doctorNotes || ''}
          onChange={(e) => handleFieldChange('doctorNotes', e.target.value)}
          placeholder="Type physician orders, prescribed herbs/medicines, follow-up date..."
          rows="3"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-normal focus:outline-none focus:ring-1 focus:ring-slate-400 transition"
        />
      </div>
    </div>
  );
};

export default ClinicalEditor;
