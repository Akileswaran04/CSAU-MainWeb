"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type MutableRefObject } from "react";
import { createPortal } from "react-dom";
import { NAV_DESTINATIONS } from "@/lib/destinations";
import Cockpit, { COCKPIT_MQ } from "./Cockpit";

/* ============================================================
   THE CONSTELLATION - the end of the journey on phones. As the ship
   arrives at the last stop, one constellation comes up ahead of it,
   four of its stars the pages, brighter, pulsing, each with its
   name. Choose one and it flares and the ship warps there: the
   scene's warp (the ship rushes on, light streams past in a tunnel),
   a flash, and the page's own link is followed, so the travel loader
   takes it from there. Reduced motion: the link is followed at once.

   Seven stars in a loop (after the owner's sketch), drawn with spikes
   and their own colours, against a nebula, a band of the Milky Way,
   a far galaxy and a field of faint stars.
   Wide windows end in the ship's cockpit instead (Cockpit.tsx).
   ============================================================ */

interface Star {
  x: number;
  y: number;
  /** which page it is, in nav order (Events, Blog, Team, Contact) */
  page?: number;
  /** its colour, as real stars are */
  tint: string;
}
interface Shape {
  stars: Star[];
  /** pairs of stars joined */
  lines: [number, number][];
  /** the sky the drawing sits in (the viewBox, and the stars' places in %) */
  vb: { x: number; y: number; w: number; h: number };
}

/* the owner's sketch: seven stars in a loop */
const LOOP: Shape = {
  stars: [
    { x: 0, y: 21.9, page: 3, tint: "#bcd8ff" },
    { x: 17.5, y: 3.9, tint: "#ffe2b8" },
    { x: 51, y: 0, page: 0, tint: "#ffd9a0" },
    { x: 100, y: 28.4, page: 1, tint: "#a9cbff" },
    { x: 91.1, y: 50, tint: "#d6e6ff" },
    { x: 58.5, y: 46.4, page: 2, tint: "#f4f6ff" },
    { x: 37.1, y: 29, tint: "#ffc9a8" },
  ],
  lines: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 0],
  ],
  vb: { x: -6, y: -8, w: 112, h: 66 },
};

/* the faint stars behind it, over a sky half as big again as the drawing (a seeded scatter, the same every time):
   [x, y, radius, brightness, twinkles, colour] in the back layer's box (0 to 100 across, 0 to 64 down) */
const field = (count: number, size: number, seed: number): [number, number, number, number, boolean, string][] => {
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tints = ["#e9f1ff", "#e9f1ff", "#cfe0ff", "#fff0d8", "#ffe2bd"];
  return Array.from({ length: count }, () => {
    const r = rnd();
    return [rnd() * 100, rnd() * 64, 0.04 + r * r * size, 0.3 + rnd() * 0.65, rnd() < 0.25, tints[Math.floor(rnd() * tints.length)]];
  });
};
const FIELD_LOOP = field(110, 0.17, 23);

const WARP_MS = 2700; // keep in step with .cn-flash's animation
const GO_AT = 2250; // the page's link is followed under the flash at the end of the warp
const now = () => performance.now(); // read on a click, never while rendering

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(COCKPIT_MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** `warpRef`: set to when the warp began, for the 3D scene to fly it; back to 0 when it is over. */
export default function Constellation(props: { on: boolean; warpRef: MutableRefObject<number> }) {
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia(COCKPIT_MQ).matches, () => true);
  return wide ? <Cockpit {...props} /> : <SketchLoop {...props} />;
}

function SketchLoop({ on, warpRef }: { on: boolean; warpRef: MutableRefObject<number> }) {
  const dests = NAV_DESTINATIONS.filter((d) => d.href !== "/");
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const [going, setGoing] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const shape = LOOP;
  const { vb } = shape;
  const at = (x: number, y: number) => ({ left: `${((x - vb.x) / vb.w) * 100}%`, top: `${((y - vb.y) / vb.h) * 100}%` });
  const path = shape.lines.map(([a, b]) => `M${shape.stars[a].x} ${shape.stars[a].y}L${shape.stars[b].x} ${shape.stars[b].y}`).join("");

  const go = (page: number) => {
    if (going !== null) return;
    const link = links.current[page];
    if (!link) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return link.click();
    setGoing(page);
    warpRef.current = now();
    timers.current.push(
      window.setTimeout(() => link.click(), GO_AT),
      window.setTimeout(() => {
        setGoing(null);
        warpRef.current = 0;
      }, WARP_MS)
    );
  };

  return (
    <nav className="cn" data-on={on} data-going={going !== null} aria-label="Pages" aria-hidden={!on} inert={!on}>
      <div className="cn-sky" style={{ aspectRatio: `${vb.w} / ${vb.h}` }}>
        {/* the deep sky behind it: a nebula, a band of the Milky Way, a far galaxy, a field of fine stars */}
        <div className="cn-back" aria-hidden>
          <span className="cn-nebula" />
          <span className="cn-band" />
          <span className="cn-galaxy" />
          <svg viewBox="0 0 100 64" preserveAspectRatio="none">
            {FIELD_LOOP.map(([x, y, r, o, tw, c], k) => (
              <circle key={k} cx={x} cy={y} r={r} opacity={o} fill={c} className={tw ? "cn-tw" : undefined} style={tw ? ({ "--k": k % 9 } as CSSProperties) : undefined} />
            ))}
          </svg>
        </div>
        <svg className="cn-lines" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} aria-hidden>
          <path d={path} pathLength={1} />
        </svg>
        {/* its other stars: real stars, but no pages */}
        {shape.stars.map((s, k) =>
          s.page === undefined ? <span key={k} className="cn-dim" style={{ ...at(s.x, s.y), "--tint": s.tint, "--i": k } as CSSProperties} aria-hidden /> : null
        )}
        {shape.stars.map((s, k) => {
          if (s.page === undefined) return null;
          const d = dests[s.page];
          if (!d) return null;
          const page = s.page;
          return (
            <div key={d.href} className="cn-star" data-picked={going === page || undefined} style={{ ...at(s.x, s.y), "--tint": s.tint, "--i": k } as CSSProperties}>
              <button type="button" className="cn-btn" onClick={() => go(page)} aria-label={`Go to ${d.name}`}>
                <span className="cn-point" aria-hidden />
                <span className="cn-name">{d.label}</span>
              </button>
              {/* the page's own link, followed after the warp (so the travel loader picks it up) */}
              <Link
                href={d.href}
                data-route-load
                tabIndex={-1}
                aria-hidden
                className="cn-link"
                ref={(el) => {
                  links.current[page] = el;
                }}
              />
            </div>
          );
        })}
      </div>
      {going !== null && createPortal(<div className="cn-flash" aria-hidden />, document.body)}
    </nav>
  );
}
