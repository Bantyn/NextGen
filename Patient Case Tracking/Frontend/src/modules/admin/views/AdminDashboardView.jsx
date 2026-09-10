import React from 'react';
import {
  Users,
  Clock,
  AlertTriangle,
  Stethoscope,
  FileCheck,
  Bot,
  Activity,
  ArrowRight,
} from 'lucide-react';
import AdminStatsCard from '../components/AdminStatsCard';
import AdminStatusBadge from '../components/AdminStatusBadge';

/**
 * AdminDashboardView Component
 * High-density healthcare command center overview with live KPI cards and operational snapshot.
 */
export const AdminDashboardView = ({
  kpis = {},
  liveOps = {},
  onNavigateTab,
}) => {
  const cards = [
    {
      title: "Total Patients",
      value: kpis.total_patients ?? 0,
      comparison: `+${kpis.today_patients ?? 0} registered today`,
      trend: 'up',
      icon: Users,
      iconBg: 'bg-sky-50 text-sky-600',
      tab: 'patients',
    },
    {
      title: "Waiting in OPD Queue",
      value: kpis.waiting_patients ?? 0,
      comparison: `${kpis.active_clinical_sessions ?? 0} active sessions`,
      trend: kpis.waiting_patients > 5 ? 'down' : 'neutral',
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600',
      tab: 'queue',
    },
    {
      title: "Emergency / Red Flags",
      value: kpis.emergency_cases ?? 0,
      comparison: kpis.emergency_cases > 0 ? 'Urgent attention required' : 'All clear',
      trend: kpis.emergency_cases > 0 ? 'down' : 'neutral',
      icon: AlertTriangle,
      iconBg: 'bg-rose-50 text-rose-600',
      tab: 'triage',
    },
    {
      title: "Doctors on Duty",
      value: `${kpis.doctors_available ?? 0} / ${kpis.doctors_on_duty ?? 4}`,
      comparison: 'Active in consultation rooms',
      trend: 'neutral',
      icon: Stethoscope,
      iconBg: 'bg-emerald-50 text-emerald-600',
      tab: 'doctors',
    },
    {
      title: "Pending Doctor Reviews",
      value: kpis.pending_doctor_reviews ?? 0,
      comparison: `${kpis.completed_today ?? 0} signed off today`,
      trend: 'neutral',
      icon: FileCheck,
      iconBg: 'bg-indigo-50 text-indigo-600',
      tab: 'queue',
    },
    {
      title: "AI Interactions Today",
      value: kpis.ai_conversations_today ?? 0,
      comparison: 'Queries handled by Sehat Bot',
      trend: 'up',
      icon: Bot,
      iconBg: 'bg-purple-50 text-purple-600',
      tab: 'assistant',
    },
  ];

  const queueList = liveOps.queue || [];
  const doctorList = liveOps.doctors || [];

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Healthcare Operations Control Center
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Real-time telemetry and supervisory control for All India Institute of Ayurveda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            <Activity className="w-3.5 h-3.5 text-sky-500" />
            Live Syncing
          </span>
        </div>
      </div>

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {cards.map((c, idx) => (
          <AdminStatsCard
            key={idx}
            title={c.title}
            value={c.value}
            comparison={c.comparison}
            trend={c.trend}
            icon={c.icon}
            iconBg={c.iconBg}
            onClick={() => onNavigateTab(c.tab)}
          />
        ))}
      </div>

      {/* 3. Operational Split: Live OPD Queue & Doctor Rosters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live OPD Queue Snapshot */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Live OPD Queue Snapshot</h2>
              <p className="text-[11px] text-slate-500">Patients currently awaiting physician consultation</p>
            </div>
            <button
              onClick={() => onNavigateTab('queue')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
            >
              <span>Manage Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {queueList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No patients currently waiting in queue.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {queueList.slice(0, 5).map((item) => (
                <div key={item.session_id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {item.token_number}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                        <span>{item.patient_id}</span>
                        {item.has_red_flag && (
                          <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-rose-100 text-rose-700">
                            ALERT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        {item.chief_complaint}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AdminStatusBadge status={item.priority} variant="priority" size="xs" />
                    <AdminStatusBadge status={item.status} size="xs" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Active Doctor Roster */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Physicians On Duty</h2>
              <p className="text-[11px] text-slate-500">Live consultation room availability</p>
            </div>
            <button
              onClick={() => onNavigateTab('doctors')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
            >
              <span>Roster</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {doctorList.slice(0, 4).map((doc) => (
              <div
                key={doc.doctor_id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2"
              >
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {doc.name || doc.doctor_name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {doc.specialty} • {doc.room || 'Room 104'}
                  </div>
                </div>
                <AdminStatusBadge
                  status={doc.on_duty ? doc.availability_status || 'AVAILABLE' : 'OFFLINE'}
                  size="xs"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;
