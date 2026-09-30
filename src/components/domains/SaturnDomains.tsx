"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Domain } from "@/lib/domains";
import { startCanvasLoop, readPalette, prefersReducedMotion } from "@/components/space/space2d";
import DomainDetail from "./DomainDetail";

/* ============================================================
   SATURN DOMAINS - the six rings of Saturn are the six domains.

     • A subtle star field (reused 2D-canvas kit) sits behind the
       planet; Saturn and its rings are pure SVG so each ring can
       be a real, focusable button.
     • Hover / focus a ring -> it lights up and the centre names
       the domain (hover identify).
     • Click / Enter a ring -> the selected ring animates toward
       the centre and enlarges, then the focused Domain detail
       view takes over (a simpler, reliable version of the
       "ring detaches and becomes the panel" idea).
     • Keyboard: rings are in tab order; ← → and ↑ ↓ move between
       them; Enter/Space selects; Esc closes the detail.
     • Reduced motion: the transition collapses to an instant swap
       (handled here and in CSS).
   Everything is data-driven from the `domains` prop.
   ============================================================ */

const VIEW_W = 720;
const VIEW_H = 460;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;

// Ring geometry: six concentric ellipses, widest (outermost) first
// so ring index 0 is the outer ring. rx/ry per ring.
const RING_GEOM = [
  { rx: 320, ry: 92 },
  { rx: 288, ry: 82 },
  { rx: 256, ry: 72 },
  { rx: 224, ry: 62 },
  { rx: 192, ry: 52 },
  { rx: 160, ry: 42 },
];

