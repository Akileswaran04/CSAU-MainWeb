"use client";

import AstronautScene from "./AstronautScene";
import DestGlyph from "./DestGlyph";
import { DESTINATIONS, destFor } from "@/lib/destinations";
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, readPalette, startCanvasLoop } from "./space/space2d";

/* ============================================================
   LOADING OVERLAY - the jump between pages

   Travelling from one route to another is a jump. Stars stream out
   from a vanishing point; things cross the lane on their own lines
   (two fighters in opposite directions, planets swelling past the
   edges); a reticle turns around the word in the middle; a status
   line steps through the jump (aligning, charging, crossing,
   arriving) and a segmented charge bar fills below.

   When the destination has painted the overlay is told to end
   (phase === "ending"): the streaks slow to a drift, the bar
   completes and the whole thing fades over ~1.2s.

   Reduced motion: one still frame of the field, no movement.
   ============================================================ */

interface Star {
  a: number; // direction, radians
  r: number; // distance from the centre, 0..1
  v: number; // speed
  hot: boolean;
}

interface Fighter {
  x: number; // 0..1 across the screen
  y: number; // 0..1 down the screen
  dir: 1 | -1;
  v: number;
}

interface Planet {
  a: number;
  r: number; // 0..1 from the centre, growing
  v: number;
}

const STEPS = ["Aligning", "Charging the drive", "Crossing the void", "Approach"];
const SEGMENTS = 12;

