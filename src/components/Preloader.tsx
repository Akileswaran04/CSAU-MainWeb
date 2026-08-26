"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";

/* ==========================================================================
   CYBERPUNK GATE — Theme Toggle Preloader.
   - Pitch black → Chinese door-close fill (two halves slide from edges)
   - CSAU logo + progress bar
   - Theme selection buttons
   ========================================================================== */

type Phase = "loading" | "theme-select" | "entering";

const DUSTY_WHITE = "#E8E4DC";
const DEEP_PURPLE = "#090714";

/* ---- Theme Button (glass portal) ---- */
function ThemeButton({
  label,
  sublabel,
  color,
  onClick,
}: {
  label: string;
  sublabel: string;
  color: "light" | "dark";
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isLight = color === "light";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative cursor-pointer"
      style={{ perspective: "800px" }}
    >
      <div
        className="relative z-10 px-12 py-6 rounded-3xl border transition-all duration-500"
        style={{
          background: isLight
            ? "linear-gradient(145deg, rgba(240,236,228,0.92), rgba(216,212,204,0.88))"
            : "linear-gradient(145deg, rgba(26,26,46,0.92), rgba(10,10,18,0.88))",
          borderColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(0,240,255,0.15)",
          backdropFilter: "blur(12px)",
          boxShadow: hovered
            ? isLight
              ? "0 12px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.6), 0 0 30px rgba(232,228,220,0.15)"
              : "0 12px 40px rgba(0,240,255,0.15), inset 0 1px 0 rgba(0,240,255,0.15), 0 0 30px rgba(0,240,255,0.1)"
            : isLight
            ? "0 4px 20px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)"
            : "0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(0,240,255,0.05)",
          transform: hovered
            ? "translateY(-4px) rotateX(2deg)"
            : "translateY(0) rotateX(0)",
        }}
      >
        <span
          className="text-xl font-bold tracking-wide block"
          style={{
            fontFamily: "'Centrion', var(--font-space-grotesk), sans-serif",
            color: isLight ? "#090714" : "#E8E4DC",
          }}
        >
          {label}
        </span>
        <p
          className="text-[10px] tracking-[0.2em] uppercase mt-1.5"
          style={{
            color: isLight ? "rgba(9,7,20,0.4)" : "rgba(232,228,220,0.3)",
          }}
        >
          {sublabel}
        </p>
      </div>
    </button>
  );
}

