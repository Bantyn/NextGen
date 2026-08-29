import React, { useEffect, useRef } from 'react';
import { Bot, Sparkles, X, RotateCcw, Globe, Shield, ExternalLink } from 'lucide-react';
import { SmartAssistantMessage } from './SmartAssistantMessage';
import { SmartAssistantQuickActions } from './SmartAssistantQuickActions';
import { SmartAssistantInput } from './SmartAssistantInput';
import { SmartAssistantTyping } from './SmartAssistantTyping';

/**
 * SmartAssistantPanel Component
 * Glassmorphism modal panel matching Apple/Linear design system.
 */
export const SmartAssistantPanel = ({
  isOpen,
  onClose,
  messages,
  isLoading,
  onSendMessage,
  onClearChat,
  language,
  onLanguageChange,
}) => {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  return (
    <div
      id="smart-assistant-panel"
      className="fixed bottom-24 right-4 sm:right-6 z-50 w-[94vw] sm:w-[420px] max-h-[82vh] h-[600px] flex flex-col rounded-3xl bg-slate-50/95 border border-slate-200/90 shadow-2xl backdrop-blur-2xl overflow-hidden transition-all duration-300 animate-slide-up"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-white/90 border-b border-slate-200/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 to-sky-800 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-4 h-4 text-sky-300" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-semibold text-slate-950">MediKiosk Smart Assistant</h3>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <p className="text-[10px] text-emerald-700 font-medium">Verified Knowledge • Context Safe</p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1.5">
          {/* Language Selector */}
          <div className="relative flex items-center">
            <Globe className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="pl-6 pr-2 py-1 text-[11px] font-normal text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-lg focus:outline-none cursor-pointer transition-colors"
            >
              <option value="English">EN</option>
              <option value="Hindi">हिंदी</option>
              <option value="Gujarati">ગુજરાતી</option>
            </select>
          </div>

          {/* Reset Chat */}
          <button
            type="button"
            onClick={onClearChat}
            title="Clear Chat History"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Close Panel */}
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-200"
      >
        {/* Welcome Intro Card */}
        {messages.length <= 1 && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-sky-50/70 to-white border border-sky-100/90 text-xs space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-sky-900 font-medium">
              <Shield className="w-4 h-4 text-sky-600" />
              <span>How can I help you today?</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
              I can provide verified medicine details, guide you through Kiosk check-in, explain nominal cold/headache home care, or give emergency hospital contacts.
            </p>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((msg, index) => (
          <SmartAssistantMessage key={index} message={msg} />
        ))}

        {/* Loading Indicator */}
        {isLoading && <SmartAssistantTyping />}
      </div>

      {/* Quick Action Chips */}
      <div className="px-3 bg-slate-50/90 border-t border-slate-100">
        <SmartAssistantQuickActions onSelectAction={onSendMessage} disabled={isLoading} />
      </div>

      {/* Input Area */}
      <SmartAssistantInput onSendMessage={onSendMessage} disabled={isLoading} language={language} />
    </div>
  );
};

export default SmartAssistantPanel;