export default function LoadingOverlay({ phase, href = "/" }: { phase: "loading" | "ending"; href?: string }) {
  const dest = destFor(href);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speed = useRef(1);
  const [step, setStep] = useState(0);
  const [charge, setCharge] = useState(0);

  useEffect(() => {
    speed.current = phase === "ending" ? 0.1 : 1;
  }, [phase]);

  /* status line and charge bar: they advance while loading and complete when it ends */
  useEffect(() => {
    if (phase === "ending") return;
    const id = window.setInterval(() => {
      setStep((s) => Math.min(STEPS.length - 2, s + 1));
      setCharge((c) => Math.min(SEGMENTS - 2, c + 1));
    }, 620);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = prefersReducedMotion();
    const pal = readPalette();
    let s = 12345;
    const rnd = () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
    const stars: Star[] = Array.from({ length: 220 }, () => ({
      a: rnd() * Math.PI * 2,
      r: 0.03 + rnd() * 0.97,
      v: 0.35 + rnd() * 0.9,
      hot: rnd() > 0.93,
    }));
    const fighters: Fighter[] = [
      { x: -0.2, y: 0.2, dir: 1, v: 0.34 },
      { x: 1.2, y: 0.74, dir: -1, v: 0.42 },
    ];
    const planets: Planet[] = [
      { a: 0.55, r: 0.15, v: 0.22 },
      { a: 3.5, r: 0.6, v: 0.18 },
    ];
    let ramp = 0;

    /* a top-down fighter: fuselage, four wings in an X, twin engine glow */
    const drawFighter = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, dir: 1 | -1, t: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      ctx.strokeStyle = pal.starlight;
      ctx.fillStyle = pal.void;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(size * 1.5, 0);
      ctx.lineTo(-size * 0.9, -size * 0.16);
      ctx.lineTo(-size * 0.9, size * 0.16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = pal.dim;
      ctx.beginPath();
      for (const sy of [-1, 1]) {
        ctx.moveTo(-size * 0.1, sy * size * 0.08);
        ctx.lineTo(-size * 0.75, sy * size * 0.85);
        ctx.moveTo(size * 0.1, sy * size * 0.05);
        ctx.lineTo(-size * 0.4, sy * size * 0.5);
      }
      ctx.stroke();
      // engine flames
      ctx.fillStyle = Math.sin(t * 30) > 0 ? pal.lit : pal.signal;
      for (const sy of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(-size * 0.95, sy * size * 0.12, Math.max(1.5, size * 0.07), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const draw = (ctx: CanvasRenderingContext2D, W: number, H: number, t: number, dt: number) => {
      ctx.fillStyle = pal.void;
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H * 0.46;
      const maxR = Math.hypot(W, H) * 0.55;
      // the jump builds up over the first second
      ramp = Math.min(1, ramp + dt * 0.9);
      const k = reduced ? 0 : speed.current * (0.25 + 0.75 * ramp);
      ctx.lineCap = "round";

      // stars streaming out of the vanishing point
      for (const st of stars) {
        const prev = st.r;
        st.r += dt * st.v * k * (0.12 + st.r * 1.4);
        if (st.r > 1.05) {
          st.r = 0.02 + rnd() * 0.05;
          st.a = rnd() * Math.PI * 2;
        }
        const r0 = (reduced ? st.r * 0.94 : prev) * maxR;
        const r1 = st.r * maxR;
        const trail = Math.max(1, (st.r - prev) * maxR * 2.6 + st.r * 8 * k);
        const x1 = cx + Math.cos(st.a) * r1;
        const y1 = cy + Math.sin(st.a) * r1;
        const x0 = cx + Math.cos(st.a) * Math.max(r0, r1 - trail);
        const y0 = cy + Math.sin(st.a) * Math.max(r0, r1 - trail);
        ctx.globalAlpha = Math.min(1, 0.15 + st.r * 1.1);
        ctx.strokeStyle = st.hot ? pal.lit : pal.starlight;
        ctx.lineWidth = 0.6 + st.r * 1.8;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (reduced) return;

      // planets swelling out past the edges: a dark disc with a lit rim
      for (const p of planets) {
        p.r += dt * p.v * k * (0.3 + p.r * 1.2);
        if (p.r > 1.35) {
          p.r = 0.12;
          p.a = rnd() * Math.PI * 2;
        }
        const px = cx + Math.cos(p.a) * p.r * maxR * 0.9;
        const py = cy + Math.sin(p.a) * p.r * maxR * 0.9;
        const pr = 6 + p.r * p.r * maxR * 0.34;
        ctx.globalAlpha = Math.min(1, p.r * 3);
        ctx.fillStyle = pal.void;
        ctx.strokeStyle = pal.dim;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // a crescent of light on the side facing the centre
        ctx.strokeStyle = pal.starlight;
        ctx.globalAlpha *= 0.6;
        ctx.beginPath();
        ctx.arc(px, py, pr * 0.94, p.a + Math.PI - 0.8, p.a + Math.PI + 0.8);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // fighters crossing the lane in opposite directions
      for (const f of fighters) {
        f.x += dt * f.v * f.dir * (0.3 + 0.7 * k);
        if (f.dir === 1 && f.x > 1.25) {
          f.x = -0.25;
          f.y = 0.15 + rnd() * 0.25;
        } else if (f.dir === -1 && f.x < -0.25) {
          f.x = 1.25;
          f.y = 0.6 + rnd() * 0.25;
        }
        drawFighter(ctx, f.x * W, f.y * H, Math.max(12, W * 0.03), f.dir, t);
      }
    };

    return startCanvasLoop(canvas, draw, { still: reduced });
  }, []);

  const ending = phase === "ending";
  // when the destination has painted, the status and bar complete on their own
  const shownStep = ending ? STEPS.length - 1 : step;
  const shownCharge = ending ? SEGMENTS : charge;

  return (
    <div
      className="rl-root"
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 650,
        background: "var(--space-black)",
        opacity: ending ? 0 : 1,
        transition: ending ? "opacity 1.1s ease .2s" : "none",
        overflow: "hidden",
      }}
    >
      <style>{`
        .rl-hud { position: absolute; left: 0; right: 0; pointer-events: none; color: var(--dim-300); font-family: var(--font-mono);
          font-size: 12px; letter-spacing: .22em; text-transform: uppercase; display: flex; justify-content: space-between; gap: 16px;
          padding: 0 var(--pg-x); }
        .rl-top { top: max(24px, env(safe-area-inset-top)); }
        .rl-top span:last-child { color: var(--starlight); }
        .rl-bottom { bottom: max(28px, env(safe-area-inset-bottom)); flex-direction: column; align-items: stretch; gap: 12px; }
        .rl-step { text-align: center; color: var(--starlight); letter-spacing: .26em; min-height: 1.4em; }
        .rl-bar { display: grid; grid-template-columns: repeat(${SEGMENTS}, 1fr); gap: 4px; }
        .rl-bar i { display: block; height: 6px; background: var(--hull-700); transition: background-color .25s ease; }
        .rl-bar i[data-on="true"] { background: var(--lit); }
        .rl-crew { position: absolute; left: 0; right: 0; top: 10%; display: flex; flex-direction: column; align-items: center; gap: 10px;
          text-align: center; pointer-events: none; padding: 0 var(--pg-x); }
        .rl-relay { display: flex; gap: clamp(6px, 2vw, 14px); margin-bottom: 14px; }
        .rl-hop { display: block; animation: rl-hop 1.7s ease-in-out infinite; }
        .rl-hop[data-dest="true"] { animation-name: rl-hop-dest; }
        @keyframes rl-hop { 0%, 100% { transform: translateY(0); opacity: .5; } 12% { transform: translateY(-9px); opacity: 1; } 24% { transform: translateY(0); opacity: .5; } }
        @keyframes rl-hop-dest { 0%, 100% { transform: translateY(0); } 12% { transform: translateY(-9px); } 24% { transform: translateY(0); } }
        .rl-pilot { animation: rl-float 3.2s ease-in-out infinite; }
        @keyframes rl-float { 50% { transform: translateY(-6px); } }
        .dg-orbit { animation: rl-turn 4.5s linear infinite; }
        .rl-to { font-family: var(--font-mono); font-size: 12px; letter-spacing: .3em; text-transform: uppercase; color: var(--dim-300); }
        .rl-dest { font-family: var(--font-display); font-size: clamp(26px, 8vw, 44px); letter-spacing: .12em; color: var(--starlight); }
        .rl-who { font-family: var(--font-mono); font-size: 13px; letter-spacing: .2em; text-transform: uppercase; color: var(--lit); }
        .rl-reticle { position: absolute; left: 50%; top: 46%; width: min(72vw, 360px); aspect-ratio: 1; transform: translate(-50%, -50%); pointer-events: none; }
        .rl-reticle svg { width: 100%; height: 100%; overflow: visible; }
        .rl-spin { transform-origin: 50px 50px; animation: rl-turn 7s linear infinite; }
        .rl-spin-r { transform-origin: 50px 50px; animation: rl-turn 11s linear infinite reverse; }
        @keyframes rl-turn { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .rl-spin, .rl-spin-r, .rl-hop, .rl-pilot, .dg-orbit { animation: none; } .rl-bar i { transition: none; } }
      `}</style>

      <canvas ref={canvasRef} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.35 }} />

      <AstronautScene />


      {/* the relay of places, settling on the destination */}
      <div className="rl-crew" aria-hidden>
        <div className="rl-relay">
          {DESTINATIONS.map((r, i) => (
            <span key={r.href} className="rl-hop" data-dest={r.href === dest.href} style={{ animationDelay: `${i * 0.28}s` }}>
              <DestGlyph kind={r.glyph} size={34} on={r.href === dest.href || ending} />
            </span>
          ))}
        </div>
        <div className="rl-pilot">
          <DestGlyph kind={dest.glyph} size={96} orbit />
        </div>
        <div className="rl-to">Now flying you to</div>
        <div className="rl-dest">{dest.label}</div>
        <div className="rl-who">{dest.sector}</div>
      </div>

      <div className="rl-hud rl-top" aria-hidden>
        <span>Jump drive</span>
        <span>{ending ? "Arrived" : "In flight"}</span>
      </div>

      <div className="rl-hud rl-bottom" aria-hidden>
        <div className="rl-step">{STEPS[shownStep]}</div>
        <div className="rl-bar">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <i key={i} data-on={i < shownCharge} />
          ))}
        </div>
      </div>

      <span className="sr-only">Loading the next page</span>
    </div>
  );
}
