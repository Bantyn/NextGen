import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Navbar Component
 * Minimalist top navigation bar matching HappyOps design.
 * Single-page router links with active indicators.
 */
export const Navbar = ({ onActionClick }) => {
  const location = useLocation();

  return (
    <header className="w-full max-w-7xl mx-auto px-6 sm:px-12 pt-7 pb-4 flex items-center justify-between relative z-20">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2.5 cursor-pointer select-none">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-6 rounded-full bg-sky-400" />
          <div className="w-2.5 h-7 rounded-full bg-amber-400" />
          <div className="w-2.5 h-6 rounded-full bg-rose-400" />
          <div className="w-2.5 h-5 rounded-full bg-emerald-400" />
        </div>
        <span className="text-xl font-normal tracking-tight text-slate-900 ml-1">
          MediKisok
        </span>
      </Link>

      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-normal text-slate-700">
        <Link
          to="/"
          className={`transition ${
            location.pathname === '/' ? 'text-slate-950 font-medium' : 'hover:text-slate-950'
          }`}
        >
          Home
        </Link>
        <Link
          to="/patient/register"
          className={`transition ${
            location.pathname.startsWith('/patient')
              ? 'text-slate-950 font-medium'
              : 'hover:text-slate-950'
          }`}
        >
          Patient Kiosk
        </Link>
        <Link
          to="/doctor"
          className={`transition ${
            location.pathname.startsWith('/doctor')
              ? 'text-slate-950 font-medium'
              : 'hover:text-slate-950'
          }`}
        >
          Doctor OPD
        </Link>
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-5">
        <Link
          to="/patient/register"
          className="px-6 py-2 rounded-full text-sm font-normal text-white bg-slate-950 hover:bg-slate-800 active:scale-95 transition cursor-pointer shadow-xs"
        >
          Start Intake
        </Link>
        <div className="text-xs font-normal text-slate-500 flex items-center gap-1">
          <span className="text-slate-900 font-medium cursor-pointer">EN</span>
          <span>/</span>
          <span className="cursor-pointer hover:text-slate-800 transition">DE</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