export default function SaturnDomains({ domains }: { domains: Domain[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const ringRefs = useRef<(SVGGElement | null)[]>([]);

  const rings = domains.slice(0, RING_GEOM.length);

  /* ── subtle star field behind Saturn (reused canvas kit) ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = prefersReducedMotion();
    const pal = readPalette();

    // stable star positions
    let seed = 20260930;
    const rnd = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return ((seed >>> 0) % 100000) / 100000;
    };
    const stars = Array.from({ length: 90 }, () => ({
      fx: rnd(),
      fy: rnd(),
      r: rnd() * 1.1 + 0.3,
      base: rnd() * 0.5 + 0.2,
      tw: rnd() * 2 + 0.5,
      ph: rnd() * Math.PI * 2,
    }));

    const draw = (ctx: CanvasRenderingContext2D, W: number, H: number, t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = pal.starlight;
      for (const s of stars) {
        const a = reduced ? s.base : s.base * (0.6 + 0.4 * Math.sin(t * s.tw + s.ph));
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(s.fx * W, s.fy * H, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const stop = startCanvasLoop(canvas, draw, { still: reduced });
    return stop;
  }, []);

  const open = useCallback(
    (i: number) => {
      if (prefersReducedMotion()) {
        setSelected(i);
        return;
      }
      setTransitioning(true);
      setSelected(i);
      // let the ring "fly to centre" animation play, then reveal the detail
      window.setTimeout(() => setTransitioning(false), 520);
    },
    [],
  );

  const close = useCallback(() => setSelected(null), []);

  // Keyboard navigation across the rings
  const onRingKey = useCallback(
    (e: React.KeyboardEvent, i: number) => {
      const n = rings.length;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = (i + 1) % n;
        ringRefs.current[next]?.focus();
        setHovered(next);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = (i - 1 + n) % n;
        ringRefs.current[prev]?.focus();
        setHovered(prev);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(i);
      }
    },
    [rings.length, open],
  );

  const activeName = hovered !== null ? rings[hovered]?.name : null;

  return (
    <div className="dm-stage">
      <canvas ref={canvasRef} className="dm-stars" aria-hidden />

      <div
        className={`dm-saturn-wrap ${selected !== null ? "is-selecting" : ""}`}
        data-transitioning={transitioning ? "true" : undefined}
        aria-hidden={selected !== null ? true : undefined}
      >
        <svg
          className="dm-saturn"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="group"
          aria-label="CSAU domains, shown as the six rings of Saturn. Use arrow keys to move between rings and Enter to open a domain."
        >
          <defs>
            <radialGradient id="dm-planet" cx="38%" cy="34%" r="75%">
              <stop offset="0%" stopColor="var(--hull-700)" />
              <stop offset="70%" stopColor="var(--hull-900)" />
              <stop offset="100%" stopColor="var(--void-950)" />
            </radialGradient>
          </defs>

          {/* back halves of the rings (drawn first, behind the planet) */}
          {rings.map((d, i) => {
            const g = RING_GEOM[i];
            const on = hovered === i || selected === i;
            return (
              <path
                key={`back-${d.id}`}
                d={arcPath(CX, CY, g.rx, g.ry, true)}
                className={`dm-ring-back ${on ? "is-on" : ""}`}
                fill="none"
              />
            );
          })}

          {/* the planet */}
          <circle cx={CX} cy={CY} r={72} fill="url(#dm-planet)" stroke="var(--hull-700)" strokeWidth="1" />
          {/* centre label: identifies the hovered/focused domain */}
          <text x={CX} y={CY - 2} className="dm-center-label" textAnchor="middle">
            {activeName ?? "DOMAINS"}
          </text>
          <text x={CX} y={CY + 16} className="dm-center-sub" textAnchor="middle">
            {activeName ? "PRESS ENTER" : "6 RINGS"}
          </text>

          {/* front halves + interactive hit areas */}
          {rings.map((d, i) => {
            const g = RING_GEOM[i];
            const on = hovered === i || selected === i;
            return (
              <g
                key={`front-${d.id}`}
                ref={(el) => {
                  ringRefs.current[i] = el;
                }}
                className={`dm-ring ${on ? "is-on" : ""} ${selected === i ? "is-selected" : ""}`}
                role="button"
                tabIndex={selected === null ? 0 : -1}
                aria-label={`${d.name} - ${d.blurb}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered((h) => (h === i ? null : h))}
                onClick={() => open(i)}
                onKeyDown={(e) => onRingKey(e, i)}
              >
                {/* visible front arc */}
                <path d={arcPath(CX, CY, g.rx, g.ry, false)} className="dm-ring-front" fill="none" />
                {/* wide invisible hit area for pointer + easier targeting */}
                <path
                  d={arcPath(CX, CY, g.rx, g.ry, false)}
                  className="dm-ring-hit"
                  fill="none"
                  strokeWidth={Math.max(14, g.ry * 0.5)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Domain legend - a text list, so the whole thing works without
          hover and reads clearly on small screens. */}
      <ul className="dm-legend" aria-label="Domains">
        {rings.map((d, i) => (
          <li key={d.id}>
            <button
              type="button"
              className={`dm-legend-item ${hovered === i ? "is-on" : ""}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered((h) => (h === i ? null : h))}
              onClick={() => open(i)}
              aria-label={`${d.name} - ${d.blurb}`}
            >
              <span className="dm-legend-dot" data-i={i} aria-hidden />
              <span className="dm-legend-name">{d.name}</span>
              <span className="dm-legend-blurb">{d.blurb}</span>
            </button>
          </li>
        ))}
      </ul>

      {selected !== null && rings[selected] && (
        <DomainDetail
          domain={rings[selected]}
          ringIndex={selected}
          onClose={close}
        />
      )}
    </div>
  );
}

/**
 * Build a half-ellipse arc path. `back = true` returns the far half
 * (top), `back = false` the near half (bottom) that passes in front
 * of the planet - the classic Saturn look.
 */
function arcPath(cx: number, cy: number, rx: number, ry: number, back: boolean): string {
  const sweep = back ? 1 : 0;
  // from left point to right point, arcing over the top (back) or bottom (front)
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 ${sweep} ${cx + rx} ${cy}`;
}
