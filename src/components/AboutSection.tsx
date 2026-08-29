"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ============================================================
   ABOUT SECTION — Revealed on scroll after hero
   
   IntersectionObserver-driven staggered reveal.
   Typewriter-style text, editorial layout.
   ============================================================ */

const PARAGRAPH =
  "CSAU is the Computer Science Association of the University, CEG — a student-run collective for people who'd rather build than wait. We run hands-on workshops, hackathons, and speaker sessions that turn curiosity into working code. From first-year beginners to final-year builders, CSAU is where Anna University's computer science community writes, breaks, and ships things together.";

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
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12vh 6%",
        background: `radial-gradient(ellipse at 50% 30%, var(--surface-container-low) 0%, transparent 55%), var(--background)`,
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

      {/* Content */}
      <div
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
            fontFamily: "'Plus Jakarta Sans', monospace",
            fontSize: 11,
            letterSpacing: ".35em",
            color: "var(--on-surface-variant)",
            marginBottom: 22,
            opacity: revealed ? 1 : 0,
            transform: revealed ? "translateY(0)" : "translateY(20px)",
            transition: "opacity .6s ease, transform .6s ease",
          }}
        >
          // WHO WE ARE
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
          THE COMPUTER SCIENCE ASSOCIATION
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

        {/* Body — typewriter */}
        <div
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(15px, 1.6vw, 19px)",
            lineHeight: 1.85,
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
          <Link
            href="/team"
            className="group"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 11,
              letterSpacing: ".2em",
              color: "var(--on-surface-variant)",
              border: "1px solid var(--outline-variant)",
              padding: "10px 22px",
              background: "var(--surface-container-lowest)",
              cursor: "pointer",
              transition: "color .25s, border-color .25s, box-shadow .25s",
              display: "inline-block",
              textDecoration: "none",
              borderRadius: 999,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)",
            }}
          >
            <span className="transition-colors group-hover:text-[var(--on-surface)]">
              VIEW TEAM →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
