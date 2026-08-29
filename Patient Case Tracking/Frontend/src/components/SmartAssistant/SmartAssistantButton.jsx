import React from 'react';
import { Bot, Sparkles, X, ShieldCheck } from 'lucide-react';

/**
 * SmartAssistantButton Component
 * Styled in sync with HomeView.jsx's floating pill badge design language.
 */
export const SmartAssistantButton = ({ isOpen, onClick, unreadCount = 0 }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center">
      <button
        id="smart-assistant-trigger"
        type="button"
        onClick={onClick}
        aria-label={isOpen ? 'Close Smart AI Assistant' : 'Open Smart AI Assistant'}
        className={`group relative inline-flex items-center gap-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full text-xs font-normal transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl active:scale-95 ${
          isOpen
            ? 'bg-slate-950 text-white border border-slate-800 shadow-slate-950/20'
            : 'bg-slate-950/95 hover:bg-slate-900 text-white border border-slate-800/90 hover:border-slate-700 backdrop-blur-xl shadow-slate-950/25 hover:-translate-y-0.5'
        }`}
      >
        {isOpen ? (
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-slate-300 group-hover:text-white transition-transform group-hover:rotate-90" />
            <span className="text-xs font-normal text-slate-200">Close Assistant</span>
          </div>
        ) : (
          <>
            {/* Ambient Pulsing Icon */}
            <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-400">
              <Bot className="w-3.5 h-3.5 text-sky-300 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950 animate-pulse" />
            </div>

            <div className="flex flex-col text-left leading-tight">
              <div className="flex items-center gap-1">
                <span className="text-xs font-normal text-white tracking-tight">Smart AI Assistant</span>
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              </div>
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline-block">
                Medicine • OPD • Support
              </span>
            </div>

            {/* Unread Badge */}
            {unreadCount > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-bounce">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
};

export default SmartAssistantButton;
