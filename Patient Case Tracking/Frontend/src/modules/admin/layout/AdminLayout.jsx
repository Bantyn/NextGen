import React, { useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import AdminSidebar from '../components/AdminSidebar';

/**
 * AdminLayout Component
 * Enterprise Layout framework wrapping the sidebar, header, and dynamic tab viewport.
 */
export const AdminLayout = ({
  children,
  activeTab,
  onSelectTab,
  activeTabTitle,
  systemStatus,
  onRefresh,
  refreshing,
  counts,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-900 flex overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Collapsible Admin Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
        counts={counts}
      />

      {/* 2. Main Administration Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <AdminHeader
          activeTabTitle={activeTabTitle}
          systemStatus={systemStatus}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        {/* Dynamic View Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-full w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
