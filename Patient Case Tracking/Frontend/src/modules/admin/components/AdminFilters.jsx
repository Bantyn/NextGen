import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * AdminFilters Component
 * Search bar with instant clearing and filter button pills.
 */
export const AdminFilters = ({
  search = '',
  onSearchChange,
  placeholder = 'Search by name, ID, or keywords...',
  filters = [], // [{ label, value, active, onClick }]
  actions,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Pills and Action Slot */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((f, idx) => (
          <button
            key={f.value || idx}
            onClick={f.onClick}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              f.active
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}

        {actions && <div className="ml-auto">{actions}</div>}
      </div>
    </div>
  );
};

export default AdminFilters;
