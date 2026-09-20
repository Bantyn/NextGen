import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Stethoscope,
  Building2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import StackingCards, {
  StackingCardItem,
} from "@/components/ui/stacking-cards";

import heroDoctorImg from "@/assets/hero/hero-doctor.png";
import heroAbhaImg from "@/assets/hero/hero-abha.png";
import heroVoiceImg from "@/assets/hero/hero-voice.png";
import heroShowcaseImg from "@/assets/hero/hero-showcase.png";

const CARDS = [
  {
    id: "patients",
    step: "01",
    role: "Patients & Citizens",
    tagline: "Voice-First Vernacular Access & Lifelong Health ID",
    description:
      "Empowers walk-in patients of all literacy levels. Speak naturally in 7+ Indian languages with audio-guided DPDP consent, dual voice/touch kiosk interactions, and permanent digital ABHA records.",
    bgColor: "bg-white/80 backdrop-blur-xl border-sky-200/90 shadow-xl shadow-sky-950/5",
    gradientOverlay: "bg-gradient-to-br from-white/90 via-sky-50/70 to-sky-100/50",
    badgeColor: "bg-sky-50/90 text-sky-800 border-sky-200/90",
    iconBg: "bg-sky-50 text-sky-700 border-sky-200/80",
    accentText: "text-sky-700",
    icon: Users,
    image: heroVoiceImg,
    imgAlt: "Patient using Multilingual Voice AI Intake",
    imgBadge: "Multilingual Voice AI • 7+ Languages",
    ctaText: "Start Patient Check-In",
    ctaRoute: "/patient/register",
    points: [
      "Natural voice conversation in 7+ Indian languages",
      "Audio-guided DPDP consent for non-literate patients",
      "Instant ABHA profile sync — no lost paper files",
      "Dual touch and speech mode on hospital kiosks",
    ],
  },
  {
    id: "doctors",
    step: "02",
    role: "OPD Doctors & Specialists",
    tagline: "Zero Note-Taking Fatigue & 1-Click Verification",
    description:
      "Physicians receive pre-structured clinical summaries (CC, HPI, Past Rx, Allergies, Review of Systems) before the patient enters. Features automated red-flag triage alerts and abnormal lab highlights via OCR.",
    bgColor: "bg-white/80 backdrop-blur-xl border-emerald-200/90 shadow-xl shadow-emerald-950/5",
    gradientOverlay: "bg-gradient-to-br from-white/90 via-emerald-50/70 to-emerald-100/50",
    badgeColor: "bg-emerald-50/90 text-emerald-800 border-emerald-200/90",
    iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    accentText: "text-emerald-700",
    icon: Stethoscope,
    image: heroDoctorImg,
    imgAlt: "Doctor reviewing structured patient history in OPD",
    imgBadge: "SOCRATES Intake Draft • 1-Click Sign-Off",
    ctaText: "Open Doctor Portal",
    ctaRoute: "/doctor",
    points: [
      "Pre-structured clinical draft in standard CC ➔ HPI format",
      "Instant red-flag symptom emergency triage alerts",
      "Vision OCR timeline highlighting abnormal lab ranges",
      "Dual Allopathic and AYUSH Dashavidha Pariksha support",
    ],
  },
  {
    id: "hospitals",
    step: "03",
    role: "Hospitals & OPD Clinics",
    tagline: "Sub-3-Minute Intake & Real-Time Queue Synchronization",
    description:
      "Built for high-volume government medical colleges and private hospital networks to end overcrowded lobbies. Automatically pushes structured patient intakes directly into active consulting room queues.",
    bgColor: "bg-white/80 backdrop-blur-xl border-indigo-200/90 shadow-xl shadow-indigo-950/5",
    gradientOverlay: "bg-gradient-to-br from-white/90 via-indigo-50/70 to-indigo-100/50",
    badgeColor: "bg-indigo-50/90 text-indigo-800 border-indigo-200/90",
    iconBg: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    accentText: "text-indigo-700",
    icon: Building2,
    image: heroShowcaseImg,
    imgAlt: "Hospital OPD queue and clinical dashboard showcase",
    imgBadge: "Live Queue Routing • Sub-3 Min Intake",
    ctaText: "View Hospital Queue",
    ctaRoute: "/doctor/live-opd",
    points: [
      "Sub-3 minute total intake clears lobby bottlenecks",
      "Direct push of FHIR bundles into doctor consultation queues",
      "Strict Role-Based Access Control (RBAC) for hospital staff",
      "Emergency red-flag escalation to nursing & triage stations",
    ],
  },
  {
    id: "abdm",
    step: "04",
    role: "ABDM & Public Health Ecosystem",
    tagline: "100% ABDM FHIR Standards & DPDP Act 2023 Sovereignty",
    description:
      "Fully integrated with the Ayushman Bharat Digital Mission (ABDM). Generates standardized FHIR health bundles that travel with the patient across primary, secondary, and tertiary care with automatic session purging.",
    bgColor: "bg-white/80 backdrop-blur-xl border-rose-200/90 shadow-xl shadow-rose-950/5",
    gradientOverlay: "bg-gradient-to-br from-white/90 via-rose-50/70 to-rose-100/50",
    badgeColor: "bg-rose-50/90 text-rose-800 border-rose-200/90",
    iconBg: "bg-rose-50 text-rose-700 border-rose-200/80",
    accentText: "text-rose-700",
    icon: ShieldCheck,
    image: heroAbhaImg,
    imgAlt: "ABHA Health ID digital card linking",
    imgBadge: "ABDM FHIR Bundle • DPDP Act 2023",
    ctaText: "Explore Health ID Portal",
    ctaRoute: "/patient/dashboard",
    points: [
      "100% ABDM FHIR bundle compliance for longitudinal EHR",
      "DPDP Act 2023 data sovereignty with immediate session purge",
      "Interoperable exchange across PHCs, CHCs, and hospitals",
      "Standardized data pipeline for public health surveillance",
    ],
  },
];

