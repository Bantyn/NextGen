import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

/**
 * PageLayout Component
 * True full-page, edge-to-edge layout without card borders.
 * Embeds the soft multi-color atmospheric mesh gradient at the bottom.
 */
export const PageLayout = ({ children, onContactClick }) => {
  return (
    <div className="relative min-h-screen w-full bg-white text-slate-900 flex flex-col justify-between overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Soft Multi-Color Atmospheric Mesh Gradient Glow at the bottom */}
      <div className="fixed inset-x-0 bottom-0 h-[460px] pointer-events-none overflow-hidden z-0 opacity-80 select-none">
        {/* Left Amber/Yellow Aura */}
        <div className="absolute -bottom-24 -left-24 w-[500px] h-[400px] bg-amber-200/55 rounded-full blur-[110px] mix-blend-multiply" />
        {/* Center Peach/Coral Aura */}
        <div className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[580px] h-[380px] bg-rose-200/45 rounded-full blur-[120px] mix-blend-multiply" />
        {/* Right Cyan/Sky Aura */}
        <div className="absolute -bottom-24 -right-24 w-[520px] h-[420px] bg-sky-200/65 rounded-full blur-[110px] mix-blend-multiply" />
      </div>

      {/* Top Navigation */}
      <Navbar onActionClick={onContactClick} />

      {/* Main Page Content */}
      <main className="relative z-10 w-full flex-grow flex flex-col items-center">
        {children}
      </main>

      {/* Bottom Footer */}
      <Footer />
    </div>
  );
};

export default PageLayout;
