import React, { useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  X,
  RotateCcw,
  Globe,
  ShieldCheck,
  Stethoscope,
  Pill,
  HelpCircle,
  Phone,
  ArrowRight,
} from 'lucide-react';
import { SmartAssistantMessage } from './SmartAssistantMessage';
import { SmartAssistantQuickActions } from './SmartAssistantQuickActions';
import { SmartAssistantInput } from './SmartAssistantInput';
import { SmartAssistantTyping } from './SmartAssistantTyping';

/**
 * SmartAssistantPanel Component
 * Visually calibrated with HomeView.jsx's Glassmorphism & High-End Clinical Editorial Design System.
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

  // Auto-scroll to bottom on new message or loading state change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  return (
    <div
      id="smart-assistant-panel"
      className="fixed bottom-24 right-4 sm:right-6 z-50 w-[94vw] sm:w-[440px] max-h-[82vh] h-[640px] flex flex-col rounded-[32px] bg-slate-50/95 border border-slate-200/90 shadow-2xl backdrop-blur-2xl overflow-hidden transition-all duration-300 animate-slide-up"
    >
      {/* 1. HEADER (HomeView Navbar / Hero Badge Style) */}
      <div className="px-5 py-4 bg-white/95 border-b border-slate-200/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Module Icon Box matching HomeView Module Icons */}
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200/90 flex items-center justify-center shrink-0 shadow-2xs">
            <Bot className="w-5 h-5 text-sky-600" />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-normal text-slate-950 tracking-tight">Smart AI Assistant</h3>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-normal mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Verified MongoDB Knowledge</span>
            </div>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1.5">
          {/* Multilingual Selector matching HomeView Pill Badges */}
          <div className="relative flex items-center">
            <Globe className="w-3 h-3 text-slate-500 absolute left-2.5 pointer-events-none" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="pl-7 pr-2.5 py-1.5 text-xs font-normal text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full focus:outline-none cursor-pointer transition shadow-2xs"
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
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Close Panel */}
          <button
            type="button"
            onClick={onClose}
            title="Close Panel"
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MESSAGES SCROLL AREA */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-200"
      >
        {/* Welcome Hero Card (Styled like HomeView 4-Modules Card) */}
        {messages.length <= 1 && (
          <div className="p-4 sm:p-5 rounded-[24px] bg-white border border-slate-200/90 shadow-2xs space-y-3.5 text-left animate-fade-in">
            {/* Compliance Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-normal bg-sky-50 text-sky-800 border border-sky-200/80">
              <ShieldCheck className="w-3 h-3 text-sky-600" />
              <span>ABDM FHIR Compliant • DPDP Act 2023</span>
            </div>

            <h4 className="text-sm font-normal text-slate-950 tracking-tight leading-snug">
              Instant Help, Verified Medicine Information & OPD Navigation
            </h4>

            <p className="text-xs text-slate-500 font-normal leading-relaxed">
              Ask any question regarding our <strong>Kiosk Intake</strong>, verified <strong>medicine safety</strong>, allowed nominal cold/headache home care, or hospital emergency helpline.
            </p>

            {/* Feature Tags matching HomeView */}
            <div className="pt-1 flex items-center gap-1.5 flex-wrap text-[10px] text-slate-600 font-normal">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">Medicine Helper</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">Nominal Symptoms</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">ABHA Link Guide</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">Emergency Triage</span>
            </div>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((msg, index) => (
          <SmartAssistantMessage key={index} message={msg} />
        ))}

        {/* Loading Indicator */}
        {isLoading && <SmartAssistantTyping />}
      </div>

      {/* 3. QUICK ACTION CHIPS (HomeView Pill Buttons Style) */}
      <div className="px-4 py-2 bg-slate-50/90 border-t border-slate-100">
        <SmartAssistantQuickActions onSelectAction={onSendMessage} disabled={isLoading} />
      </div>

      {/* 4. INPUT AREA */}
      <SmartAssistantInput onSendMessage={onSendMessage} disabled={isLoading} language={language} />
    </div>
  );
};

export default SmartAssistantPanel;
