import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  AlertTriangle,
  FolderArchive,
  BarChart3,
  Pill,
  Volume2,
  Bell,
  Menu,
  X,
  User,
  LogOut,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../core/auth';
import {
  getNextWaitingPatient,
  getDashboardStats,
  getEmergencyAlerts,
  acceptEmergencyCase,
  updateDoctorAvailability,
  subscribeDoctorDashboard,
} from '../../modules/doctor/services/doctorDashboardService';

/**
 * DoctorLayout Component
 * Enterprise Doctor Dashboard Layout with dynamic auth context, real-time red-flag alerts,
 * and clinical workspace navigation.
 */
export const DoctorLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nextPatient, setNextPatient] = useState(null);
  const [stats, setStats] = useState({
    awaitingReview: 3,
    emergencyTriage: 1,
  });
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);
  const [onDuty, setOnDuty] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchNavData = async () => {
      try {
        const [next, currentStats, alerts] = await Promise.all([
          getNextWaitingPatient(),
          getDashboardStats(),
          getEmergencyAlerts(),
        ]);
        if (isMounted) {
          setNextPatient(next);
          setStats(currentStats);
          setEmergencyAlerts(alerts || []);
        }
      } catch (err) {
        console.error('Error fetching doctor layout stats:', err);
      }
    };

    fetchNavData();

    // 15-second polling for live emergency notifications
    const pollInterval = setInterval(fetchNavData, 15000);

    const unsubscribe = subscribeDoctorDashboard(({ stats: updatedStats }) => {
      if (isMounted && updatedStats) {
        setStats(updatedStats);
        getNextWaitingPatient().then((np) => isMounted && setNextPatient(np));
      }
    });

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      unsubscribe();
    };
  }, []);

  const handleToggleDuty = async () => {
    const newState = !onDuty;
    setOnDuty(newState);
    try {
      await updateDoctorAvailability({
        on_duty: newState,
        availability_status: newState ? 'AVAILABLE' : 'OFF_DUTY',
      });
    } catch (err) {
      console.error('Failed to update availability:', err);
    }
  };

  const handleClaimAlert = async (caseId) => {
    try {
      const res = await acceptEmergencyCase(caseId);
      if (res?.data?.status === 'CASE_ASSIGNED') {
        setAlertsDropdownOpen(false);
        navigate(`/doctor/cases/${caseId}`);
      } else {
        alert(res?.data?.message || 'This case has already been assigned.');
        const updated = await getEmergencyAlerts();
        setEmergencyAlerts(updated);
      }
    } catch (err) {
      alert(`Claim failed: ${err.message}`);
    }
  };

  const navItems = [
    { name: 'Live OPD Queue', path: '/doctor', icon: ClipboardList, badge: String(stats.awaitingReview || 4) },
    {
      name: 'Priority Triage',
      path: '/doctor?tab=triage',
      icon: AlertTriangle,
      badge: String(stats.emergencyTriage || emergencyAlerts.length || 0),
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    { name: 'Patient Archives', path: '/doctor?tab=archive', icon: FolderArchive },
    { name: 'Clinical Analytics', path: '/doctor?tab=analytics', icon: BarChart3 },
    { name: 'Prescription Templates', path: '/doctor?tab=templates', icon: Pill },
  ];

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-900 flex overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 2. Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 h-full bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-between">
          <div>
            {/* Brand Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2.5 select-none">
                <img
                  src="/logo.png"
                  alt="Sehat"
                  className="h-8 w-auto object-contain"
                />
                <span className="text-[10px] text-sky-600 font-semibold px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 uppercase tracking-wider">
                  Doctor Portal
                </span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="px-3 py-5 space-y-1">
              <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Clinical Workspace
              </div>
              {navItems.map((item) => {
                const [itemPath, itemQuery] = item.path.split('?');
                const isActive = itemQuery
                  ? location.pathname === itemPath && location.search === `?${itemQuery}`
                  : location.pathname === itemPath && !location.search;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-normal transition ${
                      isActive
                        ? 'bg-slate-950 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && item.badge !== '0' && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isActive
                            ? 'bg-slate-800 text-slate-200'
                            : item.badgeColor || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Doctor Profile Footer */}
          <div className="p-4 m-3 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-semibold">
                  <User className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {user?.name || 'Dr. Aarav Sharma'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {user?.department || 'Ayush & Clinical Intake'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                title="Sign out of Doctor Portal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
              <button
                type="button"
                onClick={handleToggleDuty}
                className="inline-flex items-center gap-1.5 font-medium cursor-pointer hover:underline"
              >
                <span className={`w-2 h-2 rounded-full ${onDuty ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span>{onDuty ? 'On Duty (OPD)' : 'Off Duty'}</span>
              </button>
              <span className="text-[10px] text-slate-400 font-mono">Room 104</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 3. Main Dashboard Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Dashboard Topbar */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          {/* Left: Mobile Toggle & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-normal">
              <span className="font-semibold text-slate-800">OPD Clinical Wing</span>
              <span>/</span>
              <span className="text-slate-600">{user?.name || 'Dr. Aarav Sharma'}</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4 relative">
            {/* Call Next Patient Quick CTA */}
            {nextPatient && (
              <button
                type="button"
                onClick={() => navigate(`/doctor/cases/${nextPatient.sessionId || nextPatient.id}`)}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-white bg-slate-950 hover:bg-slate-800 active:scale-95 transition cursor-pointer shadow-xs"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Call Next: <strong>{nextPatient.token}</strong></span>
              </button>
            )}

            {/* Notification Bell with Red-Flag Alert Badge */}
            <div className="relative">
              <button
                onClick={() => setAlertsDropdownOpen(!alertsDropdownOpen)}
                className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                title="Triage & Emergency Alerts"
              >
                <Bell className="w-4 h-4" />
                {emergencyAlerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* Alerts Dropdown Drawer */}
              {alertsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <span>Priority Emergency Broadcasts ({emergencyAlerts.length})</span>
                    </div>
                    <button onClick={() => setAlertsDropdownOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                  </div>

                  {emergencyAlerts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No active emergency red flags broadcasting.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {emergencyAlerts.map((alert) => (
                        <div
                          key={alert.notification_id || alert.case_id}
                          className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-mono font-bold text-rose-900">{alert.case_id}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-600 text-white">
                              {alert.priority || 'EMERGENCY'}
                            </span>
                          </div>
                          <p className="text-slate-700 text-[11px] leading-relaxed">
                            {alert.preview_data?.chief_complaint || alert.preview_data?.triage_reason || 'Severe distress condition detected'}
                          </p>
                          <div className="pt-1 flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleClaimAlert(alert.case_id)}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                            >
                              Accept Case
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Live Clock / Date */}
            <div className="hidden md:block text-right text-xs text-slate-500 font-normal">
              <span className="block text-slate-900 font-medium">Outpatient OPD</span>
              <span className="text-[10px] text-slate-400">08:00 AM – 02:00 PM</span>
            </div>
          </div>
        </header>

        {/* Dashboard Main Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-full w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
