import React from 'react';
import { Bot, Sparkles, X } from 'lucide-react';

/**
 * SmartAssistantButton Component
 * Floating action button in the bottom right corner with Apple/Linear glassmorphism styling.
 */
export const SmartAssistantButton = ({ isOpen, onClick, unreadCount = 0 }) => {
  return (
    <button
      id="smart-assistant-trigger"
      type="button"
      onClick={onClick}
      aria-label={isOpen ? 'Close Smart AI Assistant' : 'Open Smart AI Assistant'}
      className={`fixed bottom-6 right-6 z-50 flex items-center justify-center p-3.5 sm:px-4 sm:py-3 rounded-full text-white transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl active:scale-95 group ${
        isOpen
          ? 'bg-slate-900 border border-slate-700/80'
          : 'bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 border border-sky-500/30 hover:border-sky-400'
      }`}
    >
      <div className="relative flex items-center gap-2">
        {isOpen ? (
          <X className="w-5 h-5 text-slate-300 group-hover:text-white transition-transform group-hover:rotate-90" />
        ) : (
          <>
            <div className="relative">
              <Bot className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
              <Sparkles className="w-2.5 h-2.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="hidden sm:inline-block text-xs font-normal tracking-wide text-slate-100 pl-1">
              Ask Smart Assistant
            </span>
          </>
        )}

        {/* Unread indicator */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-bounce">
            {unreadCount}
          </span>
        )}
      </div>
    </button>
  );
};

export default SmartAssistantButton;
