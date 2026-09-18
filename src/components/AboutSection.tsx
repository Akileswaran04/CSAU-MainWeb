"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ============================================================
   ABOUT SECTION — Revealed on scroll after hero
   
   IntersectionObserver-driven staggered reveal.
   Typewriter-style text, editorial layout.
   ============================================================ */

const PARAGRAPH =
  "CSAU is the Computer Society of Anna University, CEG — a student-run collective for people who'd rather build than wait. We run hands-on workshops, hackathons, and speaker sessions that turn curiosity into working code. From first-year beginners to final-year builders, CSAU is where CEG's computer science community writes, breaks, and ships things together.";

export default function AboutSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [charCount, setCharCount] = useState(0);

  // IntersectionObserver: trigger reveal when section enters viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !revealed) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [revealed]);

  // Typewriter effect once revealed
  useEffect(() => {
    if (!revealed) return;
    let cancelled = false;

    const run = async () => {
      // Small delay before typewriter starts
      await new Promise((r) => setTimeout(r, 400));
      for (let i = 0; i <= PARAGRAPH.length; i++) {
        if (cancelled) return;
        setCharCount(i);
        await new Promise((r) => setTimeout(r, 12));
      }
    };

    run();
    return () => { cancelled = true; };
  }, [revealed]);

  return (
    <section
      ref={sectionRef}
      data-section="about"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12vh 6%",
        background: "var(--background)",
      }}
    >
      {/* Halftone field — replaces the old radial glow */}
      <div
        className="absolute inset-0 pointer-events-none halftone"
        style={{ opacity: 0.35 }}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{            background:
              "repeating-linear-gradient(to bottom, color-mix(in srgb, var(--on-surface) 1.4%, transparent) 0px, color-mix(in srgb, var(--on-surface) 1.4%, transparent) 1px, transparent 1px, transparent 4px)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Content */}        <div
          className="relative mx-auto"
          style={{
            zIndex: 10,
            maxWidth: 820,
            textAlign: "left",
          }}
        >
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: ".35em",
            color: "var(--on-surface-variant)",
            marginBottom: 22,
            opacity: revealed ? 1 : 0,
            transform: revealed ? "translateY(0)" : "translateY(20px)",
            transition: "opacity .6s ease, transform .6s ease",
          }}
        >
          {"// WHO WE ARE"}
        </div>

        {/* Title */}
        <h2
          style={{
            fontFamily: "'Kenfolg', 'Syne', sans-serif",
            fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: 400,
            letterSpacing: ".02em",
            color: "var(--on-surface)",
            marginBottom: 34,
            margin: "0 0 34px 0",
            opacity: revealed ? 1 : 0,
            transform: revealed ? "translateY(0)" : "translateY(20px)",
            transition: "opacity .7s ease .15s, transform .7s ease .15s",
          }}
        >
          COMPUTER SOCIETY OF ANNA UNIVERSITY
        </h2>

        {/* Decorative line */}
        <div
          style={{
            width: 48,
            height: 1,
            background: "var(--outline-variant)",
            marginBottom: 34,
            opacity: revealed ? 1 : 0,
            transition: "opacity .6s ease .3s",
          }}
        />

        {/* Body — typewriter. Measure is capped in `ch` so the line
            length stays readable at every viewport width. */}
        <div
          className="measure"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(15px, 1.6vw, 19px)",
            lineHeight: 1.75,
            color: "var(--on-surface-variant)",
            letterSpacing: ".01em",
            minHeight: "8em",
            opacity: revealed ? 1 : 0,
            transition: "opacity .6s ease .3s",
          }}
        >
          {PARAGRAPH.slice(0, charCount)}
          {charCount > 0 && charCount < PARAGRAPH.length && (
            <span
              className="caret-blink"
              style={{ background: "var(--primary-container)" }}
            />
          )}
        </div>

        {/* Buttons — reveal after typewriter completes */}
        <div
          className="flex flex-wrap gap-3"
          style={{
            marginTop: 44,
            opacity: charCount >= PARAGRAPH.length ? 1 : 0,
            transform: charCount >= PARAGRAPH.length ? "translateY(0)" : "translateY(12px)",
            transition: "opacity .6s ease, transform .6s ease",
          }}
        >
          <Link href="/team" data-route-load className="btn">
            VIEW TEAM →
          </Link>
        </div>
      </div>
    </section>
  );
}
