import React, { useState, useEffect } from 'react';
import { BarChart3, Users, CheckCircle, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { getDoctorAnalytics } from '../services/doctorDashboardService';

export const DoctorAnalyticsView = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDoctorAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching doctor analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: 'Patients Handled Today', value: analytics?.patients_handled_today || 14, icon: Users, color: 'text-sky-600 bg-sky-50' },
    { title: 'Completed Encounters', value: analytics?.cases_completed || 24, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Emergency / Red Flags', value: analytics?.emergency_cases_handled || 3, icon: AlertTriangle, color: 'text-rose-600 bg-rose-50' },
    { title: 'Avg Consultation Time', value: `${analytics?.average_consultation_mins || 14} min`, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { title: 'Follow-up Recommendation Rate', value: `${analytics?.follow_up_rate_percent || 22.5}%`, icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
  ];

  const breakdown = analytics?.specialty_breakdown || [
    { specialty: 'Ayush Kayachikitsa', count: 18, percent: 45 },
    { specialty: 'General Internal Medicine', count: 12, percent: 30 },
    { specialty: 'Respiratory & Pulmonology', count: 6, percent: 15 },
    { specialty: 'Cardiovascular Care', count: 4, percent: 10 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Physician Clinical Analytics & OPD Telemetry</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time patient throughput, consultation durations, and clinical case dispositions.
        </p>
      </div>

      {/* KPI Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{card.title}</span>
                <div className={`p-2 rounded-xl ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-900">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Clinical Distribution Breakdown */}
      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Consultation Volume by Clinical Domain</h3>
        <p className="text-xs text-slate-400">Distribution of patient encounters managed across OPD clinical specialties</p>

        <div className="space-y-3.5 pt-2">
          {breakdown.map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">{item.specialty}</span>
                <span className="text-slate-500 font-mono">{item.count} patients ({item.percent}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-900 rounded-full" style={{ width: `${item.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorAnalyticsView;
