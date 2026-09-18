"use client";

import { useEffect, useRef, useState } from "react";
import {
  KoiSwimmer,
  drawKoi,
  drawLily,
  drawLotus,
  drawRipples,
  prefersReducedMotion,
  readPalette,
  startCanvasLoop,
  type Pt,
  type Ripple,
} from "./koi/koi";

/* ============================================================
   LANDING PAGE — still water, lily pads, a koi circling

   A semi-transparent pond veil sits over the shared water
   backdrop. A single koi circles slowly around the CSAU title,
   lily pads drift at the edges, and the ENTER control is a
   drop-stone with a lotus on it — pressing it (or touching the
   water anywhere) drops a ripple.
   ============================================================ */

interface LandingPageProps {
  onEnter?: () => void;
}

const PADS = [
  { fx: 0.1, fy: 0.17, k: 1.1, rot: 0.6 },
  { fx: 0.9, fy: 0.84, k: 1.0, rot: 3.4 },
  { fx: 0.84, fy: 0.2, k: 0.62, rot: 1.9 },
  { fx: 0.14, fy: 0.85, k: 0.7, rot: 5.0 },
  { fx: 0.95, fy: 0.5, k: 0.5, rot: 2.6 },
];

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [clock, setClock] = useState("--:--:--");
  const [brandVisible, setBrandVisible] = useState(false);
  const [taglineVisible, setTaglineVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const clockRef = useRef(0);

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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = prefersReducedMotion();
    const pal = readPalette();
    const ripples = ripplesRef.current;
    let koi: KoiSwimmer | null = null;
    let theta = -0.6;
    let nextAmbient = 1.2;
    let nextWake = 0;

    const draw = (ctx: CanvasRenderingContext2D, W: number, H: number, t: number, dt: number) => {
      clockRef.current = t;
      ctx.clearRect(0, 0, W, H);

      const L = Math.max(110, Math.min(190, W * 0.13));
      const col = colRef.current?.getBoundingClientRect();
      const cx = W / 2;
      const cy = col ? col.top + col.height / 2 : H / 2;
      const rx = Math.max(60, Math.min((col ? col.width / 2 : 200) + L * 0.55, W / 2 - L * 0.1));
      const ry = Math.max(80, Math.min((col ? col.height / 2 : 160) + L * 0.6, H / 2 - L * 0.55));
      const rMean = (rx + ry) / 2;
      const speed = 62;

      // lily pads
      const padBase = Math.max(26, Math.min(58, W * 0.04));
      PADS.forEach((p, i) => {
        const x = p.fx * W + Math.sin(t * 0.21 + i * 2) * 4;
        const y = p.fy * H + Math.cos(t * 0.17 + i) * 3;
        const r = padBase * p.k;
        drawLily(ctx, x, y, r, p.rot + Math.sin(t * 0.12 + i) * 0.08, pal);
        if (i === 0) drawLotus(ctx, x - r * 0.05, y, r * 0.62, t * 0.02, pal);
      });

      // koi orbit (steering head chases a point circling the title)
      if (!koi) {
        koi = new KoiSwimmer(cx + rx * Math.cos(theta), cy + ry * Math.sin(theta), theta + Math.PI / 2, L, speed);
      }
      if (!reduced) {
        theta += (speed * 0.92 * dt) / rMean;
        const target: Pt = { x: cx + rx * Math.cos(theta + 0.35), y: cy + ry * Math.sin(theta + 0.35) };
        koi.L = L;
        koi.step(dt, target, 1.6);
        if (t >= nextWake) {
          nextWake = t + 1.1;
          ripples.push({ x: koi.x, y: koi.y, born: t, max: L * 0.8, life: 2.6, strength: 0.5 });
        }
        if (t >= nextAmbient) {
          nextAmbient = t + 2.2 + Math.random() * 3;
          ripples.push({ x: Math.random() * W, y: Math.random() * H, born: t, max: 50 + Math.random() * 80, life: 3.4, strength: 0.4 });
        }
      }

      drawRipples(ctx, ripples, t, pal.ripple, 0.6);
      if (koi) drawKoi(ctx, koi.spine, L, t, pal, { beat: 4.2, sway: 0.9 });
    };

    return startCanvasLoop(canvas, draw, { still: reduced });
  }, []);

  const dropRipple = (x: number, y: number, big = false) => {
    const now = clockRef.current;
    ripplesRef.current.push({ x, y, born: now, max: big ? 240 : 130, life: big ? 2.4 : 2.2, strength: 1 });
    if (big) ripplesRef.current.push({ x, y, born: now + 0.25, max: 170, life: 2.2, strength: 0.8 });
  };

  return (
    <>
      <style>{`
        .ld-stone {
          position: relative;
          width: 104px;
          height: 104px;
          margin-top: 10px;
          border-radius: 50%;
          border: 1px solid var(--pond-300);
          background: var(--pond-700);
          color: var(--foam);
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          touch-action: manipulation;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .2em;
          text-indent: .2em;
          text-transform: uppercase;
          transition: background-color 150ms ease, transform 150ms var(--ease-out), opacity .4s ease;
        }
        .ld-stone:hover, .ld-stone:focus-visible { background: var(--signal-700); border-color: var(--foam); }
        .ld-stone:active { transform: scale(.94); }
        .ld-stone:focus-visible { outline: 2px solid var(--marker); outline-offset: 5px; }
        .ld-stone svg { display: block; transition: transform .3s var(--ease-out); }
        .ld-stone:hover svg { transform: translateY(-2px) rotate(8deg); }
        .ld-halo {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid var(--pond-300);
          pointer-events: none;
          opacity: 0;
          animation: ldHalo 3.6s ease-out infinite;
        }
        .ld-halo.b { animation-delay: 1.8s; }
        @keyframes ldHalo {
          0% { transform: scale(1); opacity: .55; }
          100% { transform: scale(2.3); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ld-halo { animation: none; opacity: .25; transform: scale(1.5); }
          .ld-halo.b { display: none; }
        }
        @media (max-width: 480px) {
          .ld-hud { font-size: 10px !important; letter-spacing: .14em !important; padding: 34px 5% 0 116px !important; }
          .ld-hud-r { display: none; }
          .ld-tag { font-size: 12px !important; letter-spacing: .16em !important; }
        }
      `}</style>
      <div
        className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
        style={{
          zIndex: 10,
          background: "color-mix(in srgb, var(--pond-950) 64%, transparent)",
        }}
        onPointerDown={(e) => {
          if ((e.target as Element).closest("button")) return;
          dropRipple(e.clientX, e.clientY);
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden />

        {/* HUD topbar */}
        <div className="ld-hud absolute top-0 left-0 right-0 flex justify-between pointer-events-none" style={{ padding: "30px 5% 0 124px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: ".2em", color: "var(--pond-300)", zIndex: 20 }}>
          <div>CSAU // CEG <span style={{ color: "var(--marker)" }}>·</span> ANNA UNIV</div>
          <div className="ld-hud-r">THE POND <span style={{ color: "var(--foam)" }}>AT NIGHT</span></div>
        </div>

        {/* ===== Hero center content ===== */}
        <div ref={colRef} className="relative text-center flex flex-col items-center" style={{ zIndex: 20, gap: 14, padding: "0 6%" }}>
          <div
            className="relative"
            style={{
              fontFamily: "'Ethnocentric', 'Sector034', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(44px, 13vw, 130px)",
              letterSpacing: ".04em",
              whiteSpace: "nowrap",
              color: "var(--foam)",
              lineHeight: 1,
            }}
          >
            {"CSAU..".split("").map((ch, i) => (
              <span
                key={i}
                className="inline-block relative"
                style={{
                  opacity: brandVisible ? 1 : 0,
                  transform: brandVisible ? "translateY(0)" : "translateY(22px)",
                  transition: `opacity .9s ease ${i * 0.11}s, transform 1.1s cubic-bezier(.2,.8,.2,1) ${i * 0.11}s`,
                  color: ch === "." ? "var(--marker)" : "var(--foam)",
                }}
              >
                {ch}
              </span>
            ))}
          </div>

          <div className="ld-tag" style={{ fontFamily: "'WildWorld', 'Syne', sans-serif", fontSize: 14, letterSpacing: ".25em", color: "var(--on-surface-variant)", textTransform: "uppercase", opacity: taglineVisible ? 1 : 0, transition: "opacity .6s ease" }}>
            BUILD <span style={{ color: "var(--pond-300)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11 }}>{"//"}</span> BREAK <span style={{ color: "var(--pond-300)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11 }}>{"//"}</span> SHIP
          </div>

          {/* Drop-stone — a lotus on a pebble; pressing it drops a ripple */}
          <button
            type="button"
            className="ld-stone"
            style={{ opacity: ctaVisible ? 1 : 0 }}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              dropRipple(r.left + r.width / 2, r.top + r.height / 2, true);
              onEnter?.();
            }}
          >
            <span className="ld-halo" aria-hidden />
            <span className="ld-halo b" aria-hidden />
            <svg width="34" height="34" viewBox="-20 -20 40 40" aria-hidden>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <ellipse key={i} cx="9" cy="0" rx="9" ry="3.6" transform={`rotate(${i * 45})`} fill="var(--lotus-300)" stroke="var(--foam)" strokeWidth=".6" opacity=".92" />
              ))}
              <circle r="3.2" fill="var(--marker)" />
            </svg>
            <span>Enter</span>
          </button>
        </div>

        {/* Footline */}
        <div className="absolute left-0 right-0 flex justify-between pointer-events-none" style={{ bottom: 26, padding: "0 5%", zIndex: 20, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: ".15em", color: "var(--pond-300)" }}>
          <span>CHENNAI, IN</span>
          <span>{clock}</span>
        </div>
      </div>
    </>
  );
}
