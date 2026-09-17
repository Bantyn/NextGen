import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Clock, ShieldAlert, RefreshCw } from 'lucide-react';
import AdminStatsCard from '../components/AdminStatsCard';
import adminApiService from '../services/adminApiService';

export const AnalyticsAdminView = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await adminApiService.getAnalytics();
      setAnalytics(res.data || null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const kpis = analytics?.kpis || {};
  const triageDist = analytics?.triage_distribution || [];
  const summary = analytics?.opd_summary || {};
  const colors = ['bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-rose-500'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Clinical &amp; Operational Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live institutional metrics from database — patient throughput and triage telemetry.
            {analytics?.timestamp && (
              <span className="ml-2 text-slate-400">
                Updated: {new Date(analytics.timestamp).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Loading...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* OPD Summary Strip */}
      {!loading && summary.total_sessions !== undefined && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Sessions', value: summary.total_sessions },
            { label: 'Today', value: summary.today_sessions },
            { label: 'Completed', value: summary.completed_sessions },
            { label: 'Total Patients', value: summary.total_patients },
            { label: 'Total Doctors', value: summary.total_doctors },
            { label: 'On Duty', value: summary.active_doctors },
          ].map((item, i) => (
            <div key={i} className="p-3 bg-white border border-slate-200/80 rounded-xl text-center shadow-xs">
              <div className="text-xl font-bold text-slate-900">{item.value ?? 0}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Average OPD Wait Time"
          value={loading ? '—' : `${kpis.avg_wait_mins ?? 0} min`}
          comparison="Target: < 25 min"
          trend={kpis.avg_wait_mins <= 25 ? 'up' : 'down'}
          icon={Clock}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <AdminStatsCard
          title="Intake Completion Rate"
          value={loading ? '—' : `${kpis.intake_completion_rate ?? 0}%`}
          comparison="Completed vs Total sessions"
          trend={kpis.intake_completion_rate >= 80 ? 'up' : 'neutral'}
          icon={TrendingUp}
          iconBg="bg-sky-50 text-sky-600"
        />
        <AdminStatsCard
          title="Doctor Consultation Load"
          value={loading ? '—' : `${kpis.doctor_consultation_load ?? 0} pts/doc`}
          comparison="Completed / Active Doctors"
          trend="neutral"
          icon={Users}
          iconBg="bg-purple-50 text-purple-600"
        />
        <AdminStatsCard
          title="Emergency Escalation Rate"
          value={loading ? '—' : `${kpis.emergency_escalation_rate ?? 0}%`}
          comparison="Red-flag cases / Total"
          trend={kpis.emergency_escalation_rate <= 5 ? 'neutral' : 'down'}
          icon={ShieldAlert}
          iconBg="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Triage Priority Distribution — Real Data */}
      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Triage Priority Allocation</h3>
        <p className="text-xs text-slate-400 mb-5">
          Automated clinical severity breakdown of all registered sessions in the system
        </p>

        {loading ? (
          <div className="text-xs text-slate-400 text-center py-6">Loading live data...</div>
        ) : triageDist.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No session data available yet.</p>
        ) : (
          <div className="space-y-3.5">
            {triageDist.map((row, idx) => {
              const percent = row.total > 0 ? Math.round((row.count / row.total) * 100) : 0;
              return (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{row.label}</span>
                    <span className="text-slate-500 font-mono">
                      {row.count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[idx] || 'bg-slate-400'} rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsAdminView;
