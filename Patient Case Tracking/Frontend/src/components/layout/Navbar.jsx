import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, ChevronDown, Stethoscope, HeartPulse, UserCheck, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../core/auth/useAuth';
import { ROLES, ROLE_CONFIGS, DEMO_USERS } from '../../core/config/roles';

/**
 * Navbar Component
 * Minimalist top navigation bar with dynamic user authentication status & quick demo role switcher.
 */
export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, switchDemoRole, role } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const handleSwitchRole = (newRole) => {
    switchDemoRole(newRole);
    setDropdownOpen(false);
    const targetRoute = ROLE_CONFIGS[newRole]?.defaultRoute || '/doctor';
    navigate(targetRoute);
  };

  const currentRoleConfig = ROLE_CONFIGS[role] || {};

  return (
    <header className="w-full max-w-7xl mx-auto px-6 sm:px-12 pt-7 pb-4 flex items-center justify-between relative z-30">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2.5 cursor-pointer select-none group">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-6 rounded-full bg-sky-400 group-hover:scale-105 transition" />
          <div className="w-2.5 h-7 rounded-full bg-amber-400 group-hover:scale-105 transition" />
          <div className="w-2.5 h-6 rounded-full bg-rose-400 group-hover:scale-105 transition" />
          <div className="w-2.5 h-5 rounded-full bg-emerald-400 group-hover:scale-105 transition" />
        </div>
        <span className="text-xl font-normal tracking-tight text-[var(--text-main)] ml-1">
          MediKiosk
        </span>
      </Link>

      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-normal text-[var(--text-secondary)]">
        <Link
          to="/"
          className={`transition ${
            location.pathname === '/' ? 'text-[var(--text-main)] font-medium' : 'hover:text-[var(--text-main)]'
          }`}
        >
          Home
        </Link>
        <Link
          to="/patient/register"
          className={`transition ${
            location.pathname.startsWith('/patient')
              ? 'text-[var(--text-main)] font-medium'
              : 'hover:text-[var(--text-main)]'
          }`}
        >
          Patient Kiosk
        </Link>
        <Link
          to="/doctor"
          className={`transition ${
            location.pathname.startsWith('/doctor')
              ? 'text-[var(--text-main)] font-medium'
              : 'hover:text-[var(--text-main)]'
          }`}
        >
          Doctor OPD
        </Link>
      </nav>

      {/* Right Actions & Auth State */}
      <div className="flex items-center gap-3 sm:gap-4">
        {isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-[var(--surface-input)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] transition cursor-pointer text-left"
            >
              <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-medium text-xs">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-medium text-[var(--text-main)] leading-tight max-w-[120px] truncate">
                  {user?.name || 'Staff User'}
                </span>
                <span className="text-[10px] text-sky-400 leading-tight">
                  {currentRoleConfig.shortLabel || role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>

            {/* User Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[var(--surface-card)] border border-[var(--glass-border)] shadow-xl backdrop-blur-2xl p-2 z-50 animate-scaleUp text-left">
                <div className="p-3 border-b border-[var(--border-subtle)]">
                  <div className="text-xs font-medium text-[var(--text-main)] truncate">
                    {user?.name}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] truncate">{user?.email}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <span>{currentRoleConfig.label || role}</span>
                  </div>
                </div>

                {/* Quick Role Switch for Hackathon Testing */}
                <div className="p-2 border-b border-[var(--border-subtle)]">
                  <div className="text-[10px] uppercase font-medium text-[var(--text-muted)] px-2 py-1">
                    Quick Role Switch:
                  </div>
                  <div className="space-y-1 mt-1">
                    {DEMO_USERS.map((demo) => {
                      let Icon = Stethoscope;
                      if (demo.role === ROLES.NURSE) Icon = HeartPulse;
                      if (demo.role === ROLES.RECEPTIONIST) Icon = UserCheck;
                      if (demo.role === ROLES.ADMIN) Icon = ShieldCheck;

                      return (
                        <button
                          key={demo.role}
                          onClick={() => handleSwitchRole(demo.role)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                            role === demo.role
                              ? 'bg-[var(--primary-light)] text-[var(--primary)] font-medium'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-input)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{demo.role.charAt(0) + demo.role.slice(1).toLowerCase()}</span>
                          </div>
                          {role === demo.role && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-[var(--text-main)] bg-[var(--surface-input)] hover:bg-[var(--surface-card-hover)] border border-[var(--border-subtle)] transition cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-sky-400" />
            <span>Sign In</span>
          </Link>
        )}

        <Link
          to="/patient/register"
          className="px-5 py-2 rounded-full text-xs font-medium text-white bg-slate-950 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-600 active:scale-95 transition cursor-pointer shadow-xs"
        >
          Start Intake
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
