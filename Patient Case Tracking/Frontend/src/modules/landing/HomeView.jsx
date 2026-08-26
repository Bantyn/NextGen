import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Stethoscope, ArrowRight } from 'lucide-react';
import { VoiceRecorder } from '../../components/VoiceRecorder';

/**
 * HomeView Component
 * Landing page hero overview with Untitled UI / Lucide vector icons (no emojis).
 */
export const HomeView = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full max-w-4xl px-4 sm:px-6 pt-10 sm:pt-16 pb-12 flex flex-col items-center text-center">
      {/* Subtitle */}
      <p className="text-base sm:text-lg font-normal text-slate-700 tracking-normal mb-1">
        Improve your
      </p>

      {/* Main Headline */}
      <h1 className="text-6xl sm:text-7xl md:text-8xl font-normal text-slate-950 tracking-tight leading-none my-1 select-none">
        Productivity
      </h1>

      {/* Sub-headline */}
      <h2 className="text-4xl sm:text-5xl md:text-6xl font-normal text-slate-900 tracking-tight mt-1 mb-5 select-none">
        with AI
      </h2>

      {/* Paragraph */}
      <p className="text-sm sm:text-base font-normal text-slate-500 max-w-md mx-auto leading-relaxed mb-7">
        Tailored digital solutions for highly specialized industries that help boost your operations
      </p>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
        <button
          onClick={() => navigate('/patient/register')}
          className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full text-sm font-normal text-white bg-slate-950 hover:bg-slate-800 active:scale-95 transition cursor-pointer shadow-sm"
        >
          <span>Start Patient Check-In</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigate('/doctor')}
          className="px-6 py-2.5 rounded-full text-sm font-normal text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition cursor-pointer shadow-2xs"
        >
          Doctor OPD Portal
        </button>
      </div>

      {/* Quick Launch Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 text-left">
        <div
          onClick={() => navigate('/patient/register')}
          className="p-6 rounded-[24px] bg-white/80 backdrop-blur-md border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer shadow-xs hover:shadow-sm"
        >
          <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-700 border border-sky-200/60 flex items-center justify-center text-sm mb-3">
            <Mic className="w-4 h-4" />
          </div>
          <h3 className="text-base font-normal text-slate-900 mb-1">
            Patient Multilingual Kiosk
          </h3>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            Autonomous voice & touch intake in Gujarati, Hindi & English with OCR document upload.
          </p>
        </div>

        <div
          onClick={() => navigate('/doctor')}
          className="p-6 rounded-[24px] bg-white/80 backdrop-blur-md border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer shadow-xs hover:shadow-sm"
        >
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center text-sm mb-3">
            <Stethoscope className="w-4 h-4" />
          </div>
          <h3 className="text-base font-normal text-slate-900 mb-1">
            Doctor Clinical Review Queue
          </h3>
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            Live OPD queue, priority red-flag triage alerts, structured summary verification & sign-off.
          </p>
        </div>
      </div>

      {/* Live Voice Visualizer Preview */}
      <div id="voice-intake" className="w-full">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">
          Interactive Live Voice Intake Engine
        </div>
        <VoiceRecorder
          sessionId="DEMO_GUJARATI_SPEECH_001"
          defaultLanguage="gu-IN"
          onMessageSent={(res) => console.log('Voice intake processed:', res)}
        />
      </div>
    </section>
  );
};

export default HomeView;
