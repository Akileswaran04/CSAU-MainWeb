"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  KoiSwimmer,
  drawKoi,
  drawLily,
  drawRipples,
  prefersReducedMotion,
  readPalette,
  startCanvasLoop,
  type Pt,
  type Ripple,
} from "./koi/koi";

/* ============================================================
   LASER NAV — fullscreen navigation over a night pond.

     • dark pond water with slow ripple rings and a few lily pads
     • clean typographic links, each a >=44px touch target
     • a koi wanders the water; hovering or focusing a link sends
       it swimming over to that link, dropping a ripple on arrival
     • the pointer leaves faint ripples as it moves over the water
   Routes, keyboard (Esc closes) and aria behaviour are unchanged.
   ============================================================ */

const NAV_LINKS = [
  { label: "HOME", href: "/" },
  { label: "EVENTS", href: "/events" },
  { label: "BLOG", href: "/blog" },
  { label: "CRACKIT", href: "/crackit" },
  { label: "TEAM", href: "/team" },
  { label: "QUICK CODE", href: "/quick-code" },
];

const PADS = [
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
  const ripplesRef = useRef<Ripple[]>([]);

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
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleClose = useCallback(() => setOpen(false), []);

  /* ── Koi-in-the-pond canvas (runs only while open) ── */
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = prefersReducedMotion();
    const pal = readPalette();
    const ripples = ripplesRef.current;
    ripples.length = 0;
    let koi: KoiSwimmer | null = null;
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
      ripples.push({ x: e.clientX, y: e.clientY, born: clock, max: 70, life: 1.8, strength: 0.5 });
    };
    if (!reduced) window.addEventListener("pointermove", onPointer, { passive: true });

    const draw = (ctx: CanvasRenderingContext2D, W: number, H: number, t: number, dt: number) => {
      clock = t;
      ctx.clearRect(0, 0, W, H);
      const L = Math.max(100, Math.min(170, W * 0.12));

      PADS.forEach((p, i) => {
        drawLily(
          ctx,
          p.fx * W + Math.sin(t * 0.2 + i) * 3,
          p.fy * H + Math.cos(t * 0.16 + i * 2) * 3,
          Math.max(24, Math.min(54, W * 0.038)) * p.k,
          p.rot + Math.sin(t * 0.1 + i) * 0.07,
          pal,
        );
      });

      if (!koi) koi = new KoiSwimmer(W * 0.78, H * 0.3, Math.PI * 0.8, L, 90);
      koi.L = L;

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
          ripples.push({ x: tx, y: r.top + r.height / 2, born: t, max: 110, life: 2.2, strength: 0.9 });
        }
      } else {
        lastHover = null;
        target = wander;
      }

      if (!reduced) {
        koi.step(dt, target, turn, hover !== null ? 1.5 : 1);
        if (t >= nextWake) {
          nextWake = t + 0.9;
          ripples.push({ x: koi.x, y: koi.y, born: t, max: L * 0.7, life: 2.4, strength: 0.45 });
        }
        if (t >= nextAmbient) {
          nextAmbient = t + 2 + Math.random() * 2.5;
          ripples.push({ x: Math.random() * W, y: Math.random() * H, born: t, max: 50 + Math.random() * 90, life: 3.2, strength: 0.35 });
        }
      }

      drawRipples(ctx, ripples, t, pal.ripple, 0.6);
      drawKoi(ctx, koi.spine, L, t, pal, { beat: 5, sway: 0.95 });
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
        /* ── Floating button — squared, hairline, inverts on hover ── */
        .ln-toggle {
          position: fixed;
          top: 20px;
          left: 20px;
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
          font-family: 'JetBrains Mono', monospace;
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

        /* ── Fullscreen overlay (night pond) ── */
        .ln-overlay {
          position: fixed;
          inset: 0;
          z-index: 500;
          background: var(--pond-900);
          opacity: 0;
          pointer-events: none;
          transition: opacity .28s ease;
          overflow: hidden;
        }
        .ln-ripples {
          position: absolute;
          left: 70%;
          top: 42%;
          width: min(90vmin, 760px);
          height: min(90vmin, 760px);
          transform: translate(-50%, -50%);
          pointer-events: none;
          overflow: visible;
        }
        .ln-ripples circle {
          fill: none;
          stroke: var(--pond-300);
          stroke-width: 1;
          transform-origin: 50% 50%;
          opacity: 0;
        }
        .ln-overlay.open .ln-ripples circle { animation: lnRipple 7s cubic-bezier(.2,.6,.3,1) infinite; }
        @keyframes lnRipple {
          0% { transform: scale(.2); opacity: 0; }
          12% { opacity: .4; }
          100% { transform: scale(1); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .ln-overlay.open .ln-ripples circle { animation: none; opacity: .25; } }
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
          border: 1px solid var(--pond-300);
          background: var(--pond-950);
          color: var(--foam);
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          line-height: 1;
          cursor: pointer;
          transition: background-color 90ms ease, color 90ms ease, border-color 90ms ease;
        }
        .ln-close:hover {
          background: var(--signal-700);
          border-color: var(--signal-700);
          color: var(--foam);
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
          color: var(--pond-300);
          font-family: 'Ethnocentric', 'Sector034', sans-serif;
          font-weight: 900;
          font-size: clamp(30px, 6vw, 68px);
          letter-spacing: .06em;
          line-height: 1.12;
          padding: 2px 8px;
          text-align: left;
          transition: color .16s ease;
        }
        .ln-link::after {
          content: "";
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 2px;
          height: 2px;
          background: var(--marker, #f0b73a);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform .18s ease;
        }
        .ln-link:hover, .ln-link:focus-visible, .ln-link.is-active { color: var(--foam, #f6f1e4); }
        .ln-link:focus-visible { outline: 2px solid var(--marker); outline-offset: 2px; }
        .ln-link:hover::after, .ln-link:focus-visible::after, .ln-link.is-active::after {
          transform: scaleX(1);
        }
        @media (max-width: 640px) {
          .ln-list { padding: 10vh 6vw 10vh 6vw; }
          .ln-link { font-size: clamp(28px, 8.4vw, 40px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ln-overlay { transition: none; }
          .ln-link::after { transition: none; }
        }
      `}</style>

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

      {/* Fullscreen pond navigation */}
      <div className={`ln-overlay${open ? " open" : ""}`}>
        <svg className="ln-ripples" viewBox="0 0 400 400" aria-hidden>
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
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
