import React from 'react';

/**
 * Footer Component
 * Minimalist partner/tech logo banner positioned over the soft bottom gradient.
 */
export const Footer = () => {
  return (
    <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 py-10 flex items-center justify-center">
      <div className="w-full flex items-center justify-center sm:justify-between flex-wrap gap-8 sm:gap-14 opacity-75 hover:opacity-100 transition text-slate-800">
        {/* CBC */}
        <div className="flex items-center gap-2 text-xs font-medium tracking-wider">
          <span className="w-5 h-5 rounded-sm bg-slate-900 text-white flex items-center justify-center text-[10px] font-normal">
            C
          </span>
          <span>CBC</span>
        </div>

        {/* ERHARD */}
        <div className="flex items-center gap-1.5 text-xs font-normal tracking-wide">
          <div className="w-3.5 h-3.5 rounded-full border border-slate-900 flex items-center justify-center text-[8px]">
            ●
          </div>
          <span className="uppercase tracking-widest text-[11px]">ERHARD</span>
        </div>

        {/* MICROGLAS */}
        <div className="flex items-center gap-1 text-[11px] font-normal tracking-wider uppercase text-slate-700">
          <span className="px-1 py-0.5 rounded border border-slate-400 text-[9px]">MG</span>
          <span>MICROGLAS</span>
        </div>

        {/* HKR */}
        <div className="flex items-center gap-1">
          <span className="text-base font-normal tracking-tighter text-slate-900">hkr</span>
          <span className="text-[8px] text-slate-400 block leading-tight">team for quality</span>
        </div>

        {/* SITECO */}
        <div className="text-xs font-normal tracking-widest uppercase text-slate-900">
          siteco
        </div>
      </div>
    </footer>
  );
};

export default Footer;
