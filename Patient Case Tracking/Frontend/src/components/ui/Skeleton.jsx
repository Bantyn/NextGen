import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton Primitive Component
 * Theme-compliant glassmorphism shimmer placeholder based on Planner/Theme.md
 */
export const Skeleton = ({
  className,
  variant = 'rectangular', // 'text' | 'circular' | 'rectangular' | 'card'
  width,
  height,
  style,
  ...props
}) => {
  const variantClasses = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full shrink-0',
    rectangular: 'rounded-xl w-full',
    card: 'rounded-2xl w-full border border-slate-200/70 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md',
  };

  return (
    <div
      className={cn(
        'skeleton-shimmer overflow-hidden relative select-none',
        variantClasses[variant] || variantClasses.rectangular,
        className
      )}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
};

/**
 * SkeletonStats Component
 * 4 metric cards matching Doctor & Hospital OPD statistics
 */
export const SkeletonStats = ({ count = 4, className }) => {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-md shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton variant="circular" className="w-10 h-10" />
            <Skeleton variant="text" className="w-12 h-4 rounded-full" />
          </div>
          <div className="space-y-1.5 pt-1">
            <Skeleton variant="text" className="w-16 h-7 rounded-lg" />
            <Skeleton variant="text" className="w-28 h-3.5" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonTable Component
 * Tabular placeholder for OPD Queues, Prescriptions, Lab Reports, etc.
 */
export const SkeletonTable = ({ rows = 5, cols = 5, className }) => {
  return (
    <div className={cn('w-full rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-xs', className)}>
      {/* Header Row */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/40">
        <Skeleton variant="text" className="w-40 h-5" />
        <Skeleton variant="text" className="w-24 h-4 rounded-full" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="px-6 py-4 flex items-center gap-4">
            <Skeleton variant="circular" className="w-9 h-9" />
            <div className="flex-1 space-y-1.5">
              <Skeleton variant="text" className="w-1/3 h-4" />
              <Skeleton variant="text" className="w-1/2 h-3 text-slate-400" />
            </div>
            <Skeleton variant="text" className="w-20 h-6 rounded-full hidden sm:block" />
            <Skeleton variant="text" className="w-16 h-4 hidden md:block" />
            <Skeleton variant="text" className="w-20 h-8 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * SkeletonPatientProfile Component
 * Patient header placeholder with demographics, ABHA ID pill, and status badges
 */
export const SkeletonPatientProfile = ({ className }) => {
  return (
    <div className={cn('p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs space-y-6', className)}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" className="w-16 h-16 sm:w-20 sm:h-20" />
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Skeleton variant="text" className="w-48 h-6 sm:h-7" />
              <Skeleton variant="text" className="w-20 h-5 rounded-full" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Skeleton variant="text" className="w-36 h-4" />
              <Skeleton variant="text" className="w-24 h-4" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Skeleton variant="text" className="w-28 h-9 rounded-full" />
          <Skeleton variant="text" className="w-24 h-9 rounded-full" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
            <Skeleton variant="text" className="w-16 h-3" />
            <Skeleton variant="text" className="w-24 h-5" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * SkeletonCard Component
 * Versatile card placeholder with title, subtitle, and body
 */
export const SkeletonCard = ({ className, lines = 3 }) => {
  return (
    <div className={cn('p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-md shadow-xs space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-1/3 h-5" />
        <Skeleton variant="text" className="w-16 h-4 rounded-full" />
      </div>
      <div className="space-y-2.5 pt-1">
        {Array.from({ length: lines }).map((_, idx) => (
          <Skeleton
            key={idx}
            variant="text"
            className={cn('h-3.5', idx === lines - 1 ? 'w-2/3' : 'w-full')}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * SkeletonIntakeChat Component
 * Chat bubbles simulating AI conversational intake
 */
export const SkeletonIntakeChat = ({ turns = 4, className }) => {
  return (
    <div className={cn('space-y-4 p-4', className)}>
      {Array.from({ length: turns }).map((_, idx) => {
        const isBot = idx % 2 === 0;
        return (
          <div
            key={idx}
            className={cn('flex gap-3', isBot ? 'justify-start' : 'justify-end')}
          >
            {isBot && <Skeleton variant="circular" className="w-8 h-8 shrink-0 mt-1" />}
            <div
              className={cn(
                'p-4 rounded-2xl max-w-md space-y-2',
                isBot
                  ? 'bg-slate-100/90 dark:bg-slate-800/90 rounded-tl-sm'
                  : 'bg-sky-50 dark:bg-sky-950/40 rounded-tr-sm'
              )}
            >
              <Skeleton variant="text" className="w-3/4 h-3.5" />
              <Skeleton variant="text" className="w-full h-3" />
              <Skeleton variant="text" className="w-1/2 h-2.5" />
            </div>
            {!isBot && <Skeleton variant="circular" className="w-8 h-8 shrink-0 mt-1" />}
          </div>
        );
      })}
    </div>
  );
};

/**
 * SkeletonCaseDetail Component
 * Full clinical consultation workspace skeleton (Tabs, Summary, Sidebar)
 */
export const SkeletonCaseDetail = ({ className }) => {
  return (
    <div className={cn('space-y-6 max-w-7xl mx-auto', className)}>
      {/* Top Banner / Patient Header */}
      <SkeletonPatientProfile />

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="text" className="w-28 h-9 rounded-xl" />
        ))}
      </div>

      {/* Main Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard lines={5} />
          <SkeletonTable rows={4} />
        </div>
        <div className="space-y-6">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
