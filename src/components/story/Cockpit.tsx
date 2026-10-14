"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type MutableRefObject } from "react";
import { createPortal } from "react-dom";
import { NAV_DESTINATIONS } from "@/lib/destinations";

/* ============================================================
   THE COCKPIT - the end of the journey on wide screens. As the ship
   arrives at the last stop the camera moves into its cockpit
   (SpaceScene's Director) and the pages come up on the HUD as
   targets. Choose one: lock-on brackets close in on it, a 3-2-1
   countdown, then the jump: the scene's warp (light streams past in
   a tunnel), a flash, and the page's own link is followed, so the
   travel loader takes it from there. Reduced motion: the link is
   followed at once. Phones keep the sketch loop (Constellation.tsx).
   ============================================================ */

/** where the cockpit ending is used (wide, landscape windows); the Director reads it too */
export const COCKPIT_MQ = "(min-width: 821px) and (min-aspect-ratio: 1/1)";

const LOCK_MS = 450; // the brackets closing in (keep in step with .ck-lock's transition)
const TICK_MS = 520; // each count of the countdown
const WARP_MS = 2700; // keep in step with .cn-flash's animation
const GO_AT = 2250; // the page's link is followed under the flash at the end of the warp
const now = () => performance.now(); // read on a click, never while rendering

/** `warpRef`: set to when the warp began, for the 3D scene to fly it; back to 0 when it is over. */
export default function Cockpit({ on, warpRef }: { on: boolean; warpRef: MutableRefObject<number> }) {
  const dests = NAV_DESTINATIONS.filter((d) => d.href !== "/");
  const n = dests.length;
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  /* the locked target and the count: 4 while the brackets close, then 3, 2, 1, and 0 for the jump */
  const [lock, setLock] = useState<{ page: number; n: number } | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  /* scrolled away before the jump: the lock is let go */
  const live = useRef(on);
  useEffect(() => {
    live.current = on;
  }, [on]);

  const go = (page: number) => {
    if (lock) return;
    const link = links.current[page];
    if (!link) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return link.click();
    setLock({ page, n: 4 });
    const at = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
    const count = (k: number) => () => {
      if (live.current) return setLock({ page, n: k });
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setLock(null);
    };
    const jump = LOCK_MS + 3 * TICK_MS;
    [3, 2, 1, 0].forEach((k, i) => at(LOCK_MS + i * TICK_MS, count(k)));
    at(jump, () => {
      if (live.current) warpRef.current = now();
    });
    at(jump + GO_AT, () => link.click());
    at(jump + WARP_MS, () => {
      setLock(null);
      warpRef.current = 0;
    });
  };

  return (
    <nav className="ck" data-on={on} data-lock={lock !== null} data-jump={lock?.n === 0} aria-label="Pages" aria-hidden={!on} inert={!on}>
      {/* the cockpit: its canopy frame, a vignette, the reticle and a few HUD lines */}
      <div className="ck-frame" aria-hidden>
        <svg className="ck-canopy" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 0H100V4.5C76 1.6 24 1.6 0 4.5Z" />
          <path d="M13.5 3.4L16.5 3.1L4.2 100H0.4Z" />
          <path d="M86.5 3.4L83.5 3.1L95.8 100H99.6Z" />
        </svg>
        <div className="ck-tape" />
        <div className="ck-ladder" />
        <svg className="ck-reticle" viewBox="-50 -50 100 100">
          <circle r="18" />
          <path d="M-46 0H-26M26 0H46M0 -46V-26M0 26V46M-3 0H3M0 -3V3" />
        </svg>
      </div>
      {dests.map((d, i) => {
        const u = n > 1 ? (2 * i) / (n - 1) - 1 : 0; // -1 to 1 across
        const x = 50 + u * 30;
        const y = 25 + 17 * u * u; // an arc above the reticle, clear of the nose
        const brg = String(Math.round((360 + u * 18) % 360)).padStart(3, "0");
        const picked = lock?.page === i;
        return (
          <div key={d.href} className="ck-tgt" data-picked={picked || undefined} style={{ left: `${x}%`, top: `${y}%`, "--i": i } as CSSProperties}>
            <button type="button" className="ck-btn" onClick={() => go(i)} aria-label={`Go to ${d.name}`}>
              <span className="ck-box" aria-hidden>
                <span className="ck-lock" />
              </span>
              <span className="ck-name">{d.label}</span>
              <span className="ck-read" aria-hidden>
                RNG {d.au} · BRG {brg}
              </span>
            </button>
            {/* the page's own link, followed after the jump (so the travel loader picks it up) */}
            <Link
              href={d.href}
              data-route-load
              tabIndex={-1}
              aria-hidden
              className="cn-link"
              ref={(el) => {
                links.current[i] = el;
              }}
            />
          </div>
        );
      })}
      <div className="ck-count" aria-live="assertive">
        {lock && lock.n > 0 && lock.n < 4 && <span key={lock.n}>{lock.n}</span>}
      </div>
      {lock?.n === 0 && createPortal(<div className="cn-flash" aria-hidden />, document.body)}
    </nav>
  );
}
