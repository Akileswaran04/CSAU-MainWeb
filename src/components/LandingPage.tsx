"use client";

import { useEffect, useState, useRef } from "react";

/* ============================================================
   LANDING PAGE — White Sculptural Tactility Theme

   White/off-white background, subtle rotating rings,
   bold Sector034 "CSAU.." with per-character glitch,
   scanlines, corner decorations, HUD topbar.
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

  useEffect(() => {
    const tick = () => { setClock(new Date().toLocaleTimeString("en-GB", { hour12: false })); };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setBrandVisible(true), 100);
    const t2 = setTimeout(() => setTaglineVisible(true), 600);
    const t3 = setTimeout(() => setCtaVisible(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      const delay = 2000 + Math.random() * 4000;
      timeout = setTimeout(() => {
        if (brandRef.current) {
          brandRef.current.classList.add("glitching");
          setTimeout(() => brandRef.current?.classList.remove("glitching"), 150);
        }
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <style>{`
        @keyframes ringPulse { 0%,100%{opacity:.25} 50%{opacity:.45} }
        @keyframes ringPulse2 { 0%,100%{opacity:.15} 50%{opacity:.35} }
        @keyframes glowPulse { 0%,100%{opacity:.08} 50%{opacity:.2} }
      `}</style>
      <div
        className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
        style={{
          zIndex: 10,
          background: `radial-gradient(ellipse at 50% 45%, var(--surface-container-low) 0%, transparent 55%), var(--background)`,
        }}
      >
        {/* Scanlines — light version */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "repeating-linear-gradient(to bottom, rgba(26,27,34,.015) 0px, rgba(26,27,34,.015) 1px, transparent 1px, transparent 4px)",
            mixBlendMode: "multiply",
          }}
        />

        {/* Corner decorations — subtle clay dots */}
        {[
          { top: "5%", left: "5%" }, { top: "5%", right: "5%" },
          { bottom: "5%", left: "5%" }, { bottom: "5%", right: "5%" },
        ].map((pos, i) => (
          <div key={i} className="absolute pointer-events-none" style={{ width: 60, height: 60, opacity: 0.5, zIndex: 20, ...pos }}>
            <span className="corner-dot absolute" style={{ top: i < 2 ? 0 : undefined, bottom: i >= 2 ? 0 : undefined, left: i % 2 === 0 ? 0 : undefined, right: i % 2 === 1 ? 0 : undefined, background: "var(--outline-variant)", boxShadow: "0 0 4px rgba(119,118,123,0.2)" }} />
            <span className="corner-dot absolute" style={{ top: i < 2 ? 0 : undefined, bottom: i >= 2 ? 0 : undefined, left: i % 2 === 0 ? 16 : undefined, right: i % 2 === 1 ? 16 : undefined, background: "var(--outline-variant)", boxShadow: "0 0 4px rgba(119,118,123,0.2)" }} />
          </div>
        ))}

        {/* HUD topbar */}
        <div className="absolute top-0 left-0 right-0 flex justify-between pointer-events-none" style={{ padding: "24px 5%", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, letterSpacing: ".2em", color: "var(--outline)", zIndex: 20 }}>
          <div>CSAU // CEG <span style={{ color: "var(--primary-container)" }}>·</span> ANNA UNIV</div>
          <div>SYS <span style={{ color: "var(--on-surface-variant)" }}>ONLINE</span></div>
        </div>

        {/* ===== Rotating Rings ===== */}
        <div className="absolute" style={{ zIndex: 10, top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(70vw, 520px)", height: "min(70vw, 520px)" }}>
          {/* Center glow */}
          <div className="absolute rounded-full" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "40%", height: "40%", background: "radial-gradient(circle, rgba(39,39,42,.04) 0%, transparent 70%)", animation: "glowPulse 4s ease-in-out infinite" }} />

          {/* Outer ring — thick with tick marks */}
          <div className="absolute inset-0" style={{ animation: "spin 30s linear infinite" }}>
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <circle cx="200" cy="200" r="180" fill="none" stroke="var(--outline-variant)" strokeWidth="2" strokeDasharray="18 8 4 8 50 12 8 12 100 18" opacity=".5" />
              <circle cx="200" cy="200" r="168" fill="none" stroke="var(--outline-variant)" strokeWidth=".6" strokeDasharray="3 8" opacity=".3" />
              {Array.from({ length: 24 }, (_, i) => {
                const a = (i * 15 * Math.PI) / 180;
                return <line key={i} x1={200 + 174 * Math.cos(a)} y1={200 + 174 * Math.sin(a)} x2={200 + 186 * Math.cos(a)} y2={200 + 186 * Math.sin(a)} stroke="var(--outline-variant)" strokeWidth={i % 3 === 0 ? "1.5" : ".6"} opacity={i % 3 === 0 ? ".4" : ".2"} />;
              })}
            </svg>
          </div>

          {/* Middle ring — reverse */}
          <div className="absolute inset-0" style={{ animation: "spinReverse 42s linear infinite" }}>
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <circle cx="200" cy="200" r="145" fill="none" stroke="var(--outline)" strokeWidth="1.8" strokeDasharray="4 12 28 10 3 14 80 20" opacity=".3" />
              <circle cx="200" cy="200" r="135" fill="none" stroke="var(--outline-variant)" strokeWidth=".5" strokeDasharray="2 10" opacity=".2" />
            </svg>
          </div>

          {/* Inner ring — pulse */}
          <div className="absolute inset-0" style={{ animation: "spin 56s linear infinite" }}>
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <circle cx="200" cy="200" r="110" fill="none" stroke="var(--outline-variant)" strokeWidth="1" strokeDasharray="6 16 2 16 40 8" opacity=".25" style={{ animation: "ringPulse 5s ease-in-out infinite" }} />
            </svg>
          </div>

          {/* Innermost ring */}
          <div className="absolute inset-0" style={{ animation: "spinReverse 68s linear infinite" }}>
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <circle cx="200" cy="200" r="80" fill="none" stroke="var(--outline-variant)" strokeWidth=".6" strokeDasharray="2 12" opacity=".2" style={{ animation: "ringPulse2 6s ease-in-out infinite" }} />
            </svg>
          </div>
        </div>

        {/* ===== Hero center content ===== */}
        <div className="relative text-center flex flex-col items-center w-full" style={{ zIndex: 20, gap: 16, padding: "0 12%" }}>
          {/* Brand word — BOLD Sector034 with glitch */}
          <div ref={brandRef} className="relative" style={{ fontFamily: "'Ethnocentric', 'Sector034', sans-serif", fontWeight: 900, fontSize: "clamp(60px, 10vw, 130px)", letterSpacing: ".04em", color: "var(--on-surface)", opacity: brandVisible ? 1 : 0, transform: brandVisible ? "translateY(0)" : "translateY(18px)", transition: "opacity .4s ease, transform .4s ease", lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,.06), 0 0 40px rgba(0,0,0,.02)" }}>
            {"CSAU..".split("").map((ch, i) => (
              <span key={i} className="glitch-char inline-block relative" data-text={ch} style={{ opacity: brandVisible ? 1 : 0, transform: brandVisible ? "translateY(0)" : "translateY(18px)", transition: `opacity .3s ease ${i * 0.08}s, transform .3s ease ${i * 0.08}s`, color: ch === "." ? "var(--on-surface-variant)" : "var(--on-surface)" }}>
                {ch}
              </span>
            ))}
          </div>

          {/* Tagline */}
          <div style={{ fontFamily: "'WildWorld', 'Syne', sans-serif", fontSize: 14, letterSpacing: ".25em", color: "var(--on-surface-variant)", textTransform: "uppercase", opacity: taglineVisible ? 1 : 0, transition: "opacity .6s ease" }}>
            CODE <span style={{ color: "var(--outline)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11 }}>//</span> BUILD <span style={{ color: "var(--outline)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11 }}>//</span> BREAK
          </div>

          {/* Enter button — clay style */}
          <button onClick={onEnter} className="relative group mt-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, letterSpacing: ".2em", color: "var(--on-surface-variant)", border: "1px solid var(--outline-variant)", padding: "10px 22px", background: "var(--surface-container-lowest)", cursor: "pointer", opacity: ctaVisible ? 1 : 0, transition: "opacity .6s ease, border-color .3s, color .3s, box-shadow .3s", borderRadius: 999, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary-container)"; e.currentTarget.style.color = "var(--on-surface)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--outline-variant)"; e.currentTarget.style.color = "var(--on-surface-variant)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)"; }}>
            ENTER SYSTEM »
          </button>
        </div>

        {/* Footline */}
        <div className="absolute left-0 right-0 flex justify-between pointer-events-none" style={{ bottom: 26, padding: "0 5%", zIndex: 20, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, letterSpacing: ".15em", color: "var(--outline)" }}>
          <span>CHENNAI, IN</span>
          <span>{clock}</span>
        </div>
      </div>
    </>
  );
}
