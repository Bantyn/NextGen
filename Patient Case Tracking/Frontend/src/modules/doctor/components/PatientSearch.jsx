import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * PatientSearch Component
 * Dynamic client-side search input matching the reference design.
 */
export const PatientSearch = ({ value, onChange, onClear }) => {
  return (
    <div className="relative min-w-[260px] sm:w-72">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search patient, token, complaint..."
        aria-label="Search patient by name, token, or chief complaint"
        className="w-full pl-9 pr-8 py-2 rounded-full border border-slate-200 bg-white text-slate-900 text-xs font-normal placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 shadow-2xs transition"
      />
      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default PatientSearch;
