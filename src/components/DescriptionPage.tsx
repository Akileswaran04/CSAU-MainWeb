"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ============================================================
   DESCRIPTION PAGE — White Sculptural Tactility Theme

   Typewriter effect revealing:
   1. "// WHO WE ARE" eyebrow
   2. "THE COMPUTER SCIENCE ASSOCIATION" title
   3. Full paragraph about CSAU
   4. Back + Team buttons

   White background, scanlines, clay shadows.
   ============================================================ */

interface DescriptionPageProps {
  onBack?: () => void;
}

const PARAGRAPH =
  "CSAU is the Computer Society of Anna University, CEG — a student-run collective for people who'd rather build than wait. We run hands-on workshops, hackathons, and speaker sessions that turn curiosity into working code. From first-year beginners to final-year builders, CSAU is where Anna University's computer science community writes, breaks, and ships things together.";

export default function DescriptionPage({ onBack }: DescriptionPageProps) {
  const [eyebrow, setEyebrow] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showBack, setShowBack] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const run = async () => {
      const eyebrowText = "// WHO WE ARE";
      for (let i = 0; i <= eyebrowText.length; i++) {
        if (cancelled) return;
        setEyebrow(eyebrowText.slice(0, i));
        await new Promise((r) => setTimeout(r, 30));
      }
      await new Promise((r) => setTimeout(r, 150));

      const titleText = "THE COMPUTER SCIENCE ASSOCIATION";
      for (let i = 0; i <= titleText.length; i++) {
        if (cancelled) return;
        setTitle(titleText.slice(0, i));
        await new Promise((r) => setTimeout(r, 22));
      }
      await new Promise((r) => setTimeout(r, 200));

      for (let i = 0; i <= PARAGRAPH.length; i++) {
        if (cancelled) return;
        setBody(PARAGRAPH.slice(0, i));
        await new Promise((r) => setTimeout(r, 14));
      }

      if (!cancelled) setShowBack(true);
    };

    run();
    return () => { cancelled = true; };
  }, [active]);

  return (
    <div
      className="fixed inset-0 overflow-auto"
      style={{
        zIndex: 15,
        background: `radial-gradient(ellipse at 50% 30%, var(--surface-container-low) 0%, transparent 55%), var(--background)`,
        opacity: active ? 1 : 0,
        pointerEvents: active ? "auto" : "none",
        transition: "opacity 1s ease",
      }}
    >
      {/* Scanlines — light */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "repeating-linear-gradient(to bottom, rgba(26,27,34,.015) 0px, rgba(26,27,34,.015) 1px, transparent 1px, transparent 4px)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Content */}
      <div className="relative mx-auto" style={{ zIndex: 20, maxWidth: 820, textAlign: "left", paddingTop: "14vh", paddingBottom: "10vh", paddingLeft: "6%", paddingRight: "6%" }}>
        {/* Eyebrow */}
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: ".35em", color: "var(--on-surface-variant)", marginBottom: 22, minHeight: "1em" }}>
          {eyebrow}
          {eyebrow.length < "// WHO WE ARE".length && <span className="caret-blink" style={{ background: "var(--primary-container)" }} />}
        </div>

        {/* Title */}          <div style={{ fontFamily: "'Kenfolg', 'Syne', sans-serif", fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 400, letterSpacing: ".02em", color: "var(--on-surface)", marginBottom: 34, minHeight: "1.3em" }}>
          {title}
          {title.length > 0 && title.length < "THE COMPUTER SCIENCE ASSOCIATION".length && <span className="caret-blink" style={{ background: "var(--primary-container)" }} />}
        </div>

        {/* Body */}
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(15px, 1.6vw, 19px)", lineHeight: 1.85, color: "var(--on-surface-variant)", letterSpacing: ".01em", minHeight: "8em" }}>
          {body}
          {body.length > 0 && body.length < PARAGRAPH.length && <span className="caret-blink" style={{ background: "var(--primary-container)" }} />}
        </div>

        {/* Buttons — clay pill style */}
        <div className="mt-11 flex flex-wrap gap-3" style={{ opacity: showBack ? 1 : 0, transition: "opacity .6s ease" }}>
          <button onClick={onBack} className="group" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, letterSpacing: ".2em", color: "var(--on-surface-variant)", border: "1px solid var(--outline-variant)", padding: "10px 20px", background: "var(--surface-container-lowest)", cursor: "pointer", transition: "color .25s, border-color .25s, box-shadow .25s", borderRadius: 999, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)" }}>
            <span className="transition-colors group-hover:text-[var(--on-surface)]">« BACK TO SYSTEM</span>
          </button>
          <Link href="/team" className="group" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, letterSpacing: ".2em", color: "var(--on-surface-variant)", border: "1px solid var(--outline-variant)", padding: "10px 20px", background: "var(--surface-container-lowest)", cursor: "pointer", transition: "color .25s, border-color .25s, box-shadow .25s", display: "inline-block", textDecoration: "none", borderRadius: 999, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)" }}>
            <span className="transition-colors group-hover:text-[var(--on-surface)]">VIEW TEAM →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
