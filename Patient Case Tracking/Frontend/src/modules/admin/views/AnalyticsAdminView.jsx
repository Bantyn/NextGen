import React from 'react';
import { BarChart3, Download, TrendingUp, Users, Clock, ShieldAlert } from 'lucide-react';
import AdminStatsCard from '../components/AdminStatsCard';

export const AnalyticsAdminView = ({ kpis = {} }) => {
  const handleExport = () => {
    alert('Exporting Institutional Clinical & OPD Operational Report (PDF/CSV)...');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Clinical & Operational Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated institutional metrics, patient throughput, and triage decision telemetry.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Summary Report</span>
        </button>
      </div>

      {/* Primary Analytic Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Average OPD Wait Time"
          value="18 min"
          comparison="Target: < 25 min"
          trend="up"
          icon={Clock}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <AdminStatsCard
          title="Intake Completion Rate"
          value="94.2%"
          comparison="+3.1% vs last month"
          trend="up"
          icon={TrendingUp}
          iconBg="bg-sky-50 text-sky-600"
        />
        <AdminStatsCard
          title="Doctor Consultation Load"
          value="24 pts/doc"
          comparison="Nominal capacity"
          trend="neutral"
          icon={Users}
          iconBg="bg-purple-50 text-purple-600"
        />
        <AdminStatsCard
          title="Emergency Escalation Rate"
          value="2.8%"
          comparison="Within safety thresholds"
          trend="neutral"
          icon={ShieldAlert}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Analytic Distribution Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Triage Priority Distribution */}
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Triage Priority Allocation</h3>
          <p className="text-xs text-slate-400 mb-5">Automated clinical severity breakdown of all registered sessions</p>

          <div className="space-y-3.5">
            {[
              { label: 'Routine OPD', percent: 64, count: 184, color: 'bg-emerald-500' },
              { label: 'Moderate Wait', percent: 22, count: 63, color: 'bg-sky-500' },
              { label: 'Urgent Attention', percent: 11, count: 31, color: 'bg-amber-500' },
              { label: 'Emergency / Red Flag', percent: 3, count: 9, color: 'bg-rose-500' },
            ].map((row, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{row.label}</span>
                  <span className="text-slate-500 font-mono">{row.count} ({row.percent}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${row.color} rounded-full`} style={{ width: `${row.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Intent & Tool Usage Distribution */}
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">AI Assistant Inquiry Categories</h3>
          <p className="text-xs text-slate-400 mb-5">Distribution of questions answered across clinical and hospital domains</p>

          <div className="space-y-3.5">
            {[
              { label: 'Medicine Indications & Safety', percent: 42, color: 'bg-sky-500' },
              { label: 'Doctor Availability & OPD Timings', percent: 28, color: 'bg-indigo-500' },
              { label: 'Self-Care & AYUSH Guidance', percent: 18, color: 'bg-purple-500' },
              { label: 'Hospital Navigation & Registration', percent: 12, color: 'bg-slate-500' },
            ].map((row, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{row.label}</span>
                  <span className="text-slate-500 font-mono">{row.percent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${row.color} rounded-full`} style={{ width: `${row.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsAdminView;
