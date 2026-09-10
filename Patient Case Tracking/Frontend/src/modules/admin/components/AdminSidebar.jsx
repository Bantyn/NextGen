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
} from 'lucide-react';

/**
 * AdminSidebar Component
 * Categorized navigation for the Sehat Operations Control Center.
 */
export const AdminSidebar = ({
  activeTab = 'dashboard',
  onSelectTab,
  sidebarOpen = false,
  onCloseSidebar,
  counts = {},
}) => {
  const sections = [
    {
      group: 'Overview',
      items: [
        { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'Clinical Operations',
      items: [
        {
          id: 'queue',
          label: 'Live OPD Queue',
          icon: ClipboardList,
          badge: counts.waiting_patients ? String(counts.waiting_patients) : null,
        },
        {
          id: 'triage',
          label: 'Triage & Red Flags',
          icon: AlertTriangle,
          badge: counts.emergency_cases ? String(counts.emergency_cases) : null,
          badgeColor: 'bg-rose-100 text-rose-700',
        },
      ],
    },
    {
      group: 'People & Directory',
      items: [
        {
          id: 'patients',
          label: 'Patient Directory',
          icon: Users,
          badge: counts.total_patients ? String(counts.total_patients) : null,
        },
        {
          id: 'doctors',
          label: 'Doctors & Schedules',
          icon: Stethoscope,
          badge: counts.doctors_available ? `${counts.doctors_available} on duty` : null,
          badgeColor: 'bg-emerald-100 text-emerald-700',
        },
      ],
    },
    {
      group: 'Knowledge & AI Control',
      items: [
        { id: 'medicines', label: 'Medicines & openFDA', icon: Pill },
        { id: 'knowledge', label: 'AI Knowledge Base', icon: BookOpen },
        { id: 'assistant', label: 'Smart Assistant Config', icon: Bot },
      ],
    },
    {
      group: 'Governance & Telemetry',
      items: [
        { id: 'analytics', label: 'Clinical Analytics', icon: BarChart3 },
        { id: 'audit', label: 'Security Audit Logs', icon: ShieldAlert },
        { id: 'health', label: 'System Diagnostics', icon: Activity },
        { id: 'settings', label: 'Settings & RBAC', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseSidebar}
        />
      )}

      {/* Sidebar Navigation Panel */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 h-full bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 select-none">
            <img
              src="/logo.png"
              alt="Sehat"
              className="h-8 w-auto object-contain"
            />
            <span className="text-[10px] text-purple-700 font-semibold px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 uppercase tracking-wider">
              Control Panel
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
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
          {sections.map((sec) => (
            <div key={sec.group}>
              <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                {sec.group}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-slate-950 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
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
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Facility Info */}
        <div className="p-3 m-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center text-[11px] text-slate-500 font-normal">
          <div className="font-medium text-slate-800">All India Institute of Ayurveda</div>
          <div className="text-[10px] text-slate-400">Node: sehat-master-prod-01</div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
