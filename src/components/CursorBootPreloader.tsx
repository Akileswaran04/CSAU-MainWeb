"use client";

import "./boot.css";
import { useEffect, useRef, type CSSProperties } from "react";
import { NAV_DESTINATIONS } from "@/lib/destinations";
import type { EarthOnScreen } from "./space/PowerOnIntro";

/* ============================================================
   BOOT PRELOADER - the planets light up

   Plays once per session, before the start page. A small Sun and the
   orbits of the menu's eight stops (lib/destinations: Home is Neptune
   ... Contact is Pluto), seen at a slant. As the site loads, the
   planets light up one by one, outermost first, and the Sun
   brightens. When the last one is lit the view falls toward Earth,
   which grows into the real Earth of the start page, already drawn
   underneath (HomeClient builds the start page under this).

   The only words are the percentage and Skip.

   It follows real loading, not a clock. Five things, each worth a
   share of the 100%: the page itself, its fonts, the browser's load
   event, the start page's 3D code, and Earth drawn once. While some
   are pending the count creeps toward them but never reaches them,
   so the last planet lights (100%) only once Earth is on screen. It
   rises no faster than 100% in RISE_MS and lights one planet at a
   time, so it reads. After MAX_WAIT_MS it lets the visitor through,
   whatever is still pending.

   The orbits turn with CSS transforms on the compositor, so they keep
   moving while the 3D scene is built on the main thread. The count and
   the planets are written straight to the page from the frame loop, as
   the route loader does, so no planet is ever skipped on screen. Reduced
   motion: nothing turns and nothing falls; the planets light in place
   and it fades onto the start page.
   ============================================================ */

interface Props {
  /** the start page's 3D code has arrived */
  scene: boolean;
  /** Earth has been drawn on the start page, and how big it is there; null until then */
  earth: EarthOnScreen | null;
  onComplete?: () => void;
}

/* what loading is made of, and each part's share of the 100% */
const SHARE = { page: 10, fonts: 15, load: 20, scene: 25, earth: 30 } as const;
type Part = keyof typeof SHARE;
const CREEP = 0.6; // how far into the pending shares the count may creep while it waits
const CREEP_MS = 3000;
const RISE_MS = 1500; // 0 to 100 never takes less than this, so each planet is seen to light
const RISE_MS_REDUCED = 700;
const MAX_WAIT_MS = 15000; // safety net: never hold the visitor longer than this (Skip is always there)
const HOLD_MS = 300; // the last planet's ping, before the fall
const FALL_MS = 1000;
const FADE_MS = 450;
const SKIP_MS = 300;

const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

/* how each planet looks once lit: size in px, a muted natural colour, Saturn's ring */
const LOOK: Record<string, { d: number; c: string; ring?: boolean }> = {
  Mercury: { d: 6, c: "#c9c4bb" },
  Venus: { d: 9, c: "#efe1bf" },
  Earth: { d: 10, c: "#5b9cf0" },
  Mars: { d: 7, c: "#df9b7d" },
  Jupiter: { d: 19, c: "#e5cba4" },
  Saturn: { d: 15, c: "#e7d8b2", ring: true },
  Neptune: { d: 12, c: "#8fb3e8" },
  Pluto: { d: 5, c: "#d7ccbd" },
};

/* The menu's stops, outermost first: the order they light in. Orbits are evenly spaced from a fifth of
   the outermost out; one turn takes longer further out (Kepler, softened); starts are spread round. */
const PLANETS = [...NAV_DESTINATIONS]
  .sort((a, b) => parseFloat(b.au) - parseFloat(a.au))
  .map((dest, i, all) => {
    const f = 1 - (0.8 * i) / Math.max(1, all.length - 1);
    return {
      id: dest.planet.toLowerCase(),
      f: round(f),
      T: round(9 * Math.pow(f / 0.2, 1.5), 1),
      a: Math.round((i * 137.5 + 20) % 360),
      ...(LOOK[dest.planet] ?? { d: 7, c: "#e6e1d4" }),
    };
  });
const STEP = 100 / PLANETS.length;

