"use client";

import { useEffect, useState, useRef } from "react";

/* ============================================================
   HERO SECTION — Full-viewport hero after landing zoom
   
   Centered "CSAU" brand, subtitle, scroll indicator.
   Scroll down reveals the about section below.
   ============================================================ */

export default function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [scrollHint, setScrollHint] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setScrollHint(true), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: `radial-gradient(ellipse at 50% 45%, var(--surface-container-low) 0%, transparent 55%), var(--background)`,
      }}
    >
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "repeating-linear-gradient(to bottom, rgba(26,27,34,.015) 0px, rgba(26,27,34,.015) 1px, transparent 1px, transparent 4px)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Rotating rings — background decoration */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(65vw, 480px)",
          height: "min(65vw, 480px)",
          opacity: 0.35,
        }}
      >
        <div className="absolute inset-0" style={{ animation: "spin 30s linear infinite" }}>
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="200" cy="200" r="180" fill="none" stroke="var(--outline-variant)" strokeWidth="1.5" strokeDasharray="18 8 4 8 50 12" opacity=".4" />
          </svg>
        </div>
        <div className="absolute inset-0" style={{ animation: "spinReverse 42s linear infinite" }}>
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="200" cy="200" r="145" fill="none" stroke="var(--outline)" strokeWidth="1" strokeDasharray="4 12 28 10 3 14" opacity=".25" />
          </svg>
        </div>
        <div className="absolute inset-0" style={{ animation: "spin 56s linear infinite" }}>
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="200" cy="200" r="110" fill="none" stroke="var(--outline-variant)" strokeWidth=".8" strokeDasharray="6 16 2 16" opacity=".2" />
          </svg>
        </div>
      </div>

      {/* Center content */}
      <div
        className="relative text-center flex flex-col items-center"
        style={{
          zIndex: 10,
          gap: 20,
          padding: "0 12%",
        }}
      >
        {/* Brand */}
        <h1
          style={{
            fontFamily: "'Sector034', monospace",
            fontWeight: 400,
            fontSize: "clamp(48px, 8vw, 110px)",
            letterSpacing: ".18em",
            color: "var(--on-surface)",
            margin: 0,
            lineHeight: 1,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity .8s ease, transform .8s cubic-bezier(.2,.8,.2,1)",
          }}
        >
          CSAU..
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'WildWorld', 'Syne', sans-serif",
            fontSize: "clamp(13px, 1.4vw, 16px)",
            letterSpacing: ".25em",
            color: "var(--on-surface-variant)",
            textTransform: "uppercase",
            margin: 0,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity .8s ease .2s, transform .8s ease .2s",
          }}
        >
          THE COMPUTER SCIENCE ASSOCIATION
        </p>

        {/* Decorative line */}
        <div
          style={{
            width: 48,
            height: 1,
            background: "var(--outline-variant)",
            opacity: visible ? 1 : 0,
            transition: "opacity .8s ease .4s",
          }}
        />

        {/* Eyebrow */}
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 11,
            letterSpacing: ".2em",
            color: "var(--outline)",
            textTransform: "uppercase",
            margin: 0,
            opacity: visible ? 1 : 0,
            transition: "opacity .8s ease .5s",
          }}
        >
          CEG · ANNA UNIVERSITY · CHENNAI
        </p>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{
          bottom: 40,
          zIndex: 10,
          opacity: scrollHint ? 1 : 0,
          transition: "opacity 1s ease",
        }}
      >
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 9,
            letterSpacing: ".2em",
            color: "var(--outline)",
            textTransform: "uppercase",
          }}
        >
          SCROLL
        </span>
        <div
          style={{
            width: 1,
            height: 32,
            background: "linear-gradient(to bottom, var(--outline-variant), transparent)",
            animation: "scroll-dot 2s ease-in-out infinite",
          }}
        />
      </div>
    </section>
  );
}
