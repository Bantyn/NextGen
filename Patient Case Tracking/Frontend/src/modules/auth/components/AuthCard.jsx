import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * AuthCard Component
 * High-end Glassmorphic container with institutional branding and compliance badges.
 */
export const AuthCard = ({
  title,
  subtitle,
  children,
  badgeText = 'Healthcare Staff Portal',
  maxWidth = 'max-w-xl',
}) => {
  return (
    <div className={`w-full ${maxWidth} mx-auto px-4 py-6 sm:py-10`}>
      {/* Institutional Header Banner */}
      <div className="flex flex-col items-center text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group select-none">
          <img
            src="/logo.png"
            alt="Sehat"
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* Institution Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-sky-50 text-sky-700 ring-1 ring-sky-200 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{badgeText}</span>
        </div>

        <p className="text-sm font-normal text-slate-500 mb-1">
          Clinical Authentication & OPD Workspace
        </p>

        {title && (
          <h1 className="text-3xl sm:text-4xl font-normal text-slate-950 tracking-tight">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-sm font-normal text-slate-500 mt-2 max-w-md mx-auto">
            {subtitle}
          </p>
        )}
      </div>

      {/* Main Form Container — Identical to Patient Intake Form */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.04)] text-left transition-all">
        {children}
      </div>

      {/* Footer Trust & Security Badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 text-center">
        <span className="flex items-center gap-1">
          <Lock className="w-3.5 h-3.5 text-sky-600" /> 256-Bit Encrypted
        </span>
        <span>•</span>
        <span>ABDM FHIR M2 Compliant</span>
        <span>•</span>
        <span>DPDP Act 2023 Certified</span>
      </div>
    </div>
  );
};

export default AuthCard;
