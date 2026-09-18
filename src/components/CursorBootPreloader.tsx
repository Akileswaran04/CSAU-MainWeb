"use client";

import { useEffect, useRef, useState } from "react";
import { UplinkLoader } from "./UplinkLoader";
import {
  drawKoi,
  drawRipples,
  prefersReducedMotion,
  readPalette,
  spineFromPath,
  startCanvasLoop,
  type KoiPalette,
  type Ripple,
} from "./koi/koi";

/* ============================================================
   BOOT PRELOADER — koi pond at night

   1. A dorsal-view koi swims across dark water, leaving widening
      ripple rings behind its head.
   2. As it passes under each letter of CSAU the letter surfaces
      out of the water (rise + fade) and drops its own ripple.
   3. A koi-swim progress cue (UplinkLoader) is driven by the
      swim AND real page loading (whichever is ahead wins).
   4. The stage fades to the landing only when BOTH the swim and
      the real load are done — onComplete contract unchanged.

   Reduced motion: still pond, word visible, short hold.
   ============================================================ */

interface CursorBootPreloaderProps {
  onComplete?: () => void;
}

const START_DELAY = 0.35; // s before the koi enters
const SWIM_SECONDS = 4.0; // s to cross the screen

export default function CursorBootPreloader({ onComplete }: CursorBootPreloaderProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const cancelledRef = useRef(false);

  // Combined progress (0-100) — max of swim + real loading
  const [displayProgress, setDisplayProgress] = useState(0);
  const animProgressRef = useRef(0);
  const loadProgressRef = useRef(0);
  const loadDoneRef = useRef(false);

  const pushProgress = () => {
    setDisplayProgress(Math.max(animProgressRef.current, loadProgressRef.current));
  };

  // ── Real loading tracker ──
  useEffect(() => {
    if (!visible) return;

    if (document.readyState === "complete") {
      loadProgressRef.current = 100;
      loadDoneRef.current = true;
      const id = requestAnimationFrame(() => setDisplayProgress(100));
      return () => cancelAnimationFrame(id);
    }

    let raf: number;

    const tick = () => {
      if (cancelledRef.current) return;

      if ((document.readyState as string) === "complete") {
        loadProgressRef.current = 100;
        loadDoneRef.current = true;
        pushProgress();
        return;
      }

      let loaded = 0;
      let total = 0;

      if (document.fonts) {
        const fonts = [...document.fonts];
        total += fonts.length;
        loaded += fonts.filter((f) => f.status === "loaded").length;
      }

      const imgs = document.querySelectorAll<HTMLImageElement>("img");
      total += imgs.length;
      loaded += [...imgs].filter((img) => img.complete && img.naturalWidth > 0).length;

      const docReady = document.readyState === "interactive" ? 15 : 0;
      const resourcePct = total > 0 ? (loaded / total) * 70 : 70;
      const pct = Math.min(100, Math.round(docReady + resourcePct));

      loadProgressRef.current = Math.max(loadProgressRef.current, pct);
      pushProgress();

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    const onLoad = () => {
      loadProgressRef.current = 100;
      loadDoneRef.current = true;
      pushProgress();
    };
    window.addEventListener("load", onLoad);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
    };
  }, [visible]);

  // ── The swim ──
  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    cancelledRef.current = false;

    const reduced = prefersReducedMotion();
    const pal: KoiPalette = readPalette();
    const letters = Array.from(wordRef.current?.querySelectorAll<HTMLElement>(".boot-char") ?? []);
    const revealed = letters.map(() => false);
    const ripples: Ripple[] = [];
    let nextWake = 0;
    let nextAmbient = 0.6;
    let finishing = false;
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };

    const reveal = (i: number, now: number, x: number, y: number, L: number) => {
      if (revealed[i]) return;
      revealed[i] = true;
      letters[i].classList.add("boot-char-in");
      ripples.push({ x, y, born: now, max: L * 1.1, life: 2.6, strength: 1 });
      if (revealed.every(Boolean) && capRef.current) capRef.current.style.opacity = "1";
    };

    const finish = async () => {
      if (finishing) return;
      finishing = true;
      await new Promise<void>((resolve) => {
        const poll = setInterval(() => {
          if (cancelledRef.current || loadDoneRef.current) {
            clearInterval(poll);
            resolve();
          }
        }, 100);
      });
      if (cancelledRef.current) return;
      if (reduced) await new Promise((r) => setTimeout(r, 500));
      stage.style.transition = "opacity .6s ease";
      stage.style.opacity = "0";
      await new Promise((r) => setTimeout(r, 600));
      if (!cancelledRef.current) {
        setVisible(false);
        onComplete?.();
      }
    };

    const draw = (ctx: CanvasRenderingContext2D, W: number, H: number, t: number) => {
      // pond
      ctx.fillStyle = pal.water;
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H * 0.5, 0, W / 2, H * 0.5, Math.max(W, H) * 0.7);
      g.addColorStop(0, "rgba(11,43,46,0.9)");
      g.addColorStop(1, "rgba(11,43,46,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      const L = Math.max(120, Math.min(230, W * 0.16));
      const col = colRef.current?.getBoundingClientRect();
      const wordRect = wordRef.current?.getBoundingClientRect();
      const baseY = (col ? col.bottom : H * 0.6) + L * 0.32;
      const amp = wordRect ? wordRect.height * 0.14 : 24;
      const total = W + L * 2.4;
      const speed = total / SWIM_SECONDS;
      const path = (s: number) => ({
        x: -L * 1.1 + s,
        y: baseY + amp * Math.sin((s / (W * 0.85)) * Math.PI * 2 + 0.6),
      });

      const s = reduced ? total * 0.72 : (t - START_DELAY) * speed;
      const head = path(s);

      if (!reduced && s > 0 && s < total) {
        if (t >= nextWake) {
          nextWake = t + 0.26;
          ripples.push({ x: head.x, y: head.y, born: t, max: L * 0.85, life: 2.1, strength: 0.7 });
        }
      }
      if (!reduced && t >= nextAmbient) {
        nextAmbient = t + 0.9 + rnd() * 1.4;
        ripples.push({ x: rnd() * W, y: rnd() * H, born: t, max: 40 + rnd() * 70, life: 2.8, strength: 0.35 });
      }

      // letters surface as the koi passes beneath
      letters.forEach((el, i) => {
        if (revealed[i]) return;
        const r = el.getBoundingClientRect();
        if (reduced || head.x > r.left + r.width / 2) {
          reveal(i, t, r.left + r.width / 2, r.top + r.height * 0.75, L);
        }
      });

      drawRipples(ctx, ripples, t, pal.ripple, 0.55);

      if (s > -L * 1.2 && s < total + L * 0.2) {
        drawKoi(ctx, spineFromPath(path, s, L), L, t, pal, { beat: 6.2, sway: 1 });
      }

      // progress from the swim
      const swim = reduced ? 1 : Math.max(0, Math.min(1, (t - START_DELAY) / SWIM_SECONDS));
      const next = Math.round(swim * 96);
      if (next !== animProgressRef.current) {
        animProgressRef.current = next;
        pushProgress();
      }
      if (swim >= 1 && !finishing && (reduced || t > START_DELAY + SWIM_SECONDS + 0.15)) {
        animProgressRef.current = 100;
        pushProgress();
        finish();
      }
    };

    const stop = startCanvasLoop(canvas, draw, { still: reduced });
    if (reduced) {
      // still mode draws once on resize; make sure letters/progress settle
      setTimeout(() => {
        if (!cancelledRef.current) {
          animProgressRef.current = 100;
          pushProgress();
          finish();
        }
      }, 900);
    }
    return () => {
      cancelledRef.current = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

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
        .boot-char { opacity: 0; transform: translateY(26px); }
        .boot-char-in { animation: bootSurface 1.3s cubic-bezier(.2,.8,.2,1) forwards; }
        @keyframes bootSurface {
          0%   { opacity: 0; transform: translateY(26px) scaleY(1.12); }
          55%  { opacity: .75; transform: translateY(-3px) scaleY(1); }
          100% { opacity: 1; transform: translateY(0) scaleY(1); }
        }
        .uplink-bar-wrap {
          position: absolute;
          bottom: max(5%, 28px);
          left: 50%;
          transform: translateX(-50%);
          width: min(86vw, 520px);
          z-index: 5;
          pointer-events: none;
          opacity: 0;
          animation: uplinkBarFadeIn 0.6s ease 0.3s forwards;
        }
        @keyframes uplinkBarFadeIn { to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .boot-char { opacity: 1; transform: none; }
          .boot-char-in { animation: none; }
        }
      `}</style>
      <div
        ref={stageRef}
        className="fixed inset-0 overflow-hidden"
        style={{
          zIndex: 9999,
          background: "var(--pond-950)",
          ["--on-surface" as string]: "var(--foam)",
          ["--on-surface-variant" as string]: "var(--pond-300)",
          ["--outline" as string]: "var(--pond-300)",
          ["--outline-variant" as string]: "var(--pond-700)",
        }}
        role="dialog"
        aria-label="Loading CSAU"
        aria-modal="true"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden />

        {/* CSAU word — surfaces as the koi passes */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 3, paddingBottom: "6vh" }}
        >
          <div ref={colRef} className="flex flex-col items-center" style={{ gap: 14 }}>
            <div
              ref={wordRef}
              className="flex"
              style={{
                fontFamily: "'Ethnocentric', 'Sector034', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(56px,14vw,200px)",
                letterSpacing: ".08em",
                lineHeight: 1,
                color: "var(--foam)",
              }}
            >
              {"CSAU".split("").map((ch, i) => (
                <span key={i} className="boot-char inline-block">
                  {ch}
                </span>
              ))}
            </div>
            <div
              ref={capRef}
              className="text-center"
              style={{
                maxWidth: "min(86vw, 560px)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                lineHeight: 1.6,
                letterSpacing: ".2em",
                color: "var(--pond-300)",
                opacity: 0,
                transition: "opacity .8s ease .3s",
              }}
            >
              COMPUTER SOCIETY OF ANNA UNIVERSITY // CEG
            </div>
          </div>
        </div>

        {/* Progress cue — koi swims along the waterline */}
        <div className="uplink-bar-wrap">
          <UplinkLoader progress={displayProgress} />
        </div>
      </div>
    </>
  );
}
