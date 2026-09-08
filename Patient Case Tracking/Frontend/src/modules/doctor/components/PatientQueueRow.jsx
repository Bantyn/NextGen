import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { TriageBadge } from './TriageBadge';

/**
 * PatientQueueRow Component
 * Renders an individual patient row in the Live OPD Queue table.
 */
export const PatientQueueRow = ({ patient, onExamine }) => {
  return (
    <tr
      onClick={() => onExamine(patient)}
      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
    >
      {/* 1. Token & Time */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-mono text-sm text-slate-950 font-normal block group-hover:text-sky-700 transition-colors">
          {patient.token}
        </span>
        <span className="text-[10px] text-slate-400">{patient.checkinTime}</span>
      </td>

      {/* 2. Patient Details */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-normal text-slate-900 group-hover:text-sky-950 transition-colors">
          {patient.patientName}
        </div>
        <div className="text-[11px] text-slate-400 font-normal">
          {patient.age} yrs • {patient.gender}
        </div>
      </td>

      {/* 3. Language */}
      <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-normal">
        {patient.language}
      </td>

      {/* 4. AI Chief Complaint */}
      <td className="px-6 py-4 max-w-xs md:max-w-sm truncate text-slate-800 font-normal" title={patient.chiefComplaint}>
        {patient.chiefComplaint}
      </td>

      {/* 5. Reports Attached */}
      <td className="px-6 py-4 whitespace-nowrap">
        {patient.docsCount > 0 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-normal bg-slate-100 text-slate-700 border border-slate-200/60">
            <FileText className="w-3 h-3 text-slate-500" />
            <span>{patient.docsCount} file(s)</span>
          </span>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        )}
      </td>

      {/* 6. Triage Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <TriageBadge level={patient.triageLevel} status={patient.status} triage={patient.triage} />
      </td>

      {/* 7. Action */}
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExamine(patient);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-normal text-white bg-slate-950 hover:bg-slate-800 active:scale-95 transition cursor-pointer shadow-2xs group-hover:bg-sky-600"
        >
          <span>Examine</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      </td>
    </tr>
  );
};

export default PatientQueueRow;
