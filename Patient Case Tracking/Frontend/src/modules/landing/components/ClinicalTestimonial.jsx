import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { CheckCircle2, Sparkles } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Identify & Consent",
    subtitle: "ABHA & DPDP Compliant",
    quote: "Patient enters or scans ABHA ID, selects preferred language, and provides audio-guided DPDP consent.",
    stage: "Kiosk Arrival & Verification",
    actor: "Step 01 • Patient Onboarding",
    badge: "Voice & Touch",
  },
  {
    step: "02",
    title: "Converse & Intake",
    subtitle: "Adaptive SOCRATES AI",
    quote: "AI conducts adaptive voice + touch clinical interview; immediate red-flag detection triggers emergency triage.",
    stage: "Multilingual AI History Intake",
    actor: "Step 02 • Clinical Interview",
    badge: "Adaptive AI",
  },
  {
    step: "03",
    title: "Scan & Digitize",
    subtitle: "Rx & Report Vision OCR",
    quote: "Upload prior prescriptions and reports; OCR engine digitizes active medications and abnormal lab ranges.",
    stage: "Prescriptions & Labs Digitization",
    actor: "Step 03 • Vision OCR Engine",
    badge: "Vision OCR",
  },
  {
    step: "04",
    title: "Summarize & Route",
    subtitle: "ABDM FHIR Structured",
    quote: "FHIR history summary is generated, linked to ABHA profile, and pushed live to physician's OPD consultation queue.",
    stage: "Live OPD Queue Synchronization",
    actor: "Step 04 • ABDM FHIR Bundle",
    badge: "Live Routing",
  },
  {
    step: "05",
    title: "Consult & Sign-Off",
    subtitle: "Rapid Physician Care",
    quote: "Physician reviews structured chronological history in seconds, edits or confirms findings, and finalizes treatment.",
    stage: "Rapid OPD Physician Review",
    actor: "Step 05 • Physician Sign-Off",
    badge: "Doctor Sign-Off",
  },
];

