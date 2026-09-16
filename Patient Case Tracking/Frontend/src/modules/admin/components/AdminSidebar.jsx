import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  Users,
  Stethoscope,
  Pill,
  BookOpen,
  Bot,
  BarChart3,
  ShieldAlert,
  Activity,
  Settings,
  X,
  User,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../../core/auth';

/**
 * AdminSidebar Component
 * Redesigned to match DoctorLayout sidebar aesthetic:
 * - Fixed brand header with pill badge
 * - Consistent navigation spacing, typography, and dark-pill active selection
 * - DoctorLayout-style profile/session footer card with quick logout
 */
export const AdminSidebar = ({
  activeTab = 'dashboard',
  onSelectTab,
  sidebarOpen = false,
  onCloseSidebar,
  counts = {},
}) => {
  const { user, logout } = useAuth();

  const sections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'CLINICAL OPERATIONS',
      items: [
        {
          id: 'queue',
          name: 'Live OPD Queue',
          icon: ClipboardList,
          badge: counts.waiting_patients ? String(counts.waiting_patients) : null,
        },
        {
          id: 'triage',
          name: 'Triage & Red Flags',
          icon: AlertTriangle,
          badge: counts.emergency_cases ? String(counts.emergency_cases) : null,
          badgeColor: 'bg-rose-100 text-rose-700',
        },
      ],
    },
    {
      title: 'PEOPLE & DIRECTORY',
      items: [
        {
          id: 'patients',
          name: 'Patient Directory',
          icon: Users,
          badge: counts.total_patients ? String(counts.total_patients) : null,
        },
        {
          id: 'doctors',
          name: 'Doctors & Staff',
          icon: Stethoscope,
          badge: counts.doctors_available ? `${counts.doctors_available}` : null,
          badgeColor: 'bg-emerald-100 text-emerald-700',
        },
      ],
    },
    {
      title: 'KNOWLEDGE & AI',
      items: [
        { id: 'medicines', name: 'Medicines & openFDA', icon: Pill },
        { id: 'knowledge', name: 'AI Knowledge Base', icon: BookOpen },
        { id: 'assistant', name: 'Smart Assistant Config', icon: Bot },
      ],
    },
    {
      title: 'GOVERNANCE & SYSTEM',
      items: [
        { id: 'analytics', name: 'Clinical Analytics', icon: BarChart3 },
        { id: 'audit', name: 'Security Audit Logs', icon: ShieldAlert },
        { id: 'health', name: 'System Diagnostics', icon: Activity },
        { id: 'settings', name: 'Settings & RBAC', icon: Settings },
      ],
    },
  ];

  const adminName = user?.name || 'Administrator';
  const adminRole = user?.role || 'Super Admin';

  return (
    <>
      {/* 1. Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseSidebar}
        />
      )}

      {/* 2. Sidebar Navigation */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 h-full bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 relative overflow-y-auto custom-scrollbar flex flex-col justify-between">
          <div>
            {/* Brand Header */}
            <div className="p-4 border-b fixed bg-white top-0 border-slate-100 flex items-center justify-between w-64 z-10">
              <Link to="/" className="flex items-center gap-2.5 select-none">
                <img
                  src="/logo.png"
                  alt="Sehat"
                  className="h-7 w-auto object-contain"
                />
                <span className="text-[10px] text-purple-700 font-semibold px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 uppercase tracking-wider">
                  Admin Portal
                </span>
              </Link>
              <button
                type="button"
                onClick={onCloseSidebar}
                className="lg:hidden text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Sections */}
            <div className="px-3 pb-44 mt-15 py-5 space-y-6">
              {sections.map((section) => (
                <div key={section.title} className="space-y-0.5">
                  <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    {section.title}
                  </div>
                  {section.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(item.id);
                          if (onCloseSidebar) onCloseSidebar();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-3 mt-1.5 rounded-xl text-xs font-normal transition text-left cursor-pointer ${
                          isActive
                            ? 'bg-slate-950 text-white shadow-xs font-medium'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {item.badge && item.badge !== '0' && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                              isActive
                                ? 'bg-slate-800 text-slate-200'
                                : item.badgeColor || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Admin Profile Footer */}
          <div className="p-3.5 m-3 w-58 fixed bottom-0 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {adminName}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {adminRole}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer shrink-0"
                title="Sign out of Admin Portal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
              <div className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-500">Master Prod-01</span>
              </div>
              <span className="text-[10px] text-purple-600 font-semibold px-1.5 py-0.2 rounded bg-purple-50 border border-purple-100">
                Active
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
