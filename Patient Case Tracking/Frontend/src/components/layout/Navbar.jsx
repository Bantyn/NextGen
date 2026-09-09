import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LogIn,
  LogOut,
  ChevronDown,
  Stethoscope,
  ShieldCheck,
  User,
  Menu,
  X,
  Sparkles,
  ArrowRight,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../../core/auth/useAuth';
import { ROLES, ROLE_CONFIGS, DEMO_USERS } from '../../core/config/roles';

/**
 * Navbar Component
 * High-end, visually appealing header with sticky frosted glassmorphism,
 * segmented pill navigation dock, responsive mobile drawer, and quick demo role switcher.
 */
export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, switchDemoRole, role } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleSwitchRole = (newRole) => {
    switchDemoRole(newRole);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    const targetRoute = ROLE_CONFIGS[newRole]?.defaultRoute || '/doctor';
    navigate(targetRoute);
  };

  const currentRoleConfig = ROLE_CONFIGS[role] || {};

  const navLinks = [
    { label: 'Home', path: '/', isActive: location.pathname === '/' },
    {
      label: 'Patient Kiosk',
      path: '/patient/register',
      isActive: location.pathname.startsWith('/patient'),
    },
    {
      label: 'Doctor OPD',
      path: '/doctor',
      isActive: location.pathname.startsWith('/doctor'),
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-slate-200/70 shadow-sm transition-all font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-4">
        {/* 1. BRAND LOGO & CLINICAL BADGE */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer select-none group">
            <img
              src="/logo.png"
              alt="Sehat"
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>

        </div>

        {/* 2. CENTER NAVIGATION LINKS (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-normal text-slate-600">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`transition-colors duration-150 select-none ${
                link.isActive
                  ? 'text-slate-950 font-medium'
                  : 'hover:text-slate-950'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 3. RIGHT ACTIONS & USER PROFILE */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer text-left shadow-2xs active:scale-98"
                aria-label="User profile menu"
              >
                <div className="w-7 h-7 rounded-full bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-medium text-xs shadow-2xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-medium text-slate-900 leading-tight max-w-[110px] truncate">
                    {user?.name || 'Staff User'}
                  </span>
                  <span className="text-[10px] text-sky-600 font-medium leading-tight">
                    {currentRoleConfig.shortLabel || role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200/90 shadow-xl p-2 z-50 animate-scaleUp text-left">
                  <div className="p-3 border-b border-slate-100">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {user?.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</div>
                    <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                      <span>{currentRoleConfig.label || role}</span>
                    </div>
                  </div>

                  {/* Quick Role Switch for Hackathon Testing */}
                  <div className="p-2 border-b border-slate-100">
                    <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 px-2 py-1">
                      Quick Role Switch:
                    </div>
                    <div className="space-y-1 mt-1">
                      {DEMO_USERS.map((demo) => {
                        const Icon = demo.role === ROLES.ADMIN ? ShieldCheck : Stethoscope;

                        return (
                          <button
                            key={demo.role}
                            onClick={() => handleSwitchRole(demo.role)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                              role === demo.role
                                ? 'bg-slate-950 text-white font-medium'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span>{demo.role.charAt(0) + demo.role.slice(1).toLowerCase()}</span>
                            </div>
                            {role === demo.role && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-medium text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 transition cursor-pointer shadow-2xs active:scale-98"
            >
              <LogIn className="w-3.5 h-3.5 text-sky-600" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Primary CTA button */}
          <Link
            to="/patient/register"
            className="inline-flex items-center gap-1 px-4 sm:px-5 py-1.5 rounded-full text-xs font-medium text-white bg-slate-950 hover:bg-slate-800 active:scale-95 transition cursor-pointer shadow-xs"
          >
            <span>Start Intake</span>
            <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
          </Link>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-full text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 4. MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-fadeIn shadow-lg">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  link.isActive
                    ? 'bg-slate-100 text-slate-950 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              ABDM FHIR M2 Compliant
            </span>
            <span className="text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
              DPDP Act 2023
            </span>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
