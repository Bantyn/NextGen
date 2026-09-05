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
    <div className={`w-full ${maxWidth} mx-auto px-4 py-6`}>
      {/* Institutional Header Banner */}
      <div className="flex flex-col items-center text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group select-none">
          <img
            src="/logo.png"
            alt="Sehat"
            className="h-10 w-auto object-contain dark:invert dark:brightness-0"
          />
        </Link>

        {/* Institution Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-normal bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Ministry of Ayush • AIIA New Delhi</span>
        </div>

        {title && (
          <h1 className="text-2xl sm:text-3xl font-normal text-[var(--text-main)] tracking-tight">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 font-normal max-w-md">
            {subtitle}
          </p>
        )}
      </div>

      {/* Main Glassmorphic Card */}
      <div className="rounded-[28px] bg-[var(--surface-card)] border border-[var(--glass-border)] shadow-2xl backdrop-blur-2xl p-6 sm:p-8 text-left transition-all">
        {children}
      </div>

      {/* Footer Trust & Security Badges */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-[var(--text-muted)] text-center">
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-sky-400" /> 256-Bit Encrypted
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
