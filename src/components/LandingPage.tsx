"use client";

import { useEffect, useState, useRef } from "react";

/* ============================================================
   LANDING PAGE — Sculptural Tactility version

   Rotating concentric rings, "CSAU.." brand text with periodic
   glitch effect, tagline "CODE // BUILD // BREAK", enter button,
   live clock, corner decorations, HUD topbar.

   Claymorphism aesthetic: matte surfaces, soft shadows, editorial feel.
   ============================================================ */

interface LandingPageProps {
  onEnter?: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [clock, setClock] = useState("--:--:--");
  const [brandVisible, setBrandVisible] = useState(false);
  const [taglineVisible, setTaglineVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);
  const brandRef = useRef<HTMLDivElement>(null);

  // Clock
  useEffect(() => {
    const tick = () => {
      setClock(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Reveal animation
  useEffect(() => {
    const t1 = setTimeout(() => setBrandVisible(true), 100);
    const t2 = setTimeout(() => setTaglineVisible(true), 600);
    const t3 = setTimeout(() => setCtaVisible(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Periodic glitch (subtle for light theme)
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.4 && brandRef.current) {
        brandRef.current.classList.add("glitching");
        setTimeout(() => brandRef.current?.classList.remove("glitching"), 400);
      }
    }, 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ zIndex: 10, background: "var(--background)" }}
    >
      {/* Background — soft radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 45%, var(--surface-container-low) 0%, transparent 55%),
            linear-gradient(180deg, var(--background) 0%, var(--surface) 100%)
          `,
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--outline-variant) 1px, transparent 1px), linear-gradient(90deg, var(--outline-variant) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          opacity: 0.1,
          maskImage: "radial-gradient(ellipse at 50% 50%, black 0%, transparent 60%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 0%, transparent 60%)",
        }}
      />

      {/* Corner decorations — clay dots */}
      {[
        { top: "5%", left: "5%" },
        { top: "5%", right: "5%" },
        { bottom: "5%", left: "5%" },
        { bottom: "5%", right: "5%" },
      ].map((pos, i) => (
        <div key={i} className="absolute pointer-events-none" style={{ width: 60, height: 60, opacity: 0.3, zIndex: 20, ...pos }}>
          <span
            className="corner-dot absolute"
            style={{
              top: i < 2 ? 0 : undefined,
              bottom: i >= 2 ? 0 : undefined,
              left: i % 2 === 0 ? 0 : undefined,
              right: i % 2 === 1 ? 0 : undefined,
            }}
          />
          <span
            className="corner-dot absolute"
            style={{
              top: i < 2 ? 0 : undefined,
              bottom: i >= 2 ? 0 : undefined,
              left: i % 2 === 0 ? 16 : undefined,
              right: i % 2 === 1 ? 16 : undefined,
            }}
          />
        </div>
      ))}

      {/* HUD topbar */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-between pointer-events-none"
        style={{
          padding: "24px 5%",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.1em",
          color: "var(--outline)",
          zIndex: 20,
        }}
      >
        <div>CSAU // CEG <span style={{ color: "var(--primary-container)" }}>·</span> ANNA UNIV</div>
        <div>SYS <span style={{ color: "var(--primary)" }}>ONLINE</span></div>
      </div>

      {/* Rotating rings — muted for light theme */}
      <div
        className="absolute"
        style={{
          zIndex: 10,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(60vw, 460px)",
          height: "min(60vw, 460px)",
        }}
      >
        {/* Outer ring */}
        <div className="absolute inset-0" style={{ animation: "spin 34s linear infinite" }}>
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="200" cy="200" r="170" fill="none" stroke="var(--outline-variant)" strokeWidth="1.2"
              strokeDasharray="14 10 2 10 40 8 6 10 90 14" opacity="0.4" />
            <circle cx="200" cy="200" r="150" fill="none" stroke="var(--outline-variant)" strokeWidth="0.8"
              strokeDasharray="4 6" opacity="0.25" />
          </svg>
        </div>
        {/* Inner ring (reverse) */}
        <div className="absolute inset-0" style={{ animation: "spinReverse 46s linear infinite" }}>
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="200" cy="200" r="185" fill="none" stroke="var(--primary-container)" strokeWidth="0.8"
              strokeDasharray="2 14 30 10 2 14 70 20" opacity="0.3" />
          </svg>
        </div>
      </div>

      {/* Hero center content */}
      <div className="relative text-center flex flex-col items-center w-full" style={{ zIndex: 20, gap: 16, padding: "0 12%" }}>
        {/* Brand word */}
        <div
          ref={brandRef}
          className="relative"
          data-text="CSAU.."
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(36px, 6.4vw, 80px)",
            letterSpacing: "-0.02em",
            color: "var(--primary)",
            opacity: brandVisible ? 1 : 0,
            transform: brandVisible ? "translateY(0)" : "translateY(18px)",
            transition: "opacity .4s ease, transform .4s ease",
          }}
        >
          {"CSAU..".split("").map((ch, i) => (
            <span
              key={i}
              className="inline-block"
              style={{
                opacity: brandVisible ? 1 : 0,
                transform: brandVisible ? "translateY(0)" : "translateY(18px)",
                transition: `opacity .3s ease ${i * 0.08}s, transform .3s ease ${i * 0.08}s`,
              }}
            >
              {ch === "." ? (
                <span
                  style={{
                    color: "var(--primary-container)",
                    display: "inline-block",
                    opacity: brandVisible ? 1 : 0,
                    transform: brandVisible ? "scale(1)" : "scale(0)",
                    transition: `opacity .2s ease ${0.4 + i * 0.1}s, transform .3s cubic-bezier(.5,1.8,.5,1) ${0.4 + i * 0.1}s`,
                  }}
                >
                  {ch}
                </span>
              ) : (
                ch
              )}
            </span>
          ))}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--outline)",
            textTransform: "uppercase",
            opacity: taglineVisible ? 1 : 0,
            transition: "opacity .6s ease",
          }}
        >
          CODE <span style={{ color: "var(--primary-container)" }}>//</span> BUILD <span style={{ color: "var(--primary-container)" }}>//</span> BREAK
        </div>

        {/* Enter button — claymorphism */}
        <button
          onClick={onEnter}
          className="relative group mt-4"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "var(--on-primary)",
            background: "var(--primary)",
            border: "none",
            padding: "14px 32px",
            borderRadius: 999,
            cursor: "pointer",
            opacity: ctaVisible ? 1 : 0,
            transition: "opacity .6s ease, box-shadow 0.3s ease, transform 0.3s ease",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          ENTER SYSTEM »
        </button>
      </div>

      {/* Footline */}
      <div
        className="absolute left-0 right-0 flex justify-between pointer-events-none"
        style={{
          bottom: 26,
          padding: "0 5%",
          zIndex: 20,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.1em",
          color: "var(--outline)",
        }}
      >
        <span>CHENNAI, IN</span>
        <span>{clock}</span>
      </div>
    </div>
  );
}
