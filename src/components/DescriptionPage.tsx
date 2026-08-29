"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ============================================================
   DESCRIPTION PAGE — Sculptural Tactility version

   Typewriter effect revealing:
   1. "// WHO WE ARE" eyebrow
   2. "THE COMPUTER SCIENCE ASSOCIATION" title
   3. Full paragraph about CSAU
   4. Back button

   Light claymorphism aesthetic with soft shadows and editorial typography.
   ============================================================ */

interface DescriptionPageProps {
  onBack?: () => void;
}

const PARAGRAPH =
  "CSAU is the Computer Science Association of the University, CEG — a student-run collective for people who'd rather build than wait. We run hands-on workshops, hackathons, and speaker sessions that turn curiosity into working code. From first-year beginners to final-year builders, CSAU is where Anna University's computer science community writes, breaks, and ships things together.";

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
        background: "var(--background)",
        opacity: active ? 1 : 0,
        pointerEvents: active ? "auto" : "none",
        transition: "opacity 1s ease",
      }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 30%, var(--surface-container-low) 0%, transparent 55%),
            linear-gradient(180deg, var(--background) 0%, var(--surface) 100%)
          `,
        }}
      />

      {/* Content */}
      <div
        className="relative mx-auto"
        style={{
          zIndex: 20,
          maxWidth: 820,
          textAlign: "left",
          paddingTop: "14vh",
          paddingBottom: "10vh",
          paddingLeft: "6%",
          paddingRight: "6%",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: "'Plus Jakarta Sans', monospace",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.15em",
            color: "var(--primary-container)",
            marginBottom: 24,
            minHeight: "1em",
          }}
        >
          {eyebrow}
          {eyebrow.length < "// WHO WE ARE".length && <span className="caret-blink" />}
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--on-surface)",
            lineHeight: 1.1,
            marginBottom: 36,
            minHeight: "1.3em",
          }}
        >
          {title}
          {title.length > 0 && title.length < "THE COMPUTER SCIENCE ASSOCIATION".length && (
            <span className="caret-blink" />
          )}
        </div>

        {/* Body */}
        <div
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(15px, 1.6vw, 18px)",
            fontWeight: 400,
            lineHeight: 1.7,
            color: "var(--on-surface-variant)",
            letterSpacing: "0.01em",
            minHeight: "8em",
          }}
        >
          {body}
          {body.length > 0 && body.length < PARAGRAPH.length && (
            <span className="caret-blink" />
          )}
        </div>

        {/* Nav buttons — claymorphism */}
        <div
          className="mt-12 flex flex-wrap gap-4"
          style={{ opacity: showBack ? 1 : 0, transition: "opacity .6s ease" }}
        >
          <button
            onClick={onBack}
            className="group"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "var(--on-surface-variant)",
              background: "var(--surface-container-lowest)",
              border: "1px solid var(--outline-variant)",
              padding: "12px 24px",
              borderRadius: 999,
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "inset 0 2px 6px rgba(0,0,0,0.06), inset 0 1px 2px rgba(0,0,0,0.04)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)";
            }}
          >
            <span className="transition-colors group-hover:text-[var(--primary)]">« BACK TO SYSTEM</span>
          </button>
          <Link
            href="/team"
            className="group"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "var(--on-primary)",
              background: "var(--primary)",
              border: "none",
              padding: "12px 24px",
              borderRadius: 999,
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "inline-block",
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.08)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span className="transition-colors">VIEW TEAM →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
