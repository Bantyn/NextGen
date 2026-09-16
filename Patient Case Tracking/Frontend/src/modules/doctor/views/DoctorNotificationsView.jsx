import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  getDoctorNotifications,
  markDoctorNotificationRead,
} from '../services/doctorDashboardService';

export const DoctorNotificationsView = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDoctorNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load doctor notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await markDoctorNotificationRead(id);
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Notifications & Alerts</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Notification Center
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Emergency broadcasts, priority triage dispatches, and clinical laboratory updates.
          </p>
        </div>

        <button
          onClick={fetchNotifications}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200 rounded-xl transition cursor-pointer self-start sm:self-auto shadow-2xs"
          title="Refresh notifications"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
        </button>
      </div>

      {/* Notifications Feed */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          No active notifications.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isEmergency = n.type === 'EMERGENCY';
            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                  isEmergency
                    ? 'bg-rose-50/70 border-rose-200/90 shadow-2xs'
                    : n.read
                    ? 'bg-white border-slate-200/80 opacity-75'
                    : 'bg-white border-slate-200 shadow-2xs ring-1 ring-sky-500/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isEmergency ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isEmergency ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <Bell className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xs font-bold ${isEmergency ? 'text-rose-900' : 'text-slate-900'}`}>
                        {n.title}
                      </h4>
                      {isEmergency && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white uppercase">
                          STAT
                        </span>
                      )}
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {n.time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {n.caseId && (
                    <button
                      onClick={() => navigate(`/doctor/cases/${n.caseId}`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-950 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer shadow-xs"
                    >
                      <span>View Case</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorNotificationsView;