/* ===== MAIN COMPONENT ===== */
export default function Preloader() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);
  const [gone, setGone] = useState(false);
  const phaseRef = useRef<Phase>("loading");

  /* Refs for GSAP animations */
  const leftFillRef = useRef<HTMLDivElement>(null);
  const rightFillRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const chooseTheme = useCallback((theme: "light" | "dark") => {
    phaseRef.current = "entering";
    setPhase("entering");

    document.documentElement.setAttribute("data-theme", theme);
    setTimeout(() => {
      (window as Window & { __csauEntered?: boolean }).__csauEntered = true;
      window.dispatchEvent(new CustomEvent("csau:entered"));
      document.documentElement.classList.add("csau-entered");
      document.body.style.overflow = "";
      setGone(true);
    }, 900);
  }, []);

  /* Loading animation — Chinese door-close fill */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    let start = performance.now();
    let loaded = document.readyState === "complete";
    const onLoad = () => (loaded = true);
    window.addEventListener("load", onLoad);

    let raf = 0;
    function tick(now: number) {
      const t = (now - start) / 6000;
      const cap = loaded ? 1 : 0.9;
      const p = Math.min(t, cap);
      setProgress(Math.floor(p * 100));

      if (p >= 1 && phaseRef.current === "loading") {
        phaseRef.current = "theme-select";
        setPhase("theme-select");
      }
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
      document.body.style.overflow = "";
    };
  }, []);

  /* Door-close animation — fills slide from edges */
  useEffect(() => {
    if (!leftFillRef.current || !rightFillRef.current) return;
    const p = progress / 100;

    gsap.set(leftFillRef.current, {
      x: `${(1 - p) * -100}%`,
      opacity: p,
    });
    gsap.set(rightFillRef.current, {
      x: `${(1 - p) * 100}%`,
      opacity: p,
    });
  }, [progress]);

  /* Logo entrance animation */
  useEffect(() => {
    if (!logoRef.current || phase !== "loading") return;
    gsap.fromTo(
      logoRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, delay: 0.3, ease: "power2.out" }
    );
    if (subtitleRef.current) {
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, delay: 0.6, ease: "power2.out" }
      );
    }
  }, [phase]);

  /* Theme select entrance */
  useEffect(() => {
    if (phase !== "theme-select" || !themeRef.current) return;
    gsap.fromTo(
      themeRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }
    );
  }, [phase]);

  if (gone) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-800 ${
        phase === "entering" ? "opacity-0" : "opacity-100"
      }`}
      style={{ background: "#000000" }}
      aria-label="Loading"
      role="status"
    >
      {/* ---- Layer 1: Chinese door-close fills ---- */}
      {/* Left — dusty white sliding from left edge */}
      <div
        ref={leftFillRef}
        className="absolute top-0 left-0 h-full"
        style={{
          width: "52%",
          background: `linear-gradient(90deg, ${DUSTY_WHITE} 0%, ${DUSTY_WHITE} 85%, rgba(232,228,220,0.6) 100%)`,
          clipPath: "polygon(0 0, 100% 0, 95% 100%, 0 100%)",
        }}
      />

      {/* Right — deep purple sliding from right edge */}
      <div
        ref={rightFillRef}
        className="absolute top-0 right-0 h-full"
        style={{
          width: "52%",
          background: `linear-gradient(270deg, ${DEEP_PURPLE} 0%, ${DEEP_PURPLE} 85%, rgba(9,7,20,0.6) 100%)`,
          clipPath: "polygon(5% 0, 100% 0, 100% 100%, 0 100%)",
        }}
      />

      {/* ---- Layer 2: Buttons + Logo + text ---- */}
      <div className="relative z-30 flex flex-col items-center gap-6">
        {/* Logo */}
        <h1
          ref={logoRef}
          className="text-6xl sm:text-7xl font-bold tracking-wider"
          style={{
            fontFamily: "'Centrion', var(--font-space-grotesk), sans-serif",
            color: "#ffffff",
            textShadow:
              "0 0 20px rgba(0,240,255,0.5), 0 0 40px rgba(0,240,255,0.25), 0 0 80px rgba(0,240,255,0.1)",
          }}
        >
          CSAU
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="text-[11px] tracking-[0.5em] uppercase"
          style={{
            fontFamily: "'Centrion', var(--font-geist-mono), monospace",
            color: "rgba(0,240,255,0.5)",
          }}
        >
          THE CYBERPUNK REALM
        </p>

        {/* Progress bar */}
        {phase === "loading" && (
          <div
            ref={progressRef}
            className="w-64 flex flex-col items-center gap-3 mt-6"
          >
            <div className="w-full h-[1px] bg-white/10 overflow-hidden rounded-full">
              <div
                className="h-full transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #00f0ff, #ff00aa)",
                  boxShadow: "0 0 10px rgba(0,240,255,0.5)",
                }}
              />
            </div>
            <span
              className="text-xs tracking-[0.3em] tabular-nums"
              style={{
                fontFamily: "'Centrion', var(--font-geist-mono), monospace",
                color: "rgba(232,228,220,0.4)",
              }}
            >
              {String(progress).padStart(3, "0")}
            </span>
          </div>
        )}

        {/* Theme chooser */}
        {phase === "theme-select" && (
          <div
            ref={themeRef}
            className="flex flex-col items-center gap-8 mt-8"
            style={{ opacity: 0 }}
          >
            <p
              className="text-base tracking-[0.25em] uppercase"
              style={{
                fontFamily: "'Centrion', var(--font-space-grotesk), sans-serif",
                color: "rgba(232,228,220,0.5)",
              }}
            >
              Choose your realm
            </p>
            <div className="flex gap-16 sm:gap-24">
              <ThemeButton
                label="Light"
                sublabel="Dusty Realm"
                color="light"
                onClick={() => chooseTheme("light")}
              />
              <ThemeButton
                label="Dark"
                sublabel="Void Realm"
                color="dark"
                onClick={() => chooseTheme("dark")}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
