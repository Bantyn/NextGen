import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * QueueFilters Component
 * Filter pills for OPD Queue: All Cases, Pending Review, Triage Alerts, Completed.
 */
export const QueueFilters = ({
  activeFilter = 'ALL',
  onFilterChange,
  pendingCount = 3,
  redFlagCount = 1,
}) => {
  const filterTabs = [
    { id: 'ALL', label: 'All Cases' },
    { id: 'PENDING', label: `Pending Review (${pendingCount})` },
    { id: 'RED_FLAG', label: `Triage Alerts (${redFlagCount})`, icon: AlertTriangle },
    { id: 'APPROVED', label: 'Completed' },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap" role="tablist" aria-label="Case status filters">
      {filterTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeFilter === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilterChange(tab.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-normal transition cursor-pointer ${
              isActive
                ? 'bg-slate-950 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
            }`}
          >
            {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-rose-500'}`} />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default QueueFilters;
