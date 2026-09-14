import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldAlert,
  Activity,
  HeartPulse,
  Clock,
  ArrowRight,
  RefreshCw,
  Sparkles,
  FileText,
  User,
  CheckCircle,
} from 'lucide-react';
import {
  getPatients,
  getEmergencyAlerts,
  acceptEmergencyCase,
} from '../services/doctorDashboardService';

export const DoctorTriageView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');
  const [claimingId, setClaimingId] = useState(null);

  const fetchTriage = useCallback(async () => {
    try {
      setLoading(true);
      const [pts, alerts] = await Promise.all([
        getPatients({ tab: 'ALL' }),
        getEmergencyAlerts().catch(() => []),
      ]);
      setPatients(pts || []);
      setEmergencyAlerts(alerts || []);
    } catch (err) {
      console.error('Failed to load triage cases:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTriage();
  }, [fetchTriage]);

  const handleClaim = async (caseId) => {
    try {
      setClaimingId(caseId);
      const res = await acceptEmergencyCase(caseId);
      if (res?.data?.status === 'CASE_ASSIGNED' || res?.status === 200) {
        navigate(`/doctor/cases/${caseId}`);
      } else {
        alert(res?.data?.message || 'Case assigned successfully.');
        fetchTriage();
      }
    } catch (err) {
      alert(`Claim failed: ${err.message}`);
    } finally {
      setClaimingId(null);
    }
  };

  // Group patients into the 4 urgency tiers
  const categorized = {
    critical: patients.filter((p) => p.triageLevel === 'RED_FLAG' || p.triageLevel === 'EMERGENCY' || p.isRedFlag),
    high: patients.filter((p) => (p.triageLevel === 'HIGH' || p.priority === 'High Priority') && !p.isRedFlag && p.triageLevel !== 'RED_FLAG'),
    moderate: patients.filter((p) => p.triageLevel === 'MODERATE' || p.priority === 'Moderate'),
    low: patients.filter((p) => p.triageLevel === 'LOW' || p.triageLevel === 'ROUTINE' || p.priority === 'Routine'),
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Priority Triage & Emergency Command</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
              Active Triage Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            AI symptom severity triage, red-flag telemetry, and priority case assignment for rapid clinical escalation.
          </p>
        </div>

        <button
          onClick={fetchTriage}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200 rounded-xl transition cursor-pointer self-start sm:self-auto shadow-2xs"
          title="Refresh Triage Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
        </button>
      </div>

      {/* Urgency Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'ALL', label: 'All Urgencies', count: patients.length, color: 'bg-slate-950 text-white' },
          { key: 'CRITICAL', label: 'Critical / Emergency', count: categorized.critical.length, color: 'bg-rose-700 text-white' },
          { key: 'HIGH', label: 'High Priority', count: categorized.high.length, color: 'bg-amber-700 text-white' },
          { key: 'MODERATE', label: 'Moderate', count: categorized.moderate.length, color: 'bg-sky-700 text-white' },
          { key: 'LOW', label: 'Routine / Low', count: categorized.low.length, color: 'bg-emerald-700 text-white' },
        ].map((tier) => (
          <button
            key={tier.key}
            onClick={() => setSelectedUrgency(tier.key)}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedUrgency === tier.key
                ? `${tier.color} shadow-xs`
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {tier.label} ({tier.count})
          </button>
        ))}
      </div>

      {/* Critical Emergency Broadcasts Banner */}
      {categorized.critical.length > 0 && (selectedUrgency === 'ALL' || selectedUrgency === 'CRITICAL') && (
        <div className="p-4 bg-gradient-to-r from-rose-50 to-rose-100/50 border border-rose-300/80 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600 animate-bounce" />
              <span>Immediate Clinical Action Required: {categorized.critical.length} Emergency Red Flag(s)</span>
            </div>
            <span className="text-[11px] font-mono text-rose-700 font-bold">STAT Priority</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categorized.critical.map((c) => (
              <div
                key={c.sessionId || c.id}
                className="p-4 bg-white rounded-xl border border-rose-200 shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-rose-900 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    #{c.token || 'TK-103'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                    CRITICAL RED-FLAG
                  </span>
                </div>

                <div>
                  <div className="text-sm font-bold text-slate-900">{c.patientName}</div>
                  <div className="text-xs text-slate-500">{c.age} yrs • {c.gender}</div>
                </div>

                <div className="p-2.5 bg-rose-50/70 rounded-lg text-xs text-slate-800 space-y-1 border border-rose-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Trigger Reason
                  </div>
                  <p className="font-medium text-[11px] leading-relaxed">{c.chiefComplaint}</p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">Wait: {c.waitTime || '12 mins'}</span>
                  <button
                    onClick={() => handleClaim(c.sessionId || c.id)}
                    disabled={claimingId === (c.sessionId || c.id)}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {claimingId === (c.sessionId || c.id) ? 'Claiming...' : 'Claim & Start Consult'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorized Triage Tiers */}
      <div className="space-y-6">
        {/* High Priority Tier */}
        {(selectedUrgency === 'ALL' || selectedUrgency === 'HIGH') && categorized.high.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>High Priority Encounters ({categorized.high.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categorized.high.map((p) => (
                <div key={p.id} className="p-4 bg-white border border-amber-200 rounded-2xl shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      #{p.token}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      High Priority
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{p.patientName}</h4>
                    <p className="text-[11px] text-slate-500">{p.age} yrs • {p.gender}</p>
                  </div>
                  <p className="text-xs text-slate-700 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                    {p.chiefComplaint}
                  </p>
                  <button
                    onClick={() => navigate(`/doctor/cases/${p.sessionId || p.id}`)}
                    className="w-full mt-2 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Assess Patient</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Moderate Priority Tier */}
        {(selectedUrgency === 'ALL' || selectedUrgency === 'MODERATE') && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Moderate Priority Cases ({categorized.moderate.length})</span>
            </h3>
            {categorized.moderate.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                No moderate priority cases currently in queue.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categorized.moderate.map((p) => (
                  <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        #{p.token}
                      </span>
                      <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                        Moderate
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{p.patientName}</h4>
                      <p className="text-[11px] text-slate-500">{p.age} yrs • {p.gender}</p>
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                      {p.chiefComplaint}
                    </p>
                    <button
                      onClick={() => navigate(`/doctor/cases/${p.sessionId || p.id}`)}
                      className="w-full mt-2 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Open Encounter</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Routine / Low Priority Tier */}
        {(selectedUrgency === 'ALL' || selectedUrgency === 'LOW') && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Routine & Standard Consultations ({categorized.low.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categorized.low.map((p) => (
                <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      #{p.token}
                    </span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Routine
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{p.patientName}</h4>
                    <p className="text-[11px] text-slate-500">{p.age} yrs • {p.gender}</p>
                  </div>
                  <p className="text-xs text-slate-700 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                    {p.chiefComplaint}
                  </p>
                  <button
                    onClick={() => navigate(`/doctor/cases/${p.sessionId || p.id}`)}
                    className="w-full mt-2 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition"
                  >
                    <span>View Case</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorTriageView;