/* sparse still stars: left %, top %, opacity */
const STARS = (() => {
  let s = 20261003;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 34 }, () => [round(rnd() * 100, 2), round(rnd() * 100, 2), round(0.18 + rnd() * 0.42, 2)] as const);
})();

export default function CursorBootPreloader({ scene, earth, onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const parts = useRef<Record<Part, boolean>>({ page: false, fonts: false, load: false, scene: false, earth: false });
  const earthRef = useRef(earth);
  const completeRef = useRef(onComplete);
  const skipRef = useRef(false);
  const leaveRef = useRef<() => void>(() => {});

  useEffect(() => {
    completeRef.current = onComplete;
    earthRef.current = earth;
    parts.current.scene ||= scene || !!earth;
    parts.current.earth ||= !!earth;
  }, [onComplete, scene, earth]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const has = parts.current;
    has.page = true;
    const onLoad = () => void (has.load = true);
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    void document.fonts?.ready.then(() => void (has.fonts = true));

    const dots = [...root.querySelectorAll<HTMLElement>("[data-planet]")];
    const orbits = [...root.querySelectorAll<SVGCircleElement>(".bt-orbits circle")];
    const pctEl = root.querySelector<HTMLElement>(".bt-pct")!;
    const t0 = performance.now();
    const rise = 100 / (reduced ? RISE_MS_REDUCED : RISE_MS); // % per ms
    let p = 0;
    let last = t0;
    let pct = 0;
    let lit = 0;
    const show = () => {
      pctEl.textContent = `${pct}%`;
      pctEl.setAttribute("aria-valuenow", String(pct));
      root.style.setProperty("--p", String(pct / 100));
      for (let i = 0; i < lit; i++) {
        dots[i].dataset.lit = "true";
        orbits[i].dataset.lit = "true";
      }
    };
    let raf = 0;
    let leaving = false;
    let completed = false;
    const timers: number[] = [];
    const anims: Animation[] = [];
    const run = (el: Element, frames: Keyframe[], o: KeyframeAnimationOptions) => {
      const a = el.animate(frames, { fill: "forwards", ...o });
      anims.push(a);
      return a;
    };
    const complete = () => {
      if (completed) return;
      completed = true;
      completeRef.current?.();
    };
    const fadeOut = (ms: number, delay = 0) => void run(root, [{ opacity: 1 }, { opacity: 0 }], { duration: ms, delay, easing: "ease" }).finished.then(complete, () => {});

    /* the fall: the system swings toward Earth and fades, while Earth grows from its dot into the real Earth below */
    const fall = (dot: HTMLElement, r: number) => {
      const sys = root.querySelector<HTMLElement>(".bt-sys")!;
      const sky = root.querySelector<HTMLElement>(".bt-sky")!;
      const disc = root.querySelector<HTMLElement>(".bt-earth")!;
      const at = dot.getBoundingClientRect();
      const box = sys.getBoundingClientRect();
      const ex = at.left + at.width / 2;
      const ey = at.top + at.height / 2;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const ease = "cubic-bezier(.65,0,.25,1)";
      Object.assign(disc.style, { width: `${2 * r}px`, height: `${2 * r}px`, margin: `${-r}px 0 0 ${-r}px` });
      sys.style.transformOrigin = `${ex - box.left}px ${ey - box.top}px`;
      sky.style.transformOrigin = `${ex}px ${ey}px`;
      dot.style.visibility = "hidden";
      run(sys, [{ transform: "none", opacity: 1 }, { opacity: 0.55, offset: 0.4 }, { transform: `translate(${cx - ex}px, ${cy - ey}px) scale(5)`, opacity: 0 }], { duration: FALL_MS, easing: ease });
      run(disc, [{ transform: `translate(${ex - cx}px, ${ey - cy}px) scale(${at.width / (2 * r)})`, opacity: 1 }, { transform: "none", opacity: 1 }], { duration: FALL_MS, easing: ease });
      /* it starts as the bright dot it was, and darkens into the real Earth's face as it nears */
      run(disc.firstElementChild!, [{ opacity: 1 }, { opacity: 0, offset: 0.6 }, { opacity: 0 }], { duration: FALL_MS, easing: ease });
      run(sky, [{ transform: "none", opacity: 1 }, { transform: "scale(1.7)", opacity: 0 }], { duration: FALL_MS, easing: "ease-in" });
      root.querySelectorAll(".bt-pct, .bt-skip").forEach((el) => run(el, [{ opacity: 0 }], { duration: 250 }));
      /* the real Earth is underneath, the same size in the same place: fade onto it */
      fadeOut(FADE_MS, FALL_MS - 100);
    };

    const leave = () => {
      if (leaving) return;
      leaving = true;
      cancelAnimationFrame(raf);
      const e = earthRef.current;
      const dot = root.querySelector<HTMLElement>('[data-planet="earth"]');
      if (skipRef.current || reduced || !e || !dot) return fadeOut(skipRef.current ? SKIP_MS : FADE_MS);
      fall(dot, e.r);
    };
    leaveRef.current = leave;

    const tick = (now: number) => {
      now = Math.max(now, last); // a frame's timestamp can be older than the moment the loop started
      const waited = now - t0;
      const giveUp = waited > MAX_WAIT_MS;
      let got = 0;
      for (const k of Object.keys(SHARE) as Part[]) if (has[k] || giveUp) got += SHARE[k];
      const target = got >= 100 ? 100 : got + (100 - got) * CREEP * (1 - Math.exp(-waited / CREEP_MS));
      const nextPlanet = (Math.floor(p / STEP + 1e-6) + 1) * STEP; // one planet at a time, however long a frame took
      p = Math.min(target, p + rise * (now - last), nextPlanet, 100);
      last = now;
      const nPct = Math.floor(p);
      const nLit = Math.min(PLANETS.length, Math.floor(p / STEP + 1e-6));
      if (nPct !== pct || nLit !== lit) {
        pct = nPct;
        lit = nLit;
        show();
      }
      if (p >= 100) {
        timers.push(window.setTimeout(leave, HOLD_MS));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
      timers.forEach((id) => clearTimeout(id));
      anims.forEach((a) => a.cancel());
      leaveRef.current = () => {};
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="bt"
      role="dialog"
      aria-modal="true"
      aria-label="Loading CSAU"
    >
      <div className="bt-sky" aria-hidden>
        {STARS.map(([l, t, o], i) => (
          <i key={i} className="bt-star" style={{ left: `${l}%`, top: `${t}%`, opacity: o }} />
        ))}
      </div>

      <div className="bt-sys" aria-hidden>
        <svg className="bt-orbits" viewBox="-1 -1 2 2" preserveAspectRatio="none">
          {PLANETS.map((pl) => (
            <circle key={pl.id} r={pl.f} data-lit="false" />
          ))}
        </svg>
        <i className="bt-glow" />
        <i className="bt-sun" data-sun />
        {/* the plane is squashed into the slant; each planet turns on it and is turned and unsquashed back, so it stays round */}
        <div className="bt-plane">
          {PLANETS.map((pl) => (
            <div key={pl.id} className="bt-orbit" style={{ "--a": `${pl.a}deg`, "--T": `${pl.T}s` } as CSSProperties}>
              <div className="bt-arm">
                <div className="bt-at" style={{ "--f": pl.f } as CSSProperties}>
                  <div className="bt-face">
                    <div className="bt-face0">
                      <i className="bt-dot" data-planet={pl.id} data-lit="false" style={{ "--d": `${pl.d}px`, "--c": pl.c } as CSSProperties}>
                        {pl.ring && <i className="bt-ring" />}
                        <i className="bt-ping" />
                      </i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Earth, for the fall: it grows from its dot to the size of the real Earth below */}
      <i className="bt-earth" aria-hidden style={{ "--c": LOOK.Earth.c } as CSSProperties}>
        <i className="bt-earth-lit" />
      </i>

      <div className="bt-pct" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} aria-label="Loading">
        0%
      </div>

      <button
        type="button"
        className="bt-skip"
        onClick={() => {
          skipRef.current = true;
          leaveRef.current();
        }}
      >
        Skip
      </button>
    </div>
  );
}
