"use client";

import { useEffect, useRef, useState } from "react";
import {
  KOI_SEGS,
  drawKoi,
  drawRipples,
  prefersReducedMotion,
  readPalette,
  spineFromPath,
  startCanvasLoop,
  type Ripple,
} from "./koi/koi";

/* ============================================================
   LOADING OVERLAY — route loader for nav-bar / CTA navigation.

   A single koi swims a slow circle in dark water, leaving
   ripple rings; a quiet "LOADING" line breathes beneath it.
   Exit choreography (phase === "ending"), 1.4s in total:
     word fades -> koi + ripples fade -> whole overlay fades.
   ============================================================ */

export default function LoadingOverlay({ phase }: { phase: "loading" | "ending" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState(0);

  /* ---- End choreography: word fades → koi fades → whole fade ---- */
  useEffect(() => {
    if (phase !== "ending") return;
    setStage(1);
    const t2 = setTimeout(() => setStage(2), 520);
    const t3 = setTimeout(() => setStage(3), 980);
    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [phase]);

  /* ---- Koi circling in the pond ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = prefersReducedMotion();
    const pal = readPalette();
    const ripples: Ripple[] = [];
    let nextWake = 0;
    let nextCentre = 0.4;

    const draw = (ctx: CanvasRenderingContext2D, W: number, H: number, t: number) => {
      ctx.clearRect(0, 0, W, H);
      const size = Math.min(Math.min(W, H) * 0.64, 340);
      const cx = W / 2;
      const cy = H * 0.44;
      const R = size * 0.28;
      const L = Math.max(110, size * 0.46);
      const omega = 0.62; // rad/s
      const ang = reduced ? 0.9 : t * omega;
      const path = (s: number) => {
        const a = s / R - Math.PI / 2;
        return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
      };
      const s = ang * R;
      const head = path(s);

      if (!reduced) {
        if (t >= nextWake) {
          nextWake = t + 0.55;
          ripples.push({ x: head.x, y: head.y, born: t, max: size * 0.42, life: 2.2, strength: 0.6 });
        }
        if (t >= nextCentre) {
          nextCentre = t + 1.8;
          ripples.push({ x: cx, y: cy, born: t, max: size * 0.62, life: 3.2, strength: 0.4 });
        }
      } else if (ripples.length === 0) {
        ripples.push({ x: cx, y: cy, born: -0.9, max: size * 0.55, life: 2, strength: 0.6 });
        ripples.push({ x: head.x, y: head.y, born: -1.2, max: size * 0.3, life: 2, strength: 0.5 });
      }

      drawRipples(ctx, ripples, reduced ? 0 : t, pal.ripple, 0.6);
      drawKoi(ctx, spineFromPath(path, s, L, KOI_SEGS), L, t, pal, { beat: 5.2, sway: 0.85 });
    };

    return startCanvasLoop(canvas, draw, { still: reduced });
  }, []);

  const rootClass =
    "rl-root" +
    (stage >= 1 ? " rl-x1" : "") +
    (stage >= 2 ? " rl-x2" : "") +
    (stage >= 3 ? " rl-x3" : "");

  return (
    <div className={rootClass} role="status" aria-live="polite">
      <style>{`
        .rl-root {
          position: fixed;
          inset: 0;
          z-index: 650;
          background: var(--pond-950);
          overflow: hidden;
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
          -webkit-font-smoothing: antialiased;
        }
        .rl-ringbox {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          transition: opacity .4s ease .05s;
        }
        .rl-word {
          position: absolute;
          left: 50%;
          top: calc(44% + min(32vmin, 170px) + 44px);
          transform: translateX(-50%);
          display: flex;
          font-size: 12px;
          letter-spacing: .5em;
          text-transform: uppercase;
          color: var(--pond-300);
          white-space: nowrap;
          margin-left: .25em; /* compensate trailing letter-spacing */
          animation: rlWordBreathe 3.6s ease-in-out infinite;
          transition: opacity .4s ease;
        }
        .rl-word .rl-accent { color: var(--marker); }
        @keyframes rlWordBreathe {
          0%, 100% { opacity: .65; }
          50% { opacity: 1; }
        }
        .rl-sr {
          position: absolute;
          width: 1px; height: 1px;
          overflow: hidden;
          clip-path: inset(50%);
          white-space: nowrap;
        }
        @media (prefers-reduced-motion: reduce) { .rl-word { animation: none; } }

        /* ---- Exit stages ---- */
        .rl-x1 .rl-word { opacity: 0; }
        .rl-x2 .rl-ringbox { opacity: 0; }
        .rl-x3 { opacity: 0; transition: opacity .42s ease; }
      `}</style>

      <canvas ref={canvasRef} className="rl-ringbox" aria-hidden />

      <span className="rl-sr">Loading</span>
      <div className="rl-word" aria-hidden>
        {"LOADING".split("").map((ch, i) => (
          <span key={i} className={i >= 4 ? "rl-accent" : undefined}>
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
}
