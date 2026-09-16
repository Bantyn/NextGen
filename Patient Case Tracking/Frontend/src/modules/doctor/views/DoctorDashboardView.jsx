import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Clock,
  Activity,
  Sparkles,
  Users,
  Stethoscope,
  Calendar,
  Volume2,
  ChevronRight,
  ExternalLink,
  Pill,
  Building,
  FileText,
} from 'lucide-react';
import { DoctorArchiveView } from './DoctorArchiveView';
import { DoctorAnalyticsView } from './DoctorAnalyticsView';
import { DoctorTemplatesView } from './DoctorTemplatesView';
import { DoctorLiveOPDView } from './DoctorLiveOPDView';
import { DoctorTriageView } from './DoctorTriageView';
import {
  getDashboardStats,
  getPatients,
  getDoctorAppointments,
  getEmergencyAlerts,
  acceptEmergencyCase,
  updateDoctorAvailability,
  subscribeDoctorDashboard,
  getDoctorProfile,
} from '../services/doctorDashboardService';

export const DoctorDashboardView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');

  // If URL explicitly requests a legacy or specific tab, render that sub-view
  if (urlTab === 'archive') return <DoctorArchiveView />;
  if (urlTab === 'analytics') return <DoctorAnalyticsView />;
  if (urlTab === 'templates') return <DoctorTemplatesView />;
  if (urlTab === 'triage') return <DoctorTriageView />;
  if (urlTab === 'opd') return <DoctorLiveOPDView />;

  return <DoctorOverviewContent />;
};

