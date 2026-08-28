"use client";

import { useEffect, useState, useRef } from "react";

/* ============================================================
   LANDING PAGE — From cursor-character.html
   
   Rotating concentric rings, "CSAU.." brand text with periodic
   glitch effect, tagline "CODE // BUILD // BREAK", enter button,
   live clock, corner decorations, HUD topbar.
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
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); } ;
  }, []);

  // Periodic glitch
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.5 && brandRef.current) {
        brandRef.current.classList.add("glitching");
        setTimeout(() => brandRef.current?.classList.remove("glitching"), 400);
      }
    }, 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ zIndex: 10, background: "#050507" }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 45%, #150e26 0%, transparent 55%),
            repeating-linear-gradient(135deg, #0a0b16 0 2px, #050507 2px 90px),
            repeating-linear-gradient(45deg, #0a0b16 0 2px, #050507 2px 90px)
          `,
        }}
      />
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "repeating-linear-gradient(to bottom, rgba(0,240,255,0.025) 0px, rgba(0,240,255,0.025) 1px, transparent 1px, transparent 3px)",
          mixBlendMode: "screen",
        }}
      />

      {/* Corner decorations */}
      {[
        { top: "5%", left: "5%" },
        { top: "5%", right: "5%" },
        { bottom: "5%", left: "5%" },
        { bottom: "5%", right: "5%" },
      ].map((pos, i) => (
        <div key={i} className="absolute pointer-events-none" style={{ width: 60, height: 60, opacity: 0.4, zIndex: 20, ...pos }}>
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
      <div className="absolute top-0 left-0 right-0 flex justify-between pointer-events-none"
        style={{ padding: "24px 5%", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: ".2em", color: "#5c6190", zIndex: 20 }}
      >
        <div>CSAU // CEG <span style={{ color: "#00f0ff" }}>·</span> ANNA UNIV</div>
        <div>SYS <span style={{ color: "#00f0ff" }}>ONLINE</span></div>
      </div>

      {/* Rotating rings */}
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
            <circle cx="200" cy="200" r="170" fill="none" stroke="#00f0ff" strokeWidth="1.4"
              strokeDasharray="14 10 2 10 40 8 6 10 90 14" opacity="0.55" />
            <circle cx="200" cy="200" r="150" fill="none" stroke="#00f0ff" strokeWidth="1"
              strokeDasharray="4 6" opacity="0.3" />
          </svg>
        </div>
        {/* Inner ring (reverse) */}
        <div className="absolute inset-0" style={{ animation: "spinReverse 46s linear infinite" }}>
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="200" cy="200" r="185" fill="none" stroke="#ff2b8f" strokeWidth="1"
              strokeDasharray="2 14 30 10 2 14 70 20" opacity="0.4" />
          </svg>
        </div>
      </div>

      {/* Hero center content */}
      <div className="relative text-center flex flex-col items-center w-full" style={{ zIndex: 20, gap: 12, padding: "0 12%" }}>
        {/* Brand word */}
        <div
          ref={brandRef}
          className="relative"
          data-text="CSAU.."
          style={{
            fontFamily: "'Zen Dots', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(34px, 6.4vw, 74px)",
            letterSpacing: ".08em",
            color: "#f2f4ff",
            textShadow: "0 0 30px rgba(0,240,255,.4)",
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
                <span style={{ color: "#ff2b8f", display: "inline-block", opacity: brandVisible ? 1 : 0, transform: brandVisible ? "scale(1)" : "scale(0)", transition: `opacity .2s ease ${0.4 + i * 0.1}s, transform .3s cubic-bezier(.5,1.8,.5,1) ${0.4 + i * 0.1}s` }}>
                  {ch}
                </span>
              ) : ch}
            </span>
          ))}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: ".35em",
            color: "#5c6190",
            textTransform: "uppercase",
            opacity: taglineVisible ? 1 : 0,
            transition: "opacity .6s ease",
          }}
        >
          CODE <span style={{ color: "#00f0ff" }}>//</span> BUILD <span style={{ color: "#00f0ff" }}>//</span> BREAK
        </div>

        {/* Enter button */}
        <button
          onClick={onEnter}
          className="relative group mt-2"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: ".2em",
            color: "#cdd3ef",
            border: "1px solid #2a2d45",
            padding: "10px 22px",
            background: "rgba(14,15,26,.5)",
            cursor: "pointer",
            opacity: ctaVisible ? 1 : 0,
            transition: "opacity .6s ease",
          }}
        >
          <span className="absolute inset-0 border border-transparent transition-all duration-300 group-hover:border-[#00f0ff] group-hover:shadow-[0_0_14px_rgba(0,240,255,.5)_inset]" />
          <span className="relative transition-colors group-hover:text-[#00f0ff]">ENTER SYSTEM »</span>
        </button>
      </div>

      {/* Footline */}
      <div
        className="absolute left-0 right-0 flex justify-between pointer-events-none"
        style={{ bottom: 26, padding: "0 5%", zIndex: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: ".15em", color: "#5c6190" }}
      >
        <span>CHENNAI, IN</span>
        <span>{clock}</span>
      </div>
    </div>
  );
}
