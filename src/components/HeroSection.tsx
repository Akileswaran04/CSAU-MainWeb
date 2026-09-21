"use client";

import { useEffect, useState } from "react";

/* ============================================================
   HERO SECTION - Full-viewport hero after the power-on handoff

   Left-aligned wordmark and telemetry block; three radar rings
   widen from a signal dot on the right. Scroll down to follow
   the signal.
   ============================================================ */

export default function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [scrollHint, setScrollHint] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setScrollHint(true), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const rise = (delay: number, dist = 20) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : `translateY(${dist}px)`,
    transition: `opacity .8s ease ${delay}s, transform .8s cubic-bezier(.2,.8,.2,1) ${delay}s`,
  });

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 8%",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      {/* Radar rings - three rings widening from a signal dot, off to the right */}
      <div
        className="absolute pointer-events-none"
        aria-hidden
        style={{
          top: "50%",
          left: "74%",
          width: "min(70vw, 560px)",
          height: "min(70vw, 560px)",
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
              border: "1px solid var(--hull-700)",
              opacity: 0,
              animation: `ping-out 9s cubic-bezier(.2,.6,.3,1) ${i * 3}s infinite`,
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

      {/* Content */}
      <div className="relative" style={{ zIndex: 10, display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(44px, 9vw, 120px)",
            letterSpacing: ".04em",
            color: "var(--on-surface)",
            margin: 0,
            lineHeight: 1,
            ...rise(0.1, 24),
          }}
        >
          CSAU
        </h1>

        <div style={{ width: 48, height: 1, background: "var(--lit)", ...rise(0.3, 0) }} />

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(13px, 1.4vw, 16px)",
            letterSpacing: ".2em",
            color: "var(--on-surface-variant)",
            textTransform: "uppercase",
            margin: 0,
            ...rise(0.2, 16),
          }}
        >
          Computer Society of Anna University
        </p>

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: ".2em",
            color: "var(--outline)",
            textTransform: "uppercase",
            margin: 0,
            ...rise(0.4, 0),
          }}
        >
          CEG, Anna University, 13.08 N 80.27 E
        </p>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute flex flex-col gap-2"
        style={{
          left: "8%",
          bottom: 40,
          zIndex: 10,
          opacity: scrollHint ? 1 : 0,
          transition: "opacity 1s ease",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: ".2em",
            color: "var(--outline)",
            textTransform: "uppercase",
          }}
        >
          Scroll
        </span>
        <div
          style={{
            width: 1,
            height: 32,
            background: "var(--outline-variant)",
            animation: "scroll-dot 2s ease-in-out infinite",
          }}
        />
      </div>
    </section>
  );
}