export const WhoCanUseSehat = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full relative py-6 sm:py-10 space-y-10">
      {/* Section Header */}
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200/80 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
          <span>Platform Stakeholders</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal text-slate-950 tracking-tight">
          Who Can Use Sehat?
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-500 font-normal leading-relaxed">
          Engineered for every tier of Indian healthcare — scroll through to explore how each stakeholder benefits.
        </p>
      </div>

      {/* Stacking Cards — No Outside Box, Translucent Frosted Glass Cards */}
      <StackingCards
        totalCards={CARDS.length}
        scaleMultiplier={0.035}
        className="w-full relative space-y-6 sm:space-y-8"
      >
        {CARDS.map(
          (
            {
              id,
              step,
              role,
              tagline,
              description,
              bgColor,
              gradientOverlay,
              badgeColor,
              iconBg,
              accentText,
              icon: Icon,
              image,
              imgAlt,
              imgBadge,
              ctaText,
              ctaRoute,
              points,
            },
            index
          ) => {
            return (
              <StackingCardItem
                key={id}
                index={index}
                className="w-full pb-8 sm:pb-12"
                topPosition={`calc(5rem + ${index * 1.5}rem)`}
              >
                <div
                  className={cn(
                    bgColor,
                    "relative flex flex-col md:flex-row px-6 sm:px-10 py-7 sm:py-9 w-full rounded-[28px] mx-auto border gap-6 md:gap-8 items-center justify-between overflow-hidden text-left"
                  )}
                >
                  {/* Subtle Translucent Gradient Wash for Frosted Glass Depth */}
                  <div
                    className={cn(
                      "absolute inset-0 pointer-events-none opacity-90",
                      gradientOverlay
                    )}
                  />

                  {/* Left Column: Role Details & Actions */}
                  <div className="relative z-10 flex-1 flex flex-col justify-between h-full">
                    <div>
                      {/* Top Badge */}
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-2xs backdrop-blur-md",
                            badgeColor
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>
                            {step} • {role}
                          </span>
                        </span>
                      </div>

                      {/* Title & Tagline */}
                      <h3 className="font-normal text-2xl sm:text-3xl text-slate-950 tracking-tight mb-1">
                        {role}
                      </h3>
                      <p className={cn("text-xs sm:text-sm font-medium mb-3", accentText)}>
                        {tagline}
                      </p>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mb-4">
                        {description}
                      </p>

                      {/* Key Capabilities */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                        {points.map((pt, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-700 font-normal"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="pt-1 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(ctaRoute)}
                        className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-950 text-white font-medium text-xs sm:text-sm hover:bg-slate-800 transition shadow-sm cursor-pointer active:scale-95"
                      >
                        <span>{ctaText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Image Preview with Floating Glass Badge */}
                  <div className="relative z-10 w-full md:w-5/12 h-[200px] sm:h-[240px] md:h-[260px] rounded-2xl overflow-hidden shadow-xs border border-slate-200/90 bg-slate-50 shrink-0 group">
                    <img
                      src={image}
                      alt={imgAlt}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    {/* Bottom Floating Glass Badge */}
                    <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/60 shadow-xs flex items-center gap-2">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-lg border flex items-center justify-center shrink-0",
                          iconBg
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-slate-900 truncate">
                          {imgBadge}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          Verified Sehat Flow
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </StackingCardItem>
            );
          }
        )}
      </StackingCards>
    </section>
  );
};

export default WhoCanUseSehat;
