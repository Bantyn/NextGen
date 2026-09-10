import React from 'react';
import { Menu, RefreshCw, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../../../core/auth';

/**
 * AdminHeader Component
 * Top bar with breadcrumb, live system health indicator, data refresh CTA, and admin profile.
 */
export const AdminHeader = ({
  activeTabTitle = 'Operations Dashboard',
  systemStatus = 'ALL_SYSTEMS_OPERATIONAL',
  onRefresh,
  refreshing = false,
  onMenuToggle,
}) => {
  const { user, logout } = useAuth();

  const isHealthy = systemStatus === 'ALL_SYSTEMS_OPERATIONAL';

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-normal">
          <span className="font-semibold text-slate-900">Sehat Admin</span>
          <span>/</span>
          <span className="text-slate-600 capitalize">{activeTabTitle}</span>
        </div>
      </div>

      {/* Right: Live Diagnostics, Refresh, User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* System Health Status Indicator */}
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-50 border border-emerald-200/80 text-emerald-700">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isHealthy ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </span>
          <span>{isHealthy ? 'Systems Operational' : 'Degraded Services'}</span>
        </div>

        {/* Data Refresh Button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
            title="Refresh live metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-500' : ''}`} />
          </button>
        )}

        {/* Admin User Profile Capsule */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-900 leading-tight">
              {user?.name || 'Administrator'}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              SUPER_ADMIN
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer ml-1"
            title="Sign out of Admin Panel"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
