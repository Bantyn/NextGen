import React from "react";
import { useNavigate } from "react-router-dom";
import {
  MoveRight,
  Stethoscope,
  ShieldCheck,
  Mic,
  Sparkles,
  QrCode,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

import heroDoctorImg from "@/assets/hero/hero-doctor.png";
import heroAbhaImg from "@/assets/hero/hero-abha.png";
import heroVoiceImg from "@/assets/hero/hero-voice.png";

function Hero({ onStartCheckIn, onDoctorPortal }) {
  const navigate = useNavigate();

  const handleStartCheckIn = () => {
    if (onStartCheckIn) {
      onStartCheckIn();
    } else {
      navigate("/patient/register");
    }
  };

  const handleDoctorPortal = () => {
    if (onDoctorPortal) {
      onDoctorPortal();
    } else {
      navigate("/doctor");
    }
  };

  return (
    <div className="w-full py-6 sm:py-10 lg:py-14">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 gap-10 lg:gap-12 items-center lg:grid-cols-2">
          {/* Left Column: Clinical Copy & Dual Action CTAs */}
          <div className="flex gap-5 flex-col text-left items-start">
            <div>
              <Badge
                variant="outline"
                className="gap-2 px-3.5 py-1.5 text-xs font-normal border-sky-200/90 bg-sky-50/90 text-sky-800 shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>ABDM FHIR Compliant • DPDP Act 2023 • Multilingual Voice AI</span>
              </Badge>
            </div>

            <div className="flex gap-4 flex-col">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-slate-900 leading-[1.12]">
                Autonomous Clinical History Intake for{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-700 via-indigo-700 to-sky-800 font-bold">
                  Next-Gen OPDs
                </span>
              </h1>

              <p className="text-base sm:text-lg leading-relaxed text-slate-600 max-w-xl text-left font-normal">
                <strong>Sehat</strong> empowers patients to record comprehensive
                medical histories via natural voice conversation, scan past
                prescriptions, and generate structured, physician-ready summaries
                linked to their <strong>ABHA record</strong> before entering the
                consultation room.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto pt-2">
              <Button
                size="lg"
                onClick={handleStartCheckIn}
                className="gap-3 rounded-full bg-slate-950 text-white hover:bg-slate-800 cursor-pointer shadow-sm active:scale-95 transition"
              >
                <span>Start Patient Check-In</span>
                <MoveRight className="w-4 h-4" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleDoctorPortal}
                className="gap-3 rounded-full border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shadow-2xs active:scale-95 transition"
              >
                <Stethoscope className="w-4 h-4 text-slate-600" />
                <span>Doctor OPD Portal</span>
              </Button>
            </div>

            {/* Subtle Key Highlights Badges */}
            <div className="pt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <div className="inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-3 py-1 rounded-full border border-slate-200/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>7+ Indian Languages</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-3 py-1 rounded-full border border-slate-200/60">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>&lt; 3 mins Intake Time</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-slate-100/90 text-slate-700 px-3 py-1 rounded-full border border-slate-200/60">
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>Instant ABHA Link</span>
              </div>
            </div>
          </div>

          {/* Right Column: Group of 3 Patient/Doctor Clinical Images */}
          <div className="grid grid-cols-2 gap-4 sm:gap-5 w-full">
            {/* 1. Doctor Consultation (Top Left, Aspect Square) */}
            <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-slate-50 shadow-sm aspect-square">
              <img
                src={heroDoctorImg}
                alt="Doctor consultation in OPD"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-2.5 left-2.5 right-2.5 p-2 rounded-xl bg-white/90 backdrop-blur-md border border-white/50 shadow-xs flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-900 truncate">
                    OPD Consultation
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    Physician Verified
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Voice AI Assistant Intake (Right Column, Tall Row Span 2) */}
            <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-slate-50 shadow-sm row-span-2 min-h-[320px] sm:min-h-[420px]">
              <img
                src={heroVoiceImg}
                alt="Multilingual Voice AI Intake"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/15 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Floating Voice Active Pill */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-white/60 shadow-xs flex items-center gap-1.5 text-[11px] font-medium text-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Voice Active</span>
              </div>

              {/* Bottom Card Label */}
              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-white/60 shadow-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    Multilingual Voice AI
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Natural conversational intake
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ABHA Health ID (Bottom Left, Aspect Square) */}
            <div className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-slate-50 shadow-sm aspect-square">
              <img
                src={heroAbhaImg}
                alt="ABHA Health ID Digital Card"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-2.5 left-2.5 right-2.5 p-2 rounded-xl bg-white/90 backdrop-blur-md border border-white/50 shadow-xs flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <QrCode className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-900 truncate">
                    ABHA Health ID
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    Instant FHIR Sync
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
export default Hero;