export function ClinicalTestimonial() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const numberRef = useRef(null);
  const quoteRef = useRef(null);
  const authorRef = useRef(null);
  const badgeRef = useRef(null);

  // Parallax spring physics on oversized number
  useEffect(() => {
    const el = containerRef.current;
    const numEl = numberRef.current;
    if (!el || !numEl) return;

    const xTo = gsap.quickTo(numEl, "x", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(numEl, "y", { duration: 0.6, ease: "power3.out" });

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;

      xTo((distanceX / (rect.width / 2)) * 25);
      yTo((distanceY / (rect.height / 2)) * 15);
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
  }, []);

  // Animate elements on activeIndex change
  useEffect(() => {
    // 1. Number change animation
    if (numberRef.current) {
      gsap.fromTo(
        numberRef.current,
        { opacity: 0, scale: 0.85, filter: "blur(8px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.6, ease: "power2.out" }
      );
    }

    // 2. Badge slide
    if (badgeRef.current) {
      gsap.fromTo(
        badgeRef.current,
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
      );
    }

    // 3. Staggered 3D Word-by-word reveal
    if (quoteRef.current) {
      const words = quoteRef.current.querySelectorAll(".step-word");
      gsap.fromTo(
        words,
        { opacity: 0, y: 16, rotateX: 60 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.45,
          stagger: 0.02,
          ease: "power2.out",
        }
      );
    }

    // 4. Author row slide
    if (authorRef.current) {
      gsap.fromTo(
        authorRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, delay: 0.15, ease: "power2.out" }
      );
    }
  }, [activeIndex]);

  const goNext = () => setActiveIndex((prev) => (prev + 1) % steps.length);
  const goPrev = () => setActiveIndex((prev) => (prev - 1 + steps.length) % steps.length);

  // Auto slide timer
  useEffect(() => {
    const timer = setInterval(goNext, 6000);
    return () => clearInterval(timer);
  }, []);

  const current = steps[activeIndex];

  return (
    <section className="w-full relative py-6 overflow-hidden flex flex-col items-center justify-center">

      {/* Section Heading */}
      <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200/80 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>Clinical Workflow</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal text-slate-950 tracking-tight">
          End-to-End 5-Step Journey
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
          From kiosk arrival to physician sign-off in minutes.
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative w-full max-w-5xl px-4 sm:px-6 select-none"
      >
        {/* Oversized Index Number */}
        <div
          ref={numberRef}
          className="absolute -left-6 sm:-left-12 top-1/2 -translate-y-1/2 text-[16rem] sm:text-[22rem] md:text-[26rem] font-extrabold text-slate-900/[0.035] select-none pointer-events-none leading-none tracking-tighter font-mono"
        >
          {String(activeIndex + 1).padStart(2, "0")}
        </div>

        {/* Main Content — Asymmetric Layout */}
        <div className="relative flex flex-col sm:flex-row items-stretch">
          {/* Left Column — Vertical Text & Progress Line */}
          <div className="hidden sm:flex flex-col items-center justify-center pr-10 md:pr-14 border-r border-slate-200/80">
            <span
              className="text-[11px] font-mono font-medium text-slate-400 tracking-widest uppercase"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              5-Step Workflow
            </span>

            {/* Vertical Progress Line */}
            <div className="relative h-28 w-px bg-slate-200 mt-8 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 w-full bg-slate-900 transition-all duration-500 ease-out"
                style={{
                  height: `${((activeIndex + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Center / Right — Main Step Quote and Details */}
          <div className="flex-1 sm:pl-10 md:pl-14 py-6 sm:py-8 text-left">
            {/* Step Badge + Subtitle */}
            <div ref={badgeRef} className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-2 text-xs font-mono text-slate-900 font-semibold bg-slate-100/90 border border-slate-200/90 rounded-full px-3.5 py-1">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                {current.title}
              </span>
              <span className="text-[11px] font-medium text-sky-700 bg-sky-50 border border-sky-200/70 rounded-full px-2.5 py-0.5">
                {current.badge}
              </span>
            </div>

            {/* Quote with Word-by-Word Reveal */}
            <div className="relative mb-10 min-h-[130px] sm:min-h-[150px] flex items-center">
              <blockquote
                ref={quoteRef}
                className="text-2xl sm:text-3xl md:text-4xl font-normal text-slate-900 leading-[1.25] tracking-tight"
                style={{ perspective: "1000px" }}
              >
                {current.quote.split(" ").map((word, i) => (
                  <span
                    key={`${activeIndex}-${i}`}
                    className="step-word inline-block mr-[0.28em] origin-bottom"
                  >
                    {word}
                  </span>
                ))}
              </blockquote>
            </div>

            {/* Author / Stage Row & Navigation Controls */}
            <div className="flex items-end justify-between pt-4 border-t border-slate-100">
              <div ref={authorRef} className="flex items-center gap-3.5">
                {/* Line before step name */}
                <div className="w-7 h-px bg-slate-900" />
                <div>
                  <p className="text-sm sm:text-base font-medium text-slate-950 flex items-center gap-1.5">
                    {current.actor}
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 font-normal">
                    {current.stage} • {current.subtitle}
                  </p>
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-3">
                <button
                  onClick={goPrev}
                  className="group relative w-11 h-11 rounded-full border border-slate-300 hover:border-slate-950 flex items-center justify-center overflow-hidden transition-all duration-300 cursor-pointer bg-white active:scale-95 shadow-2xs"
                  aria-label="Previous step"
                >
                  <div className="absolute inset-0 bg-slate-950 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="relative z-10 text-slate-800 group-hover:text-white transition-colors"
                  >
                    <path
                      d="M10 12L6 8L10 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  onClick={goNext}
                  className="group relative w-11 h-11 rounded-full border border-slate-300 hover:border-slate-950 flex items-center justify-center overflow-hidden transition-all duration-300 cursor-pointer bg-white active:scale-95 shadow-2xs"
                  aria-label="Next step"
                >
                  <div className="absolute inset-0 bg-slate-950 translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="relative z-10 text-slate-800 group-hover:text-white transition-colors"
                  >
                    <path
                      d="M6 4L10 8L6 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ClinicalTestimonial;
