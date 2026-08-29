import React, { useEffect, useRef } from 'react';
import { Bot, Sparkles, X, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';

/**
 * SmartAssistantButton Component
 * Enhanced with GSAP page-load entrance, subtle idle floating motion, and theme-consistent micro-interactions.
 */
export const SmartAssistantButton = ({ isOpen, onClick, unreadCount = 0 }) => {
  const buttonRef = useRef(null);
  const pulseRingRef = useRef(null);
  const sparkRef = useRef(null);
  const floatTweenRef = useRef(null);

  // GSAP Page-Load Entrance Animation & Idle Motion
  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    // 1. Initial State: Hidden and shifted down
    gsap.set(btn, {
      opacity: 0,
      scale: 0.4,
      y: 60,
      rotation: -8,
    });

    // 2. Entrance Animation after page renders (Delay: 0.7s)
    const entranceTl = gsap.timeline({
      delay: 0.7,
      onComplete: () => {
        // 3. Start gentle idle floating after entrance completes
        if (!isOpen) {
          floatTweenRef.current = gsap.to(btn, {
            y: -5,
            duration: 2.4,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });
        }
      },
    });

    entranceTl.to(btn, {
      opacity: 1,
      scale: 1,
      y: 0,
      rotation: 0,
      duration: 0.9,
      ease: 'back.out(1.8)',
    });

    // Continuous subtle ambient sparkle pulse
    if (sparkRef.current) {
      gsap.to(sparkRef.current, {
        scale: 1.3,
        rotation: 20,
        opacity: 0.8,
        duration: 1.6,
        yoyo: true,
        repeat: -1,
        ease: 'power1.inOut',
      });
    }

    // Continuous subtle halo pulse around the button
    if (pulseRingRef.current) {
      gsap.to(pulseRingRef.current, {
        scale: 1.25,
        opacity: 0,
        duration: 2.2,
        repeat: -1,
        ease: 'power2.out',
      });
    }

    return () => {
      entranceTl.kill();
      if (floatTweenRef.current) floatTweenRef.current.kill();
    };
  }, []);

  // Handle open/close state transitions
  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    if (isOpen) {
      if (floatTweenRef.current) floatTweenRef.current.pause();
      gsap.to(btn, {
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    } else {
      if (floatTweenRef.current) floatTweenRef.current.resume();
    }
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (!buttonRef.current) return;
    gsap.to(buttonRef.current, {
      scale: 1.06,
      duration: 0.25,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    if (!buttonRef.current) return;
    gsap.to(buttonRef.current, {
      scale: 1,
      duration: 0.25,
      ease: 'power2.out',
    });
  };

  const handleClick = (e) => {
    if (buttonRef.current) {
      gsap.fromTo(
        buttonRef.current,
        { scale: 0.93 },
        { scale: 1, duration: 0.3, ease: 'back.out(2)' }
      );
    }
    if (onClick) onClick(e);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center">
      {/* Ambient Pulsing Halo Ring */}
      {!isOpen && (
        <div
          ref={pulseRingRef}
          className="absolute inset-0 rounded-full bg-sky-400/20 pointer-events-none -z-10"
        />
      )}

      <button
        ref={buttonRef}
        id="smart-assistant-trigger"
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={isOpen ? 'Close Smart AI Assistant' : 'Open Smart AI Assistant'}
        className={`group relative inline-flex items-center gap-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full text-xs font-normal cursor-pointer shadow-xl backdrop-blur-2xl transition-colors duration-300 ${
          isOpen
            ? 'bg-slate-950 text-white border border-slate-800 shadow-slate-950/25'
            : 'bg-slate-950/95 hover:bg-slate-900 text-white border border-slate-800/90 hover:border-sky-500/40 shadow-slate-950/30'
        }`}
      >
        {isOpen ? (
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-slate-300 group-hover:text-white transition-transform group-hover:rotate-90" />
            <span className="text-xs font-normal text-slate-200">Close Assistant</span>
          </div>
        ) : (
          <>
            {/* Ambient Pulsing Icon Box matching HomeView Module icons */}
            <div className="relative flex items-center justify-center w-7 h-7 rounded-2xl bg-sky-500/15 border border-sky-400/30 text-sky-400">
              <Bot className="w-4 h-4 text-sky-300 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950 animate-pulse" />
            </div>

            <div className="flex flex-col text-left leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-normal text-white tracking-tight">Smart AI Assistant</span>
                <span ref={sparkRef} className="inline-block">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline-block">
                Medicine • OPD • Support
              </span>
            </div>

            {/* Unread Notification Counter */}
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
