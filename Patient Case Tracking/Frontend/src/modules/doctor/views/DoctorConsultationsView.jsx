import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Search,
  Clock,
  CheckCircle2,
  FileText,
  User,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Pill,
} from 'lucide-react';
import { getDoctorConsultations } from '../services/doctorDashboardService';

export const DoctorConsultationsView = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState([]);

  const fetchConsultations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDoctorConsultations(tab, search);
      setConsultations(data || []);
    } catch (err) {
      console.error('Failed to load consultations:', err);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    const timer = setTimeout(fetchConsultations, 200);
    return () => clearTimeout(timer);
  }, [fetchConsultations]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Consultations & Physician Notes</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active encounters, signed diagnosis notes, treatment plans, and verified clinical assessments.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search consultations, patient, complaint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 text-xs">
        {[
          { key: 'ALL', label: 'All Encounters' },
          { key: 'ACTIVE', label: 'Active In-Progress' },
          { key: 'COMPLETED', label: 'Completed & Signed' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
              tab === t.key
                ? 'bg-slate-950 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Consultations List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading consultation records...</div>
      ) : consultations.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          No clinical consultations found in this view.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {consultations.map((c) => {
            const isCompleted = c.status === 'COMPLETED';
            return (
              <div
                key={c.sessionId || c.id}
                className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:shadow-md transition space-y-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">{c.sessionId}</span>
                      <h3 className="text-sm font-bold text-slate-900">{c.patientName}</h3>
                      <div className="text-xs text-slate-500">{c.age} yrs • {c.gender} • {c.opdType} OPD</div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {isCompleted ? 'SIGNED' : 'IN PROGRESS'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1.5 mt-2">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-sky-600" />
                      Presenting Chief Complaint
                    </div>
                    <p className="font-medium text-slate-900">{c.chiefComplaint}</p>

                    {c.doctorNotes && (
                      <div className="pt-2 border-t border-slate-200/60">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Doctor Clinical Notes</div>
                        <p className="text-slate-600 italic text-[11px] mt-0.5">{c.doctorNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">Prescribed: <strong>{c.prescriptionCount} Rx</strong></span>
                  <button
                    onClick={() => navigate(`/doctor/cases/${c.sessionId || c.id}`)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-950 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer shadow-xs"
                  >
                    <span>Open Encounter</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorConsultationsView;
