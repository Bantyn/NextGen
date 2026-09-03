import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal Dialog Component — Glassmorphism & Backdrop Blur
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  showClose = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity animate-fadeIn"
      />

      {/* Modal Box */}
      <div
        className={`relative w-full ${sizeStyles[size]} rounded-[28px] bg-[var(--surface-card)] border border-[var(--glass-border)] shadow-2xl backdrop-blur-2xl p-6 sm:p-8 z-10 animate-scaleUp text-left`}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[var(--border-subtle)] mb-5">
          <div>
            {title && <h3 className="text-lg font-normal text-[var(--text-main)]">{title}</h3>}
            {description && (
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-normal">
                {description}
              </p>
            )}
          </div>

          {showClose && (
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1.5 rounded-xl hover:bg-[var(--border-subtle)] transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="py-2 text-[var(--text-main)]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="pt-5 mt-6 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
