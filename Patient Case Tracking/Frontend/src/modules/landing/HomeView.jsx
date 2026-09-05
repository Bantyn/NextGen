import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  FileText,
  Activity,
  Leaf,
  Sparkles,
  QrCode,
  CheckCircle2,
  Clock,
  HeartPulse,
  AlertTriangle,
  Lock,
  Layers,
} from "lucide-react";
import { VoiceRecorder } from "../../components/VoiceRecorder";

/**
 * HomeView Component — Sehat Platform Overview & Interactive Launchpad
 * Comprehensive showcase of Module A, B, C, D and the 5-Step Patient/Physician Journey.
 */
export const HomeView = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-5xl px-4 sm:px-6 pt-8 sm:pt-14 pb-16 flex flex-col items-center text-center mx-auto space-y-16">
      {/* 1. HERO SECTION */}
      <section className="w-full flex flex-col items-center text-center">
        {/* Compliance Badges */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-normal bg-sky-50 text-sky-800 border border-sky-200/80 mb-4 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>
            ABDM FHIR Compliant • DPDP Act 2023 • Multilingual Voice AI
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-normal text-slate-950 tracking-tight leading-[1.08] max-w-3xl my-2">
          Autonomous Clinical History Intake for Next-Gen OPDs
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg font-normal text-slate-500 max-w-2xl mx-auto leading-relaxed mt-3 mb-8">
          <strong>Sehat</strong> empowers patients to record comprehensive
          medical histories via natural voice conversation, scan past
          prescriptions, and generate structured, physician-ready summaries
          linked to their <strong>ABHA record</strong> before entering the
          consultation room.
        </p>

        {/* Hero CTAs */}
        <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
          <button
            onClick={() => navigate("/patient/register")}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-normal text-white bg-slate-950 hover:bg-slate-800 active:scale-95 transition cursor-pointer shadow-sm"
          >
            <span>Start Patient Check-In</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate("/doctor")}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-normal text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition cursor-pointer shadow-2xs"
          >
            <Stethoscope className="w-4 h-4 text-slate-600" />
            <span>Doctor OPD Consultation Portal</span>
          </button>
        </div>

        {/* Platform Stat Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl pt-4 border-t border-slate-200/70 text-left">
          <div className="p-3 rounded-2xl bg-white/70 border border-slate-200/80">
            <div className="text-xl sm:text-2xl font-normal text-slate-950">
              7+
            </div>
            <div className="text-[11px] text-slate-500 font-normal mt-0.5">
              Indian Languages (ASR + TTS)
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white/70 border border-slate-200/80">
            <div className="text-xl sm:text-2xl font-normal text-emerald-700">
              &lt; 3 mins
            </div>
            <div className="text-[11px] text-slate-500 font-normal mt-0.5">
              Complete Intake Time
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white/70 border border-slate-200/80">
            <div className="text-xl sm:text-2xl font-normal text-slate-950">
              10-Fold
            </div>
            <div className="text-[11px] text-slate-500 font-normal mt-0.5">
              AYUSH Dashavidha Pariksha
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white/70 border border-slate-200/80">
            <div className="text-xl sm:text-2xl font-normal text-sky-700">
              100%
            </div>
            <div className="text-[11px] text-slate-500 font-normal mt-0.5">
              Physician-Verified Sign-Off
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 4 INTEGRATED SOFTWARE MODULES */}
      <section className="w-full text-left space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Core Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-normal text-slate-950 tracking-tight mt-1">
            4 Integrated AI Modules
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1.5">
            Designed for high-throughput public kiosks and private hospital OPD
            networks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Module A */}
          <div className="p-6 rounded-[28px] bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-normal text-slate-950">
                Module A — Multimodal History Engine
              </h3>
              <span className="text-[10px] bg-sky-50 text-sky-800 px-2.5 py-0.5 rounded-full font-medium">
                Voice + Touch
              </span>
            </div>
            <p className="text-xs text-slate-600 font-normal leading-relaxed">
              Adaptive dialogue manager constrained by the{" "}
              <strong>SOCRATES framework</strong> for acute symptoms. Includes
              dual-mode touch answering, priority{" "}
              <strong>Red-Flag triage detection</strong>, and{" "}
              <strong>AYUSH Dashavidha Pariksha</strong>.
            </p>
            <div className="pt-2 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                SOCRATES Tree
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                Red-Flag Alerts
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                Neural TTS
              </span>
            </div>
          </div>

          {/* Module B */}
          <div className="p-6 rounded-[28px] bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-normal text-slate-950">
                Module B — Document Digitization & AI
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full font-medium">
                Multilingual OCR
              </span>
            </div>
            <p className="text-xs text-slate-600 font-normal leading-relaxed">
              High-accuracy camera/PDF scanning of prior prescriptions and lab
              reports. Automatically extracts prescribed dosages, constructs a
              chronological medical timeline, and{" "}
              <strong>highlights abnormal lab values</strong>.
            </p>
            <div className="pt-2 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                Dosage Extraction
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                Abnormal Lab Flags
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                Medical Timeline
              </span>
            </div>
          </div>

          {/* Module C */}
          <div className="p-6 rounded-[28px] bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-normal text-slate-950">
                Module C — Structured Summary Generator
              </h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded-full font-medium">
                Physician EMR
              </span>
            </div>
            <p className="text-xs text-slate-600 font-normal leading-relaxed">
              Synthesizes conversational audio and digitized documents into a
              single standard clinical draft (CC ➔ HPI ➔ Past ➔ Drug ➔ ROS).
              Presented on the doctor's screen for rapid verification and
              editing.
            </p>
            <div className="pt-2 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                Standard Format
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                Editable Draft
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                Bilingual Output
              </span>
            </div>
          </div>

          {/* Module D */}
          <div className="p-6 rounded-[28px] bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-normal text-slate-950">
                Module D — Consent, Privacy & ABDM
              </h3>
              <span className="text-[10px] bg-rose-50 text-rose-800 px-2.5 py-0.5 rounded-full font-medium">
                DPDP Act 2023
              </span>
            </div>
            <p className="text-xs text-slate-600 font-normal leading-relaxed">
              Granular, revocable consent with local-language audio explanations
              for low-literacy patients. ABHA ID authentication and automatic
              FHIR Bundle linking to the hospital HIS/EMR.
            </p>
            <div className="pt-2 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                ABHA ID Sync
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                Audio Consent
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                Immediate Session Purge
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 5-STEP END-TO-END PATIENT & DOCTOR JOURNEY */}
      <section className="w-full text-left space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Clinical Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-normal text-slate-950 tracking-tight mt-1">
            End-to-End 5-Step Journey
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1.5">
            From kiosk arrival to physician sign-off in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-medium">
              1
            </div>
            <div className="font-medium text-xs text-slate-950">
              Identify & Consent
            </div>
            <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
              Patient enters/scans ABHA ID, selects language, and gives
              audio-guided DPDP consent.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-medium">
              2
            </div>
            <div className="font-medium text-xs text-slate-950">
              Converse & Intake
            </div>
            <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
              AI conducts adaptive voice + touch SOCRATES interview; red flags
              trigger emergency triage.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-medium">
              3
            </div>
            <div className="font-medium text-xs text-slate-950">
              Scan & Digitize
            </div>
            <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
              Upload prior prescriptions and reports; OCR digitizes medications
              and abnormal lab ranges.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-medium">
              4
            </div>
            <div className="font-medium text-xs text-slate-950">
              Summarize & Route
            </div>
            <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
              FHIR history summary generated, linked to ABHA, and pushed live to
              doctor's OPD screen.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-medium">
              5
            </div>
            <div className="font-medium text-xs text-slate-950">
              Consult & Sign-Off
            </div>
            <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
              Physician reviews complete history in seconds, edits/confirms, and
              prescribes treatment.
            </p>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE LIVE VOICE INTAKE DEMO */}
      <section
        id="voice-intake"
        className="hidden w-full text-center space-y-4 pt-4 border-t border-slate-200/80"
      >
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Interactive Test Bench
          </span>
          <h2 className="text-2xl sm:text-3xl font-normal text-slate-950 tracking-tight mt-1">
            Experience Multilingual Voice Intake
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 max-w-md mx-auto">
            Test the live 3D holographic sound visualizer, natural clinical
            reasoning, and neural text-to-speech.
          </p>
        </div>

        <VoiceRecorder
          sessionId="DEMO_GUJARATI_SPEECH_001"
          defaultLanguage="gu-IN"
          onMessageSent={(res) => console.log("Voice intake processed:", res)}
        />
      </section>
    </div>
  );
};

export default HomeView;
