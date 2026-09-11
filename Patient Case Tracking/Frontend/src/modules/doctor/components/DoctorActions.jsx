import React from 'react';
import { ArrowLeft, Printer, Edit3, Check, Volume2 } from 'lucide-react';

/**
 * DoctorActions Component
 * Action bar for the physician when reviewing and finalizing a patient case.
 */
export const DoctorActions = ({
  onBack,
  onPrint,
  isEditing,
  onToggleEdit,
  isVerified,
  onSignAndComplete,
  onCallNext,
  nextPatientToken,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap pb-2">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-normal text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Live OPD Queue</span>
      </button>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {nextPatientToken && (
          <button
            type="button"
            onClick={onCallNext}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-normal text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <Volume2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Call Next ({nextPatientToken})</span>
          </button>
        )}

        <button
          type="button"
          onClick={onPrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-normal text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Print Case</span>
        </button>

        <button
          type="button"
          onClick={onToggleEdit}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-normal border transition cursor-pointer ${
            isEditing
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Done Editing' : 'Edit History Draft'}</span>
        </button>

        <button
          type="button"
          onClick={onSignAndComplete}
          disabled={isVerified}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer shadow-xs ${
            isVerified
              ? 'bg-emerald-600 text-white cursor-default'
              : 'bg-slate-950 text-white hover:bg-slate-800 active:scale-95'
          }`}
        >
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isVerified ? 'Encounter Signed & Synced' : 'Sign & Complete Consultation'}</span>
        </button>
      </div>
    </div>
  );
};

export default DoctorActions;
