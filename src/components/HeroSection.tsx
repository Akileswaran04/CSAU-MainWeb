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
        background: "transparent",
      }}
    >
      {/* Halftone field — replaces the old radial glow */}
      <div
        className="absolute inset-0 pointer-events-none halftone"
        style={{ opacity: 0.45 }}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(to bottom, color-mix(in srgb, var(--on-surface) 1.4%, transparent) 0px, color-mix(in srgb, var(--on-surface) 1.4%, transparent) 1px, transparent 1px, transparent 4px)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Water ripples — three rings widening from the centre, like a koi surfacing */}
      <div
        className="absolute pointer-events-none"
        aria-hidden
        style={{
          top: "50%",
          left: "50%",
          width: "min(80vw, 640px)",
          height: "min(80vw, 640px)",
          transform: "translate(-50%, -50%)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "1px solid var(--pond-700)",
              opacity: 0,
              animation: `ripple-out 9s cubic-bezier(.2,.6,.3,1) ${i * 3}s infinite`,
            }}
          />
        ))}
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 10,
            height: 10,
            marginLeft: -5,
            marginTop: -5,
            borderRadius: "50%",
            background: "var(--signal)",
          }}
        />
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
            fontFamily: "'Ethnocentric', 'Sector034', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(48px, 8vw, 110px)",
            letterSpacing: ".04em",
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
          Computer Society of Anna University
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
            fontFamily: "'JetBrains Mono', monospace",
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
            fontFamily: "'JetBrains Mono', monospace",
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
