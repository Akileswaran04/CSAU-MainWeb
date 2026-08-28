"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ============================================================
   DESCRIPTION PAGE — From cursor-character.html
   
   Typewriter effect revealing:
   1. "// WHO WE ARE" eyebrow
   2. "THE COMPUTER SCIENCE ASSOCIATION" title
   3. Full paragraph about CSAU
   4. Back button
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

  // Activate with slight delay
  useEffect(() => {
    const t = setTimeout(() => setActive(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Typewriter sequence
  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const run = async () => {
      // Type eyebrow
      const eyebrowText = "// WHO WE ARE";
      for (let i = 0; i <= eyebrowText.length; i++) {
        if (cancelled) return;
        setEyebrow(eyebrowText.slice(0, i));
        await new Promise((r) => setTimeout(r, 30));
      }
      await new Promise((r) => setTimeout(r, 150));

      // Type title
      const titleText = "THE COMPUTER SCIENCE ASSOCIATION";
      for (let i = 0; i <= titleText.length; i++) {
        if (cancelled) return;
        setTitle(titleText.slice(0, i));
        await new Promise((r) => setTimeout(r, 22));
      }
      await new Promise((r) => setTimeout(r, 200));

      // Type body
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
        background: "#050507",
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
            radial-gradient(ellipse at 50% 30%, #140e26 0%, transparent 55%),
            repeating-linear-gradient(135deg, #0a0b16 0 2px, #050507 2px 90px),
            repeating-linear-gradient(45deg, #0a0b16 0 2px, #050507 2px 90px)
          `,
        }}
      />

      {/* Content */}
      <div
        className="relative mx-auto"
        style={{ zIndex: 20, maxWidth: 820, textAlign: "left", paddingTop: "14vh", paddingBottom: "10vh", paddingLeft: "6%", paddingRight: "6%" }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: ".35em",
            color: "#ff2b8f",
            marginBottom: 22,
            minHeight: "1em",
          }}
        >
          {eyebrow}
          {eyebrow.length < "// WHO WE ARE".length && <span className="caret-blink" />}
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: "'Zen Dots', sans-serif",
            fontSize: "clamp(28px, 5vw, 52px)",
            color: "#f2f4ff",
            letterSpacing: ".04em",
            marginBottom: 34,
            textShadow: "0 0 24px rgba(0,240,255,.3)",
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
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: "clamp(15px, 1.6vw, 19px)",
            lineHeight: 1.85,
            color: "#cdd3ef",
            letterSpacing: ".01em",
            minHeight: "8em",
          }}
        >
          {body}
          {body.length > 0 && body.length < PARAGRAPH.length && (
            <span className="caret-blink" />
          )}
        </div>

        {/* Nav buttons */}
        <div
          className="mt-11 flex flex-wrap gap-3"
          style={{ opacity: showBack ? 1 : 0, transition: "opacity .6s ease" }}
        >
          <button
            onClick={onBack}
            className="group"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: ".2em",
              color: "#5c6190",
              border: "1px solid #2a2d45",
              padding: "10px 20px",
              background: "rgba(14,15,26,.5)",
              cursor: "pointer",
              transition: "color .25s, border-color .25s",
            }}
          >
            <span className="transition-colors group-hover:text-[#00f0ff]">« BACK TO SYSTEM</span>
          </button>
          <Link
            href="/team"
            className="group"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: ".2em",
              color: "#5c6190",
              border: "1px solid #2a2d45",
              padding: "10px 20px",
              background: "rgba(14,15,26,.5)",
              cursor: "pointer",
              transition: "color .25s, border-color .25s",
              display: "inline-block",
              textDecoration: "none",
            }}
          >
            <span className="transition-colors group-hover:text-[#00f0ff]">VIEW TEAM →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
