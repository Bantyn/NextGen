import React from 'react';
import { ShieldCheck, Phone, Globe, User } from 'lucide-react';
import { TriageBadge } from './TriageBadge';

/**
 * PatientOverview Component
 * Clean demographic and administrative header card for an individual patient.
 */
export const PatientOverview = ({ patient }) => {
  if (!patient) return null;

  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-[28px] p-6 sm:p-7 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] flex items-center justify-between gap-6 flex-wrap">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium font-mono">
            OPD Token {patient.token}
          </span>
          <span className="text-[11px] bg-sky-50 text-sky-800 px-2.5 py-0.5 rounded-full border border-sky-200 font-normal">
            {patient.opdMode || 'General OPD'}
          </span>
          {patient.room && (
            <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 font-normal">
              {patient.room}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-normal text-slate-950 tracking-tight mt-1 flex items-center gap-2.5">
          <span>{patient.patientName}</span>
          <TriageBadge level={patient.triageLevel} status={patient.status} triage={patient.triage} />
        </h1>

        <div className="flex items-center gap-4 text-xs text-slate-500 font-normal mt-1 flex-wrap">
          <span>
            {patient.age} Years • {patient.gender}
          </span>
          {patient.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <strong>{patient.phone}</strong>
            </span>
          )}
          {patient.language && (
            <span className="inline-flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-400" />
              <span>Language: {patient.language}</span>
            </span>
          )}
        </div>
      </div>

      <div className="text-left sm:text-right space-y-1">
        {patient.abhaId && (
          <div className="text-xs text-slate-500">
            ABHA ID: <span className="font-mono text-slate-900 font-medium">{patient.abhaId}</span>
          </div>
        )}
        <div className="text-xs text-slate-400 font-mono">
          Session ID: {patient.sessionId || patient.id}
        </div>
        <div className="pt-1">
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ABDM FHIR Linked</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default PatientOverview;
