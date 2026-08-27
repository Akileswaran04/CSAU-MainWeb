"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/* ============================================================
   PRELOADER — Cinematic cyberpunk loading experience.
   
   Multi-stage sequence:
   1. Dark screen → circuit traces draw in
   2. Gate frame appears with glow
   3. "CSAU" title materializes
   4. Loading stages cycle (system checks)
   5. Gate opens → content reveals
   ============================================================ */

interface PreloaderProps {
  onComplete?: () => void;
}

const LOADING_STAGES = [
  "INITIALIZING SYSTEM...",
  "LOADING DIGITAL REALM...",
  "CONNECTING NODES...",
  "RENDERING WORLD...",
  "SYSTEMS ONLINE",
];

export default function Preloader({ onComplete }: PreloaderProps) {
  const [visible, setVisible] = useState(true);
  const [stageIndex, setStageIndex] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const gateRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const barFillRef = useRef<HTMLDivElement>(null);
  const circuitRef = useRef<HTMLDivElement>(null);
  const leftDoorRef = useRef<HTMLDivElement>(null);
  const rightDoorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setVisible(false);
        onComplete?.();
      },
    });

    /* Stage 1: Circuit traces draw in (0 → 0.8s) — scale from center */
    tl.fromTo(
      circuitRef.current,
      { scale: 0.5 },
      { scale: 1, duration: 0.6, ease: "power2.out" },
      0
    );

    /* Stage 2: Gate frame appears (0.3 → 1.2s) — scale up from below */
    tl.fromTo(
      gateRef.current,
      { scale: 0.6, y: 40 },
      { scale: 1, y: 0, duration: 0.8, ease: "back.out(1.2)" },
      0.3
    );

    /* Stage 3: Title slides up letter by letter (0.6 → 1.6s) */
    const letters = titleRef.current?.querySelectorAll(".pre-letter");
    if (letters?.length) {
      gsap.set(letters, { y: 40, scale: 1.4 });
      tl.to(letters, {
        y: 0,
        scale: 1,
        duration: 0.7,
        stagger: 0.08,
        ease: "power4.out",
      }, 0.6);
    }

    /* Subtitle slides up */
    tl.fromTo(subtitleRef.current,
      { y: 15, letterSpacing: "0.8em" },
      { y: 0, letterSpacing: "0.35em", duration: 0.8, ease: "power3.out" },
      1.0
    );

    /* Stage 4: Loading bar fills with stage text cycling (1.2 → 3.5s) */
    tl.to(barFillRef.current, {
      width: "100%",
      duration: 2.2,
      ease: "power1.inOut",
      onUpdate: function() {
        const progress = this.progress();
        const newIndex = Math.min(
          Math.floor(progress * LOADING_STAGES.length),
          LOADING_STAGES.length - 1
        );
        if (newIndex !== stageIndex) setStageIndex(newIndex);
      },
    }, 1.2);

    /* Stage 5: Gate opens (3.5 → 4.5s) */
    tl.to(leftDoorRef.current, {
      x: "-100%",
      rotateY: -15,
      duration: 0.8,
      ease: "power2.inOut",
    }, 3.5);

    tl.to(rightDoorRef.current, {
      x: "100%",
      rotateY: 15,
      duration: 0.8,
      ease: "power2.inOut",
    }, 3.5);

    /* Content slides up and out — no opacity */
    tl.to(contentRef.current, {
      y: -80,
      scale: 0.9,
      duration: 0.6,
      ease: "power2.in",
    }, 3.7);

    /* Overlay slides up to reveal content */
    tl.to(overlayRef.current, {
      y: "-100%",
      duration: 0.7,
      ease: "power2.inOut",
    }, 4.0);

    return () => tl.kill();
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] bg-[#090714] flex items-center justify-center overflow-hidden"
    >
      {/* ═══ CIRCUIT TRACES (background) ═══ */}
      <div ref={circuitRef} className="absolute inset-0 opacity-0 pointer-events-none">
        {/* Horizontal traces */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`h${i}`}
            className="absolute h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent"
            style={{
              top: `${15 + i * 14}%`,
              left: "5%",
              right: "5%",
              animation: `circuit-draw ${1 + i * 0.2}s ease-out ${i * 0.15}s forwards`,
              transformOrigin: "left",
              clipPath: "inset(0 100% 0 0)",
            }}
          />
        ))}
        {/* Vertical traces */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`v${i}`}
            className="absolute w-px bg-gradient-to-b from-transparent via-magenta/20 to-transparent"
            style={{
              left: `${20 + i * 20}%`,
              top: "10%",
              bottom: "10%",
              animation: `circuit-draw-v ${1.2 + i * 0.1}s ease-out ${0.3 + i * 0.1}s forwards`,
              transformOrigin: "top",
              clipPath: "inset(0 0 100% 0)",
            }}
          />
        ))}
        {/* Corner nodes */}
        {[
          { top: "15%", left: "5%" },
          { top: "15%", right: "5%" },
          { bottom: "15%", left: "5%" },
          { bottom: "15%", right: "5%" },
          { top: "43%", left: "20%" },
          { top: "43%", right: "20%" },
          { top: "71%", left: "40%" },
          { top: "71%", right: "40%" },
        ].map((pos, i) => (
          <div
            key={`node${i}`}
            className="absolute w-1.5 h-1.5 rounded-full bg-cyan/40"
            style={{
              ...pos,
              boxShadow: "0 0 6px #00f0ff, 0 0 12px #00f0ff40",
              animation: `node-pulse 2s ease-in-out ${0.5 + i * 0.1}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div ref={contentRef} className="relative z-10 text-center">
        {/* Gate frame */}
        <div
          ref={gateRef}
          className="relative mx-auto w-[min(80vw,400px)] opacity-0"
        >
          {/* Left door */}
          <div
            ref={leftDoorRef}
            className="absolute top-0 left-0 w-1/2 h-full overflow-hidden"
            style={{ transformOrigin: "left center" }}
          >
            <div className="absolute inset-0 bg-[#0a0a15] border-r border-cyan/20" />
            {/* Grid texture */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="absolute left-0 right-0 border-b border-cyan/10" style={{ top: `${16.6 * (i + 1)}%` }} />
              ))}
            </div>
            {/* Neon edge */}
            <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-cyan/50 via-cyan/20 to-cyan/50 shadow-[0_0_8px_#00f0ff80]" />
          </div>

          {/* Right door */}
          <div
            ref={rightDoorRef}
            className="absolute top-0 right-0 w-1/2 h-full overflow-hidden"
            style={{ transformOrigin: "right center" }}
          >
            <div className="absolute inset-0 bg-[#0a0a15] border-l border-cyan/20" />
            <div className="absolute inset-0 opacity-20">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="absolute left-0 right-0 border-b border-cyan/10" style={{ top: `${16.6 * (i + 1)}%` }} />
              ))}
            </div>
            <div className="absolute top-0 left-0 bottom-0 w-[1px] bg-gradient-to-b from-cyan/50 via-cyan/20 to-cyan/50 shadow-[0_0_8px_#00f0ff80]" />
          </div>

          {/* Frame border */}
          <div className="absolute inset-0 border border-cyan/15 rounded-t-[60px] pointer-events-none" />

          {/* Top arch */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-2 bg-gradient-to-r from-transparent via-cyan/40 to-transparent rounded-full shadow-[0_0_15px_#00f0ff40]" />

          {/* ═══ TITLE (inside gate) ═══ */}
          <div className="relative z-10 flex flex-col items-center justify-center py-16 sm:py-20 px-4">
            <h1
              ref={titleRef}
              className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter leading-none mb-4"
              style={{
                fontFamily: "'Kenfolg', 'Centrion', sans-serif",
                textShadow: "0 0 20px #00f0ff80, 0 0 40px #00f0ff40, 0 0 80px #00f0ff20",
              }}
            >
              {"CSAU".split("").map((letter, i) => (
                <span key={i} className="pre-letter inline-block" style={{ color: "#F4F0E8" }}>
                  {letter}
                </span>
              ))}
            </h1>

            <p
              ref={subtitleRef}
              className="text-[10px] sm:text-xs tracking-[0.35em] uppercase mb-8"
              style={{
                fontFamily: "var(--font-creme), 'Creme', serif",
                color: "rgba(0,240,255,0.5)",
                opacity: 0,
              }}
            >
              Computer Society of Anna University
            </p>

            {/* Loading bar */}
            <div className="w-40 h-[2px] bg-foreground/10 rounded-full overflow-hidden mb-4">
              <div
                ref={barFillRef}
                className="h-full rounded-full"
                style={{
                  width: "0%",
                  background: "linear-gradient(90deg, #00f0ff, #ff00aa, #00f0ff)",
                  boxShadow: "0 0 10px #00f0ff, 0 0 20px #ff00aa80",
                }}
              />
            </div>

            {/* Loading stage text */}
            <p
              className="text-[9px] tracking-[0.25em] uppercase font-[family-name:var(--font-geist-mono)]"
              style={{ color: "rgba(0,240,255,0.35)" }}
            >
              {LOADING_STAGES[stageIndex]}
            </p>
          </div>
        </div>

        {/* Corner decorations */}
        <div className="absolute top-8 left-8 w-8 h-8 border-t border-l border-cyan/20 rounded-tl" />
        <div className="absolute top-8 right-8 w-8 h-8 border-t border-r border-cyan/20 rounded-tr" />
        <div className="absolute bottom-8 left-8 w-8 h-8 border-b border-l border-cyan/20 rounded-bl" />
        <div className="absolute bottom-8 right-8 w-8 h-8 border-b border-r border-cyan/20 rounded-br" />
      </div>

      {/* ═══ FLOATING PARTICLES ═══ */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${1 + (i % 3)}px`,
            height: `${1 + (i % 3)}px`,
            background: i % 3 === 0 ? "#00f0ff" : i % 3 === 1 ? "#ff00aa" : "#39ff14",
            top: `${10 + ((i * 7.3) % 80)}%`,
            left: `${5 + ((i * 11.7) % 90)}%`,
            opacity: 0.2 + (i % 4) * 0.05,
            boxShadow: `0 0 ${4 + i * 2}px currentColor`,
            animation: `float-particle ${2 + (i % 4) * 0.7}s ease-in-out ${i * 0.3}s infinite alternate`,
          }}
        />
      ))}

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, #090714 80%)",
        }}
      />
    </div>
  );
}
