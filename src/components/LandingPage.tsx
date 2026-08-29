"use client";

import { useEffect, useState, useRef } from "react";

/* ============================================================
   LANDING PAGE — Dark System View

   Dark background, neon cyan rotating rings with tick marks,
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
          setTimeout(() => brandRef.current?.classList.remove("glitching"), 300);
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
        @font-face {
          font-family: 'Sector034';
          src: url('/fonts/sector-034/sector_034.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        @keyframes ringPulse { 0%,100%{opacity:.35} 50%{opacity:.65} }
        @keyframes ringPulse2 { 0%,100%{opacity:.2} 50%{opacity:.5} }
        @keyframes glowPulse { 0%,100%{opacity:.15} 50%{opacity:.4} }
      `}</style>
      <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden" style={{ zIndex: 10, background: "radial-gradient(ellipse at 50% 45%,#17102b 0%,transparent 55%),repeating-linear-gradient(135deg,#0a0b16 0 2px,#050507 2px 90px),repeating-linear-gradient(45deg,#0a0b16 0 2px,#050507 2px 90px),#050507" }}>

        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "repeating-linear-gradient(to bottom,rgba(0,240,255,.025) 0px,rgba(0,240,255,.025) 1px,transparent 1px,transparent 3px)", mixBlendMode: "screen" }} />

        {/* Corner decorations */}
        {[
          { top: "5%", left: "5%" }, { top: "5%", right: "5%" },
          { bottom: "5%", left: "5%" }, { bottom: "5%", right: "5%" },
        ].map((pos, i) => (
          <div key={i} className="absolute pointer-events-none" style={{ width: 60, height: 60, opacity: 0.4, zIndex: 20, ...pos }}>
            <span className="corner-dot absolute" style={{ top: i < 2 ? 0 : undefined, bottom: i >= 2 ? 0 : undefined, left: i % 2 === 0 ? 0 : undefined, right: i % 2 === 1 ? 0 : undefined, background: "#00f0ff", boxShadow: "0 0 6px #00f0ff" }} />
            <span className="corner-dot absolute" style={{ top: i < 2 ? 0 : undefined, bottom: i >= 2 ? 0 : undefined, left: i % 2 === 0 ? 16 : undefined, right: i % 2 === 1 ? 16 : undefined, background: "#00f0ff", boxShadow: "0 0 6px #00f0ff" }} />
          </div>
        ))}

        {/* HUD topbar */}
        <div className="absolute top-0 left-0 right-0 flex justify-between pointer-events-none" style={{ padding: "24px 5%", fontFamily: "'Plus Jakarta Sans', monospace", fontSize: 11, letterSpacing: ".2em", color: "#5c6190", zIndex: 20 }}>
          <div>CSAU // CEG <span style={{ color: "#00f0ff" }}>·</span> ANNA UNIV</div>
          <div>SYS <span style={{ color: "#00f0ff" }}>ONLINE</span></div>
        </div>

        {/* ===== Rotating Rings ===== */}
        <div className="absolute" style={{ zIndex: 10, top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(70vw, 520px)", height: "min(70vw, 520px)" }}>
          {/* Center glow */}
          <div className="absolute rounded-full" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "40%", height: "40%", background: "radial-gradient(circle, rgba(0,240,255,.06) 0%, transparent 70%)", animation: "glowPulse 4s ease-in-out infinite" }} />

          {/* Outer ring — thick with tick marks */}
          <div className="absolute inset-0" style={{ animation: "spin 30s linear infinite" }}>
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <circle cx="200" cy="200" r="180" fill="none" stroke="#00f0ff" strokeWidth="2" strokeDasharray="18 8 4 8 50 12 8 12 100 18" opacity=".45" />
              <circle cx="200" cy="200" r="168" fill="none" stroke="#00f0ff" strokeWidth=".6" strokeDasharray="3 8" opacity=".25" />
              {Array.from({ length: 24 }, (_, i) => {
                const a = (i * 15 * Math.PI) / 180;
                return <line key={i} x1={200 + 174 * Math.cos(a)} y1={200 + 174 * Math.sin(a)} x2={200 + 186 * Math.cos(a)} y2={200 + 186 * Math.sin(a)} stroke="#00f0ff" strokeWidth={i % 3 === 0 ? "1.5" : ".6"} opacity={i % 3 === 0 ? ".35" : ".15"} />;
              })}
            </svg>
          </div>

          {/* Middle ring — reverse */}
          <div className="absolute inset-0" style={{ animation: "spinReverse 42s linear infinite" }}>
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <circle cx="200" cy="200" r="145" fill="none" stroke="#ff2b8f" strokeWidth="1.8" strokeDasharray="4 12 28 10 3 14 80 20" opacity=".35" />
              <circle cx="200" cy="200" r="135" fill="none" stroke="#00f0ff" strokeWidth=".5" strokeDasharray="2 10" opacity=".2" />
            </svg>
          </div>

          {/* Inner ring — pulse */}
          <div className="absolute inset-0" style={{ animation: "spin 56s linear infinite" }}>
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <circle cx="200" cy="200" r="110" fill="none" stroke="#00f0ff" strokeWidth="1" strokeDasharray="6 16 2 16 40 8" opacity=".25" style={{ animation: "ringPulse 5s ease-in-out infinite" }} />
            </svg>
          </div>

          {/* Innermost ring */}
          <div className="absolute inset-0" style={{ animation: "spinReverse 68s linear infinite" }}>
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <circle cx="200" cy="200" r="80" fill="none" stroke="#00f0ff" strokeWidth=".6" strokeDasharray="2 12" opacity=".2" style={{ animation: "ringPulse2 6s ease-in-out infinite" }} />
            </svg>
          </div>
        </div>

        {/* ===== Hero center content ===== */}
        <div className="relative text-center flex flex-col items-center w-full" style={{ zIndex: 20, gap: 16, padding: "0 12%" }}>
          {/* Brand word — BOLD Sector034 with glitch */}
          <div ref={brandRef} className="relative" style={{ fontFamily: "'Sector034', sans-serif", fontWeight: 400, fontSize: "clamp(52px, 8vw, 110px)", letterSpacing: ".08em", color: "#f2f4ff", opacity: brandVisible ? 1 : 0, transform: brandVisible ? "translateY(0)" : "translateY(18px)", transition: "opacity .4s ease, transform .4s ease", textShadow: "0 0 30px rgba(0,240,255,.4)", lineHeight: 1 }}>
            {"CSAU..".split("").map((ch, i) => (
              <span key={i} className="glitch-char inline-block relative" data-text={ch} style={{ opacity: brandVisible ? 1 : 0, transform: brandVisible ? "translateY(0)" : "translateY(18px)", transition: `opacity .3s ease ${i * 0.08}s, transform .3s ease ${i * 0.08}s`, color: ch === "." ? "#ff2b8f" : "#f2f4ff" }}>
                {ch}
              </span>
            ))}
          </div>

          {/* Tagline */}
          <div style={{ fontFamily: "'Plus Jakarta Sans', monospace", fontSize: 11, letterSpacing: ".35em", color: "#5c6190", textTransform: "uppercase", opacity: taglineVisible ? 1 : 0, transition: "opacity .6s ease" }}>
            CODE <span style={{ color: "#00f0ff" }}>//</span> BUILD <span style={{ color: "#00f0ff" }}>//</span> BREAK
          </div>

          {/* Enter button — neon border */}
          <button onClick={onEnter} className="relative group mt-4" style={{ fontFamily: "'Plus Jakarta Sans', monospace", fontSize: 11, letterSpacing: ".2em", color: "#cdd3ef", border: "1px solid #2a2d45", padding: "10px 22px", background: "rgba(14,15,26,.5)", cursor: "pointer", opacity: ctaVisible ? 1 : 0, transition: "opacity .6s ease, border-color .3s, color .3s, box-shadow .3s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00f0ff"; e.currentTarget.style.color = "#00f0ff"; e.currentTarget.style.boxShadow = "0 0 14px rgba(0,240,255,.5) inset, 0 0 20px rgba(0,240,255,.15)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2d45"; e.currentTarget.style.color = "#cdd3ef"; e.currentTarget.style.boxShadow = "none"; }}>
            ENTER SYSTEM »
          </button>
        </div>

        {/* Footline */}
        <div className="absolute left-0 right-0 flex justify-between pointer-events-none" style={{ bottom: 26, padding: "0 5%", zIndex: 20, fontFamily: "'Plus Jakarta Sans', monospace", fontSize: 10, letterSpacing: ".15em", color: "#5c6190" }}>
          <span>CHENNAI, IN</span>
          <span>{clock}</span>
        </div>
      </div>
    </>
  );
}
