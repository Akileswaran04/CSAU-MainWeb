"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import DestGlyph from "./DestGlyph";
import { DESTINATIONS } from "@/lib/destinations";
import { lockScroll } from "@/lib/scrollLock";
import { usePathname } from "next/navigation";
import {
  Craft,
  drawProbe,
  drawSatellite,
  drawPings,
  prefersReducedMotion,
  readPalette,
  startCanvasLoop,
  type Pt,
  type Ping,
} from "./space/space2d";

/* ============================================================
   LASER NAV - fullscreen navigation over the void.

     • dark void with slow radar rings and a few drifting satellites
     • clean typographic links, each a >=44px touch target
     • a probe wanders the void; hovering or focusing a link sends
       it flying over to that link, sending a ping on arrival
     • the pointer leaves faint pings as it moves
   Routes, keyboard (Esc closes) and aria behaviour are unchanged.
   ============================================================ */

const NAV_LINKS = DESTINATIONS;

const SATS = [
  { fx: 0.08, fy: 0.9, k: 1.0, rot: 0.8 },
  { fx: 0.93, fy: 0.13, k: 0.85, rot: 2.7 },
  { fx: 0.9, fy: 0.9, k: 0.6, rot: 4.4 },
];

export default function LaserNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const hoverRef = useRef<number | null>(null);
  const pingsRef = useRef<Ping[]>([]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll while the overlay is open
  useEffect(() => {
    if (!open) return;
    return lockScroll();
  }, [open]);

  const handleClose = useCallback(() => setOpen(false), []);

  /* ── Probe-in-the-void canvas (runs only while open) ── */
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = prefersReducedMotion();
    const pal = readPalette();
    const pings = pingsRef.current;
    pings.length = 0;
    let probe: Craft | null = null;
    let lastHover: number | null = null;
    let nextWake = 0;
    let nextAmbient = 0.5;
    let lastPx = -999;
    let lastPy = -999;
    let clock = 0;

    const onPointer = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - lastPx, e.clientY - lastPy) < 120) return;
      lastPx = e.clientX;
      lastPy = e.clientY;
      pings.push({ x: e.clientX, y: e.clientY, born: clock, max: 70, life: 1.8, strength: 0.5 });
    };
    if (!reduced) window.addEventListener("pointermove", onPointer, { passive: true });

    const draw = (ctx: CanvasRenderingContext2D, W: number, H: number, t: number, dt: number) => {
      clock = t;
      ctx.clearRect(0, 0, W, H);
      const L = Math.max(100, Math.min(170, W * 0.12));

      SATS.forEach((p, i) => {
        drawSatellite(
          ctx,
          p.fx * W + Math.sin(t * 0.2 + i) * 3,
          p.fy * H + Math.cos(t * 0.16 + i * 2) * 3,
          Math.max(24, Math.min(54, W * 0.038)) * p.k,
          p.rot + Math.sin(t * 0.1 + i) * 0.07,
          pal,
        );
      });

      if (!probe) probe = new Craft(W * 0.78, H * 0.3, Math.PI * 0.8, L, 90);
      probe.L = L;

      const hover = hoverRef.current;
      let target: Pt;
      let turn = 1.7;
      const wander: Pt = {
        x: W / 2 + W * 0.36 * Math.sin(t * 0.27),
        y: H / 2 + H * 0.34 * Math.sin(t * 0.21 + 1.1),
      };
      const el = hover !== null ? linkRefs.current[hover] : null;
      if (el) {
        const r = el.getBoundingClientRect();
        const room = r.left > W - r.right;
        const tx = room ? r.left - 22 : r.right + 22;
        target = { x: tx + Math.cos(t * 1.3) * 16, y: r.top + r.height / 2 + Math.sin(t * 1.3) * 16 };
        turn = 2.6;
        if (hover !== lastHover) {
          lastHover = hover;
          pings.push({ x: tx, y: r.top + r.height / 2, born: t, max: 110, life: 2.2, strength: 0.9 });
        }
      } else {
        lastHover = null;
        target = wander;
      }

      if (!reduced) {
        probe.step(dt, target, turn, hover !== null ? 1.5 : 1);
        if (t >= nextWake) {
          nextWake = t + 0.9;
          pings.push({ x: probe.x, y: probe.y, born: t, max: L * 0.7, life: 2.4, strength: 0.45 });
        }
        if (t >= nextAmbient) {
          nextAmbient = t + 2 + Math.random() * 2.5;
          pings.push({ x: Math.random() * W, y: Math.random() * H, born: t, max: 50 + Math.random() * 90, life: 3.2, strength: 0.35 });
        }
      }

      drawPings(ctx, pings, t, pal.dim, 0.6);
      drawProbe(ctx, probe.trail, L, t, pal, { beat: 5 });
    };

    const stop = startCanvasLoop(canvas, draw, { still: reduced });
    return () => {
      stop();
      window.removeEventListener("pointermove", onPointer);
    };
  }, [open]);

  const handleLinkHover = useCallback((index: number) => {
    hoverRef.current = index;
  }, []);

  const handleLinkLeave = useCallback(() => {
    hoverRef.current = null;
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <style>{`
        /* ── Floating button - squared, hairline, inverts on hover ── */
        .ln-toggle {
          position: fixed;
          top: max(20px, env(safe-area-inset-top));
          left: max(20px, env(safe-area-inset-left));
          z-index: 400;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 44px;
          padding: 9px 14px;
          touch-action: manipulation;
          border-radius: 2px;
          border: 1px solid var(--on-surface, #101a1a);
          background: var(--surface-container-lowest, #fffdf8);
          color: var(--on-surface, #101a1a);
          cursor: pointer;
          transition: background-color 90ms ease, color 90ms ease;
          user-select: none;
          font-family: var(--font-mono);
        }
        .ln-brand {
          display: none;
          position: fixed;
          z-index: 399;
          top: max(20px, env(safe-area-inset-top));
          left: max(20px, env(safe-area-inset-left));
          min-height: 44px;
          align-items: center;
          font-family: var(--font-display);
          font-size: 18px;
          letter-spacing: .1em;
          color: var(--starlight);
          text-decoration: none;
        }
        .ln-brand:focus-visible { outline: 2px solid var(--signal); outline-offset: 4px; }
        @media (max-width: 820px) {
          .ln-brand { display: inline-flex; }
          .ln-toggle { left: auto; right: max(16px, env(safe-area-inset-right)); }
        }
        .ln-toggle:hover {
          background: var(--on-surface, #101a1a);
          color: var(--background, #f1ebde);
        }
        .ln-toggle .ln-lines {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ln-toggle .ln-lines span {
          display: block;
          width: 16px;
          height: 1px;
          background: currentColor;
          transition: width 120ms ease;
        }
        .ln-toggle:hover .ln-lines span:nth-child(1) { width: 20px; }
        .ln-toggle:hover .ln-lines span:nth-child(3) { width: 12px; }
        .ln-toggle .ln-word {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .2em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* ── Fullscreen overlay (void) ── */
        .ln-overlay {
          position: fixed;
          inset: 0;
          z-index: 500;
          background: var(--hull-900);
          opacity: 0;
          pointer-events: none;
          transition: opacity .28s ease;
          overflow: hidden;
        }
        .ln-pings {
          position: absolute;
          left: 70%;
          top: 42%;
          width: min(90vmin, 760px);
          height: min(90vmin, 760px);
          transform: translate(-50%, -50%);
          pointer-events: none;
          overflow: visible;
        }
        .ln-pings circle {
          fill: none;
          stroke: var(--dim-300);
          stroke-width: 1;
          transform-origin: 50% 50%;
          opacity: 0;
        }
        .ln-overlay.open .ln-pings circle { animation: lnPing 7s cubic-bezier(.2,.6,.3,1) infinite; }
        @keyframes lnPing {
          0% { transform: scale(.2); opacity: 0; }
          12% { opacity: .4; }
          100% { transform: scale(1); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .ln-overlay.open .ln-pings circle { animation: none; opacity: .25; } }
        .ln-overlay.open { opacity: 1; pointer-events: auto; }
        .ln-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
        }
        .ln-close {
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 2;
          width: 44px;
          height: 44px;
          touch-action: manipulation;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          border: 1px solid var(--dim-300);
          background: var(--void-950);
          color: var(--starlight);
          font-family: var(--font-mono);
          font-size: 14px;
          line-height: 1;
          cursor: pointer;
          transition: background-color 90ms ease, color 90ms ease, border-color 90ms ease;
        }
        .ln-close:hover {
          background: var(--signal-700);
          border-color: var(--signal-700);
          color: var(--starlight);
        }
        .ln-list {
          position: relative;
          z-index: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(4px, 1.6vh, 16px);
          padding: 8vh 6vw 8vh 12vw;
        }
        .ln-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          text-decoration: none;
          color: var(--dim-300);
          font-family: var(--font-display);
          font-weight: 400;
          font-size: clamp(30px, 6vw, 68px);
          letter-spacing: .06em;
          line-height: 1.12;
          padding: 2px 8px;
          text-align: left;
          transition: color .16s ease;
        }
        .ln-link { gap: 14px; }
        .ln-txt { display: flex; flex-direction: column; align-items: flex-start; }
        .ln-cap { font-family: var(--font-mono); font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: var(--dim-300);
          max-height: 0; opacity: 0; overflow: hidden; transition: max-height .25s ease, opacity .25s ease; }
        .ln-link:hover .ln-cap, .ln-link:focus-visible .ln-cap, .ln-link.is-active .ln-cap { max-height: 1.6em; opacity: 1; }
        .ln-link .dg { transition: transform .5s ease; }
        .ln-link:hover .dg, .ln-link:focus-visible .dg { transform: rotate(18deg) scale(1.12); }
        .ln-link::after {
          content: "";
          position: absolute;
          left: 62px;
          right: 8px;
          bottom: 2px;
          height: 2px;
          background: var(--lit, #f0b73a);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .18s ease;
        }
        .ln-link:hover, .ln-link:focus-visible, .ln-link.is-active { color: var(--starlight, #f6f1e4); }
        .ln-link:focus-visible { outline: 2px solid var(--lit); outline-offset: 2px; }
        .ln-link:hover::after, .ln-link:focus-visible::after, .ln-link.is-active::after {
          transform: scaleX(1);
        }
        @media (max-width: 640px) {
          .ln-list { padding: 10vh 6vw 10vh 6vw; }
          .ln-link { font-size: clamp(28px, 8.4vw, 40px); }
        }
        @media (hover: none) { .ln-cap { max-height: 1.6em; opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .ln-overlay { transition: none; }
          .ln-link::after { transition: none; }
        }
        @media (max-width: 820px) {
          .ln-list { align-items: flex-start; padding: 14vh 24px calc(8vh + env(safe-area-inset-bottom)) 24px; gap: 6px; }
          .ln-link { font-size: clamp(30px, 9vw, 44px); min-height: 56px; }
        }
      `}</style>

      {/* Phone header: the wordmark links home; the menu button sits on the thumb side */}
      <Link href="/" className="ln-brand" aria-label="CSAU home">
        CSAU
      </Link>

      {/* Floating button */}
      <button
        type="button"
        className="ln-toggle"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="ln-lines" aria-hidden>
          <span />
          <span />
          <span />
        </span>
        <span className="ln-word">NAV</span>
      </button>

      {/* Fullscreen void navigation */}
      <div className={`ln-overlay${open ? " open" : ""}`}>
        <svg className="ln-pings" viewBox="0 0 400 400" aria-hidden>
          <circle cx="200" cy="200" r="190" />
          <circle cx="200" cy="200" r="190" style={{ animationDelay: "2.3s" }} />
          <circle cx="200" cy="200" r="190" style={{ animationDelay: "4.6s" }} />
        </svg>
        <canvas ref={canvasRef} className="ln-canvas" aria-hidden />

        <button
          type="button"
          className="ln-close"
          aria-label="Close navigation"
          onClick={handleClose}
        >
          ✕
        </button>

        <nav aria-label="Primary" className="ln-list">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              ref={(el) => {
                linkRefs.current[i] = el;
              }}
              className={`ln-link${isActive(link.href) ? " is-active" : ""}`}
              aria-current={isActive(link.href) ? "page" : undefined}
              onClick={handleClose}
              onMouseEnter={() => handleLinkHover(i)}
              onMouseLeave={handleLinkLeave}
              onFocus={() => handleLinkHover(i)}
              onBlur={handleLinkLeave}
              style={{
                opacity: open ? 1 : 0,
                transform: open ? "none" : "translateY(10px)",
                transition: `opacity .3s ease ${0.03 * i + 0.06}s, transform .3s ease ${0.03 * i + 0.06}s, color .16s ease`,
              }}
            >
              <DestGlyph kind={link.glyph} size={40} on={isActive(link.href)} />
              <span className="ln-txt">
                <span className="ln-label">{link.label}</span>
                <span className="ln-cap">{link.sector}</span>
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