const DoctorOverviewContent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOPD: 9,
    waiting: 4,
    inConsultation: 2,
    emergencyTriage: 1,
    priorityCases: 1,
    completedToday: 1,
    averageWaitMins: 20,
    doctorInfo: null,
  });
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [onDuty, setOnDuty] = useState(true);
  const [profile, setProfile] = useState(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, pts, apptsRes, alerts, docProf] = await Promise.all([
        getDashboardStats().catch(() => null),
        getPatients().catch(() => []),
        getDoctorAppointments('TODAY').catch(() => ({ appointments: [] })),
        getEmergencyAlerts().catch(() => []),
        getDoctorProfile().catch(() => null),
      ]);

      if (statsData) {
        setStats(statsData);
        if (statsData.doctorInfo?.on_duty !== undefined) {
          setOnDuty(statsData.doctorInfo.on_duty);
        }
      }
      if (pts) setPatients(pts);
      if (apptsRes?.appointments) setAppointments(apptsRes.appointments);
      if (alerts) setEmergencyAlerts(alerts);
      if (docProf) setProfile(docProf);
    } catch (err) {
      console.error('Failed to load doctor dashboard overview data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    const unsubscribe = subscribeDoctorDashboard(({ stats: updatedStats, patients: updatedPts }) => {
      if (updatedStats) setStats(updatedStats);
      if (updatedPts) setPatients(updatedPts);
    });
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [loadData]);

  const handleToggleDuty = async () => {
    const nextState = !onDuty;
    setOnDuty(nextState);
    try {
      await updateDoctorAvailability({
        on_duty: nextState,
        availability_status: nextState ? 'AVAILABLE' : 'OFF_DUTY',
      });
    } catch (err) {
      console.error('Failed to update availability:', err);
    }
  };

  const doctorName = profile?.name || stats.doctorInfo?.name || 'Dr. Aarav Sharma';
  const opdTitle = profile?.opd_type === 'AYUSH'
    ? `AYUSH OPD — ${profile.opd_system || 'Ayurveda'}`
    : `${stats.doctorInfo?.specialty || 'General Medicine'} OPD`;
  const roomName = profile?.room || stats.doctorInfo?.room || 'Room 104';

  const nextPatient = patients.find((p) => p.status === 'PENDING_REVIEW' || p.stage === 'waiting') || patients[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Clinical Welcome Banner & Doctor Status */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700">
            <span className="w-2 h-2 rounded-full bg-sky-600 animate-ping" />
            <span>Clinical Command Center</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {greeting}, <span className="text-slate-950">{doctorName}</span>
          </h1>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
              <Building className="w-3.5 h-3.5 text-slate-600" />
              <span>{opdTitle}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200">
              {roomName}
            </span>
            <span className="text-xs text-slate-400">• Outpatient Consulting Shift</span>
          </div>
        </div>

        {/* Doctor Live Availability Control */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 self-start md:self-auto">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${onDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                {onDuty ? 'Currently On Duty' : 'Currently Off Duty'}
              </span>
              <span className="text-[10px] text-slate-500">
                {onDuty ? 'Receiving active OPD patient queue' : 'Consultations paused'}
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleDuty}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs ${
              onDuty
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {onDuty ? 'Go Off Duty' : 'Go On Duty'}
          </button>
        </div>
      </div>

      {/* 2. Today's Clinical Summary Dynamic Cards (Computed from DB) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Today's OPD */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Today's OPD</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalOPD || 0}</div>
          <span className="text-[10px] text-slate-500">Total Registered Patients</span>
        </div>

        {/* Waiting */}
        <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-1 bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Waiting</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{stats.waiting || 0}</div>
          <span className="text-[10px] text-slate-500">Avg. wait ~{stats.averageWaitMins || 15}m</span>
        </div>

        {/* In Consultation */}
        <div className="p-4 bg-white rounded-2xl border border-sky-200 shadow-2xs space-y-1 bg-sky-50/20">
          <div className="flex items-center justify-between text-sky-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider">In Consultation</span>
            <Stethoscope className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-700">{stats.inConsultation || 0}</div>
          <span className="text-[10px] text-slate-500">Active encounters</span>
        </div>

        {/* Priority / Red Flags */}
        <div className="p-4 bg-white rounded-2xl border border-rose-200 shadow-2xs space-y-1 bg-rose-50/30">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Priority / Red Flags</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">{stats.emergencyTriage || stats.priorityCases || 0}</div>
          <span className="text-[10px] text-rose-600 font-semibold">Requires immediate attention</span>
        </div>

        {/* Completed */}
        <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-2xs space-y-1 bg-emerald-50/20 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.completedToday || 0}</div>
          <span className="text-[10px] text-slate-500">Prescribed & discharged</span>
        </div>
      </div>

      {/* 3. Emergency Alerts Widget (If active) */}
      {emergencyAlerts.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-rose-50 to-white border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <span>{emergencyAlerts.length} Active Emergency Red-Flag Broadcast</span>
                <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[9px]">STAT</span>
              </div>
              <p className="text-xs text-slate-700 mt-0.5 line-clamp-1">
                {emergencyAlerts[0]?.preview_data?.chief_complaint || emergencyAlerts[0]?.preview_data?.triage_reason || 'Critical clinical distress condition detected'}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/doctor/triage')}
            className="inline-flex items-center gap-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs shrink-0"
          >
            <span>Open Triage Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Two-Column Clinical Workspace Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live OPD Pipeline Quick Access & Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Live OPD Pipeline</h2>
                  <p className="text-[11px] text-slate-500">Visual 7-stage clinical consultation workflow</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/doctor/opd')}
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
              >
                <span>Full Kanban Board</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Next Waiting Patient Callout */}
            {nextPatient && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    <span>Next Patient In Line</span>
                  </div>
                  <div className="text-base font-bold flex items-center gap-2">
                    <span className="font-mono text-sky-300">#{nextPatient.token || 'TK-101'}</span>
                    <span>{nextPatient.patientName}</span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1">{nextPatient.chiefComplaint}</p>
                </div>

                <button
                  onClick={() => navigate(`/doctor/cases/${nextPatient.sessionId || nextPatient.id}`)}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Call & Consult</span>
                </button>
              </div>
            )}

            {/* Patients Queue Preview Table */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-semibold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Token</th>
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Complaint</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.slice(0, 5).map((p) => (
                    <tr key={p.id || p.sessionId} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">#{p.token}</td>
                      <td className="py-2.5 px-3">
                        <strong className="text-slate-900 block">{p.patientName}</strong>
                        <span className="text-[10px] text-slate-400">{p.age}y • {p.gender}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[160px] truncate">{p.chiefComplaint}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            p.triageLevel === 'RED_FLAG' || p.isRedFlag
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.isRedFlag ? 'EMERGENCY' : p.priority || 'Routine'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => navigate(`/doctor/cases/${p.sessionId || p.id}`)}
                          className="px-2.5 py-1 bg-slate-950 text-white rounded-lg text-[11px] font-semibold hover:bg-slate-800 transition cursor-pointer"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Today's Scheduled Appointments */}
        <div className="space-y-4">
          <div className="p-5 bg-white border border-slate-200/90 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Today's Appointments</h3>
                  <p className="text-[11px] text-slate-500">{appointments.length} patient slots booked</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/doctor/appointments')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
              >
                View All
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No appointments scheduled for today.
              </div>
            ) : (
              <div className="space-y-2.5">
                {appointments.slice(0, 4).map((a) => (
                  <div
                    key={a.appointmentId || a.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-sky-50/60 hover:border-sky-200 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{a.patientName}</span>
                      <span className="text-[10px] font-mono text-sky-700 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {a.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">{a.reason}</p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate('/doctor/appointments')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer text-center"
            >
              Manage Appointment Schedule
            </button>
          </div>

          {/* Clinical Tools Shortcuts */}
          <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Quick Clinical Tools</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => navigate('/doctor/prescriptions')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl text-left transition cursor-pointer"
              >
                <Pill className="w-4 h-4 text-sky-400 mb-1" />
                <span className="font-bold block text-slate-200">Prescriptions</span>
                <span className="text-[10px] text-slate-400">Write Rx</span>
              </button>
              <button
                onClick={() => navigate('/doctor/reports')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl text-left transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="font-bold block text-slate-200">Lab Reports</span>
                <span className="text-[10px] text-slate-400">OCR Findings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboardView;
