import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Fingerprint,
  MessageSquareHeart,
  FileScan,
  Send,
  Stethoscope,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. LIGHT THEME CINEMATIC STYLING & ANIMATIONS
// -------------------------------------------------------------------------
const STYLES = `
.cinematic-journey-wrapper {
  position: relative;
  overflow: hidden;
  width: 100%;
}

.cinematic-light-aurora-1 {
  position: absolute;
  top: -10%;
  left: 10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.03) 50%, transparent 70%);
  filter: blur(50px);
  pointer-events: none;
  animation: aurora-float 14s ease-in-out infinite alternate;
}

.cinematic-light-aurora-2 {
  position: absolute;
  bottom: -10%;
  right: 10%;
  width: 550px;
  height: 550px;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.12) 0%, rgba(168, 85, 247, 0.02) 50%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
  animation: aurora-float-rev 16s ease-in-out infinite alternate;
}

@keyframes aurora-float {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(50px, 30px) scale(1.1); }
  100% { transform: translate(-30px, 60px) scale(0.95); }
}

@keyframes aurora-float-rev {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-50px, -40px) scale(1.08); }
  100% { transform: translate(40px, -20px) scale(0.96); }
}

.cinematic-light-marquee {
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  letter-spacing: -0.04em;
  color: rgba(15, 23, 42, 0.03);
  text-transform: uppercase;
  font-weight: 900;
  user-select: none;
  pointer-events: none;
  white-space: nowrap;
}

.journey-light-card {
  position: relative;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(226, 232, 240, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 1.25rem;
  box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02);
  transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.journey-light-card:hover {
  border-color: rgba(14, 165, 233, 0.45);
  box-shadow: 0 14px 30px -8px rgba(14, 165, 233, 0.15), 0 4px 10px -2px rgba(15, 23, 42, 0.03);
}

.journey-light-glow {
  position: absolute;
  inset: 0;
  border-radius: 1.25rem;
  background: radial-gradient(350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(14, 165, 233, 0.08), transparent 50%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.journey-light-card:hover .journey-light-glow {
  opacity: 1;
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC WRAPPER COMPONENT
// -------------------------------------------------------------------------
const MagneticItem = ({ children, className = "", strength = 14 }) => {
  const itemRef = useRef(null);

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      const pullX = (distanceX / (rect.width / 2)) * strength;
      const pullY = (distanceY / (rect.height / 2)) * strength;

      xTo(pullX);
      yTo(pullY);
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [strength]);

  return (
    <div ref={itemRef} className={className}>
      {children}
    </div>
  );
};

// -------------------------------------------------------------------------
// 3. STEP CARD DATA (LIGHT SHADES)
// -------------------------------------------------------------------------
const STEPS = [
  {
    step: "01",
    title: "Identify & Consent",
    subtitle: "ABHA & DPDP Compliant",
    description:
      "Patient enters/scans ABHA ID, selects preferred language, and gives audio-guided DPDP consent.",
    icon: Fingerprint,
    badge: "Voice & Touch",
    tagColor: "bg-sky-50 text-sky-700 border-sky-200/80",
    iconBg: "bg-sky-50 text-sky-600 border-sky-200/70 group-hover:bg-sky-100/80 group-hover:border-sky-300",
  },
  {
    step: "02",
    title: "Converse & Intake",
    subtitle: "SOCRATES Dynamic AI",
    description:
      "AI conducts adaptive voice + touch clinical interview; immediate red-flag detection triggers emergency triage.",
    icon: MessageSquareHeart,
    badge: "Adaptive AI",
    tagColor: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200/70 group-hover:bg-indigo-100/80 group-hover:border-indigo-300",
  },
  {
    step: "03",
    title: "Scan & Digitize",
    subtitle: "Rx & Report Vision OCR",
    description:
      "Upload prior prescriptions and reports; OCR engine digitizes active medications and abnormal lab ranges.",
    icon: FileScan,
    badge: "Vision OCR",
    tagColor: "bg-purple-50 text-purple-700 border-purple-200/80",
    iconBg: "bg-purple-50 text-purple-600 border-purple-200/70 group-hover:bg-purple-100/80 group-hover:border-purple-300",
  },
  {
    step: "04",
    title: "Summarize & Route",
    subtitle: "ABDM FHIR Structured",
    description:
      "FHIR history summary generated, linked to ABHA profile, and pushed live to physician's OPD consultation queue.",
    icon: Send,
    badge: "Live Sync",
    tagColor: "bg-rose-50 text-rose-700 border-rose-200/80",
    iconBg: "bg-rose-50 text-rose-600 border-rose-200/70 group-hover:bg-rose-100/80 group-hover:border-rose-300",
  },
  {
    step: "05",
    title: "Consult & Sign-Off",
    subtitle: "Rapid Physician Care",
    description:
      "Doctor reviews structured chronological history in seconds, edits/confirms findings, and finalizes treatment.",
    icon: Stethoscope,
    badge: "Physician Sign-Off",
    tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200/70 group-hover:bg-emerald-100/80 group-hover:border-emerald-300",
  },
];

// -------------------------------------------------------------------------
// 4. MAIN CINEMATIC JOURNEY COMPONENT (LIGHT & OPEN)
// -------------------------------------------------------------------------
export const CinematicJourney = () => {
  const containerRef = useRef(null);
  const marqueeRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Staggered ScrollTrigger Entry Animation for cards
      gsap.fromTo(
        cardsRef.current,
        {
          opacity: 0,
          y: 35,
          scale: 0.96,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.75,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // 2. Parallax drift for Giant Background Watermark Text
      if (marqueeRef.current) {
        gsap.to(marqueeRef.current, {
          xPercent: -12,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Card Mouse Move Glow Effect
  const handleCardMouseMove = (e, idx) => {
    const card = cardsRef.current[idx];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <section ref={containerRef} className="cinematic-journey-wrapper w-full relative py-6">
      <style>{STYLES}</style>

      {/* Subtle Ambient Light Auroras */}
      <div className="cinematic-light-aurora-1" />
      <div className="cinematic-light-aurora-2" />

      {/* Giant Watermark Typography */}
      <div
        ref={marqueeRef}
        className="cinematic-light-marquee absolute top-1/2 left-0 -translate-y-1/2 text-8xl sm:text-9xl md:text-[13rem] font-black select-none pointer-events-none z-0"
      >
        SEHAT CLINICAL WORKFLOW • NEXT-GEN OPDS • ABDM FHIR
      </div>

      {/* Section Header */}
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-2.5 mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200/80 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
          <span>Clinical Workflow</span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal text-slate-900 tracking-tight">
          End-to-End 5-Step Journey
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-500 font-normal leading-relaxed">
          From kiosk arrival to physician sign-off in minutes.
        </p>
      </div>

      {/* 5-Step Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <MagneticItem
              key={step.step}
              strength={12}
              className="h-full flex flex-col"
            >
              <div
                ref={(el) => (cardsRef.current[idx] = el)}
                onMouseMove={(e) => handleCardMouseMove(e, idx)}
                className="journey-light-card flex-1 p-5 flex flex-col justify-between text-left group cursor-default"
              >
                <div className="journey-light-glow" />

                {/* Top Bar: Step Number + Tag */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-extrabold tracking-tight text-slate-300 group-hover:text-sky-400 transition-colors">
                      {step.step}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md border ${step.tagColor}`}
                    >
                      {step.badge}
                    </span>
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${step.iconBg}`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight group-hover:text-sky-900 transition-colors">
                      {step.title}
                    </h3>
                    <div className="text-[11px] font-medium text-sky-700/80 mt-0.5">
                      {step.subtitle}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>

                {/* Bottom Indicator */}
                <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-slate-700 transition-colors">
                  <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Automated
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-sky-600" />
                </div>
              </div>
            </MagneticItem>
          );
        })}
      </div>

      {/* Bottom Metrics / Trust Strip */}
      <div className="relative z-10 mt-8 pt-5 border-t border-slate-200/80 flex flex-wrap items-center justify-center sm:justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Zero Data Leakage • DPDP Act 2023 Compliant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-600" />
          <span>Average Intake Duration: &lt; 3.5 mins</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-sky-600" />
          <span>Live OPD Queue Synchronized via ABDM FHIR</span>
        </div>
      </div>
    </section>
  );
};

export default CinematicJourney;
