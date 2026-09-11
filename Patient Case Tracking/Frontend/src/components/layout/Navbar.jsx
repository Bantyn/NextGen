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
import { PatientLoginModal } from './PatientLoginModal';

/**
 * Navbar Component
 * High-end, visually appealing header with sticky frosted glassmorphism,
 * segmented pill navigation dock, responsive mobile drawer,
 * unified single Login dropdown for all roles, and dynamic Patient Dashboard visibility.
 */
export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, switchDemoRole, role } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [patientLoginModalOpen, setPatientLoginModalOpen] = useState(false);

  const userDropdownRef = useRef(null);
  const loginDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target)) {
        setLoginDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    setLoginDropdownOpen(false);
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

  const isPatient = isAuthenticated && (role === ROLES.PATIENT || user?.role === 'PATIENT');
  const currentRoleConfig = ROLE_CONFIGS[role] || {};

  // Navigation Links: 'Patient Dashboard' is ONLY visible if patient is logged in
  const navLinks = [
    { label: 'Home', path: '/', isActive: location.pathname === '/' },
    ...(isPatient
      ? [
          {
            label: 'Patient Dashboard',
            path: '/patient/dashboard',
            isActive: location.pathname === '/patient/dashboard',
          },
        ]
      : []),
    {
      label: 'Patient Kiosk',
      path: '/patient/register',
      isActive:
        location.pathname === '/patient/register' ||
        location.pathname === '/patient/intake' ||
        location.pathname === '/patient/success',
    },
    {
      label: 'Doctor OPD',
      path: '/doctor',
      isActive: location.pathname.startsWith('/doctor'),
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-slate-200/70 shadow-sm transition-all font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-4">
          {/* 1. BRAND LOGO */}
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
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              /* Authenticated User Profile Dropdown */
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-white border hover:bg-slate-50 transition cursor-pointer text-left shadow-2xs active:scale-98 ${
                    isPatient ? 'border-emerald-300' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  aria-label="User profile menu"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-medium text-xs shadow-2xs ${
                      isPatient
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-sky-50 border border-sky-200 text-sky-700'
                    }`}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-xs font-medium text-slate-900 leading-tight max-w-[120px] truncate">
                      {user?.name || (isPatient ? 'Patient' : 'Staff User')}
                    </span>
                    <span
                      className={`text-[10px] font-medium leading-tight ${
                        isPatient ? 'text-emerald-700 font-semibold' : 'text-sky-600'
                      }`}
                    >
                      {currentRoleConfig.shortLabel || (isPatient ? 'Patient' : role)}
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
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {user?.abhaId ? `ABHA: ${user.abhaId}` : user?.email}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                        <span>{currentRoleConfig.label || role}</span>
                      </div>
                    </div>

                    {isPatient && (
                      <div className="p-2 border-b border-slate-100">
                        <Link
                          to="/patient/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer"
                        >
                          <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Go to Patient Dashboard</span>
                        </Link>
                      </div>
                    )}

                    {/* Quick Role Switch for Testing */}
                    <div className="p-2 border-b border-slate-100">
                      <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 px-2 py-1">
                        Switch Demo Persona:
                      </div>
                      <div className="space-y-1 mt-1">
                        {DEMO_USERS.map((demo) => {
                          const Icon =
                            demo.role === ROLES.ADMIN
                              ? ShieldCheck
                              : demo.role === ROLES.PATIENT
                              ? User
                              : Stethoscope;

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
                                <span>
                                  {demo.role.charAt(0) + demo.role.slice(1).toLowerCase()} ({demo.name.split(' ')[0]})
                                </span>
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
              /* UNIFIED SINGLE LOGIN DROPDOWN */
              <div className="relative" ref={loginDropdownRef}>
                <button
                  onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                  className="flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-medium text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 transition cursor-pointer shadow-2xs active:scale-98"
                >
                  <LogIn className="w-3.5 h-3.5 text-sky-600" />
                  <span>Login</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Single Login Dropdown Menu */}
                {loginDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200/90 shadow-xl p-2 z-50 animate-scaleUp text-left space-y-1">
                    <div className="px-3 py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Select Portal to Login:
                      </span>
                    </div>

                    {/* 1. Patient Portal Option */}
                    <button
                      onClick={() => {
                        setLoginDropdownOpen(false);
                        setPatientLoginModalOpen(true);
                      }}
                      className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-emerald-50 text-left transition cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-slate-900 group-hover:text-emerald-950 flex items-center gap-1.5">
                          <span>Patient Portal</span>
                          <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                            ABHA
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          Reports, prescriptions, history & OPD queue
                        </p>
                      </div>
                    </button>

                    {/* 2. Doctor OPD Option */}
                    <button
                      onClick={() => {
                        setLoginDropdownOpen(false);
                        switchDemoRole(ROLES.DOCTOR);
                        navigate('/doctor');
                      }}
                      className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-sky-50 text-left transition cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-slate-900 group-hover:text-sky-950">
                          Doctor OPD Portal
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          Clinical consultations, triage & EMR sign-off
                        </p>
                      </div>
                    </button>

                    {/* 3. Hospital Admin Option */}
                    <button
                      onClick={() => {
                        setLoginDropdownOpen(false);
                        switchDemoRole(ROLES.ADMIN);
                        navigate('/doctor');
                      }}
                      className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-purple-50 text-left transition cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-slate-900 group-hover:text-purple-950">
                          Hospital Administrator
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          Staff management, audit logs & facility metrics
                        </p>
                      </div>
                    </button>

                    {/* Standard Password Login Link */}
                    <div className="pt-2 border-t border-slate-100 px-2 pb-1">
                      <Link
                        to="/login"
                        onClick={() => setLoginDropdownOpen(false)}
                        className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center justify-between py-1"
                      >
                        <span>Staff Password Login Page</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Primary CTA button */}
            <Link
              to="/patient/register"
              className="inline-flex items-center gap-1 px-3.5 sm:px-5 py-1.5 rounded-full text-xs font-medium text-white bg-slate-950 hover:bg-slate-800 active:scale-95 transition cursor-pointer shadow-xs"
            >
              <span>Intake</span>
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

            {!isAuthenticated && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-[10px] uppercase font-semibold text-slate-400 px-2">
                  Portal Login:
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setPatientLoginModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer shadow-2xs text-left"
                >
                  <User className="w-4 h-4 text-emerald-600" />
                  <div className="space-y-0.5">
                    <div>Patient Portal (ABHA)</div>
                    <div className="text-[10px] text-emerald-600 font-normal">Reports, history & OPD queue</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    switchDemoRole(ROLES.DOCTOR);
                    navigate('/doctor');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs text-left"
                >
                  <Stethoscope className="w-4 h-4 text-sky-600" />
                  <div className="space-y-0.5">
                    <div>Doctor OPD Portal</div>
                    <div className="text-[10px] text-slate-500 font-normal">Consultation & triage</div>
                  </div>
                </button>

                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-600 hover:text-slate-900 border-t border-slate-100 pt-2"
                >
                  <span>Staff Password Login Page</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            )}

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

      {/* Patient Login Modal */}
      <PatientLoginModal
        isOpen={patientLoginModalOpen}
        onClose={() => setPatientLoginModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
