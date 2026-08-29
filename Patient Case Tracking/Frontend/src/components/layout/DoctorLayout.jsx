import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  AlertTriangle,
  FolderArchive,
  BarChart3,
  Pill,
  Mic,
  Globe,
  Volume2,
  Bell,
  Menu,
  X,
  User,
} from 'lucide-react';

/**
 * DoctorLayout Component
 * Enterprise Doctor Dashboard Layout with Untitled UI / Lucide vector icons (no emojis).
 */
export const DoctorLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Live OPD Queue', path: '/doctor', icon: ClipboardList, badge: '4' },
    {
      name: 'Priority Triage',
      path: '/doctor?tab=triage',
      icon: AlertTriangle,
      badge: '1',
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    { name: 'Patient Archives', path: '/doctor?tab=archive', icon: FolderArchive },
    { name: 'Clinical Analytics', path: '/doctor?tab=analytics', icon: BarChart3 },
    { name: 'Prescription Templates', path: '/doctor?tab=templates', icon: Pill },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 2. Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 select-none">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-6 rounded-full bg-sky-400" />
                <div className="w-2.5 h-7 rounded-full bg-amber-400" />
                <div className="w-2.5 h-6 rounded-full bg-rose-400" />
                <div className="w-2.5 h-5 rounded-full bg-emerald-400" />
              </div>
              <div>
                <span className="text-base font-normal tracking-tight text-slate-900 block leading-tight">
                  MediKiosk
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Doctor Portal
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-6 space-y-1">
            <div className="px-3 text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-2">
              Clinical Workspace
            </div>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path && !location.search;
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
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
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

          {/* Kiosk Mode Shortcut */}
          <div className="px-3 pt-2">
            <div className="px-3 text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-2">
              Quick Switch
            </div>
            <Link
              to="/patient/register"
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-normal text-slate-600 hover:bg-slate-100 transition"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Open Patient Kiosk</span>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-normal text-slate-600 hover:bg-slate-100 transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Public Landing Page</span>
            </Link>
          </div>
        </div>

        {/* Doctor Profile Footer */}
        <div className="p-4 m-3 rounded-2xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-normal">
              <User className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs font-medium text-slate-900 truncate">
                Dr. Arvind Sharma
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                MD (Ayu) • Room 104
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              On Duty (OPD)
            </span>
            <span className="text-slate-400">Shift A</span>
          </div>
        </div>
      </aside>

      {/* 3. Main Dashboard Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Dashboard Topbar */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          {/* Mobile Menu Toggle & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-normal">
              <span>OPD Dept</span>
              <span>/</span>
              <span className="text-slate-900 font-medium">Room 104 Dashboard</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-4">
            {/* Call Next Patient Quick CTA */}
            <button
              onClick={() => navigate('/doctor/cases/DEMO_GUJARATI_001')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-normal text-white bg-slate-950 hover:bg-slate-800 active:scale-95 transition cursor-pointer shadow-xs"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Call Next: <strong>TK-101</strong></span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => alert('1 Priority Red-Flag Alert in Queue (Sunita Sharma - Chest Tightness)')}
              className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Triage Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {/* Live Clock / Date */}
            <div className="hidden md:block text-right text-xs text-slate-500 font-normal">
              <span className="block text-slate-900 font-medium">Wednesday</span>
              <span className="text-[10px] text-slate-400">Morning OPD</span>
            </div>
          </div>
        </header>

        {/* Dashboard Main Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-full w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
