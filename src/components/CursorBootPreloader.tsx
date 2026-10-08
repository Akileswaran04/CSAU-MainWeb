"use client";

import "./boot.css";
import { useEffect, useRef, type CSSProperties } from "react";
import { NAV_DESTINATIONS } from "@/lib/destinations";
import type { EarthOnScreen } from "./space/PowerOnIntro";
import { paintEarthInto } from "./space/earthCanvas";

/* ============================================================
   BOOT PRELOADER - the planets light up

   Plays once per session, before the start page. A small Sun and the
   orbits of the menu's eight stops (lib/destinations: Home is Neptune
   ... Contact is Pluto), seen at a slant. As the site loads, the
   planets light up one by one, outermost first, and the Sun
   brightens. When the last one is lit the view falls toward Earth,
   which grows into the real Earth of the start page, already drawn
   underneath (HomeClient builds the start page under this).

   The only words are the percentage.

   It follows real loading, not a clock. Five things, each worth a
   share of the 100%: the page itself, its fonts, the browser's load
   event, the start page's 3D code, and Earth drawn once. While some
   are pending the count creeps toward them but never reaches them,
   so the last planet lights (100%) only once Earth is on screen. It
   rises no faster than 100% in RISE_MS and lights one planet at a
   time, so it reads. After MAX_WAIT_MS it lets the visitor through,
   whatever is still pending.

   It is drawn to read as the real thing: each planet is lit from the
   Sun (its night side turns with it round the orbit), passes behind
   the Sun on the far side and grows a little on the near side, and
   carries its own surface (Jupiter's bands, Saturn's ring in front
   and behind). Earth is the site's one Earth (space/earth.ts), painted:
   its dot, and the disc that falls, which is painted as the start page
   shows it at the moment they cross, so one fades into the other. The
   Sun darkens to its limb under a slow corona, over a field of stars
   and the Milky Way.

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
const MAX_WAIT_MS = 15000; // safety net: never hold the visitor longer than this
const HOLD_MS = 300; // the last planet's ping, before the fall
const FALL_MS = 1000;
const FADE_MS = 450;

const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

/* how each planet looks once lit: size in px (desktop), its surface, Saturn's ring */
const LOOK: Record<string, { d: number; c: string; tex: string; ring?: boolean }> = {
  Mercury: {
    d: 7,
    c: "#a9a39a",
    tex: "radial-gradient(circle at 62% 40%, #7d776f 0 9%, transparent 10%), radial-gradient(circle at 35% 68%, #827b72 0 7%, transparent 8%), #a9a39a",
  },
  Venus: { d: 11, c: "#eadbb0", tex: "repeating-linear-gradient(162deg, #eedfb5 0 22%, #e0cc98 22% 34%)" },
  Earth: {
    d: 12,
    c: "#5b9cf0",
    tex: "radial-gradient(60% 14% at 50% 3%, #f2f6fa 0 96%, transparent 100%), radial-gradient(34% 8% at 58% 30%, rgba(255,255,255,.85) 0 96%, transparent 100%), radial-gradient(30% 22% at 34% 44%, #4f8a3c 0 96%, transparent 100%), radial-gradient(22% 30% at 68% 64%, #7d8a46 0 96%, transparent 100%), #2a64b8",
  },
  Mars: {
    d: 9,
    c: "#c8653d",
    tex: "radial-gradient(30% 10% at 50% 5%, #f1e6dc 0 96%, transparent 100%), radial-gradient(40% 20% at 40% 56%, #8e3f24 0 96%, transparent 100%), #c8653d",
  },
  Jupiter: {
    d: 26,
    c: "#e5cba4",
    tex: "radial-gradient(14% 9% at 64% 64%, #c0623d 0 96%, transparent 100%), repeating-linear-gradient(180deg, #e9d5b0 0 9%, #c99a6b 9% 15%, #efe2c6 15% 23%, #b88a5e 23% 27%)",
  },
  Saturn: { d: 20, c: "#e7d8b2", tex: "repeating-linear-gradient(180deg, #ecd9a8 0 14%, #d7bd83 14% 22%, #e6d29c 22% 34%)", ring: true },
  Neptune: {
    d: 16,
    c: "#4a72d6",
    tex: "radial-gradient(16% 10% at 40% 42%, #22397f 0 96%, transparent 100%), repeating-linear-gradient(180deg, #4a72d6 0 20%, #3f63c4 20% 28%)",
  },
  Pluto: { d: 6, c: "#b9a183", tex: "radial-gradient(28% 26% at 58% 58%, #efe3cf 0 96%, transparent 100%), #b9a183" },
};

/* The menu's stops, and Earth (where the start page is, and where the fall lands) if no stop is Earth,
   outermost first: the order they light in. Orbits are evenly spaced from a fifth of the outermost out;
   one turn takes longer further out (Kepler, softened); starts are spread round. */
const STOPS: { planet: string; au: string }[] = NAV_DESTINATIONS.some((d) => d.planet === "Earth")
  ? NAV_DESTINATIONS
  : [...NAV_DESTINATIONS, { planet: "Earth", au: "1.00 AU" }];
const PLANETS = [...STOPS]
  .sort((a, b) => parseFloat(b.au) - parseFloat(a.au))
  .map((dest, i, all) => {
    const f = 1 - (0.8 * i) / Math.max(1, all.length - 1);
    const T = round(9 * Math.pow(f / 0.2, 1.5), 1);
    const a = Math.round((i * 137.5 + 20) % 360);
    return {
      id: dest.planet.toLowerCase(),
      f: round(f),
      T,
      a,
      /* the depth keyframes start at the far-left edge of the orbit (180deg); start each where its planet is */
      dz: round((((((a - 180) % 360) + 360) % 360) / 360 - 1) * T, 2),
      ...(LOOK[dest.planet] ?? { d: 7, c: "#e6e1d4", tex: "#e6e1d4" }),
    };
  });
const STEP = 100 / PLANETS.length;

/* the sky, in a 1000-unit square cropped to the screen: [x, y, r, opacity, tint]. A thin field
   everywhere, and the Milky Way: a band of fainter stars across it, thick in the middle. */
const TINTS = ["#f6f1e4", "#cfdcff", "#ffe2c0"];
const SKY = (() => {
  let s = 20261007;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const out: [number, number, number, number, number][] = [];
  for (let i = 0; i < 170; i++) {
    const big = rnd() < 0.06;
    const r = big ? 1.5 + rnd() * 0.6 : 0.5 + rnd() * 0.7;
    const o = big ? 0.75 + rnd() * 0.2 : 0.18 + rnd() * 0.45;
    out.push([round(rnd() * 1000, 1), round(rnd() * 1000, 1), round(r, 2), round(o, 2), rnd() < 0.7 ? 0 : rnd() < 0.5 ? 1 : 2]);
  }
  for (let i = 0; i < 320; i++) {
    const t = rnd();
    const off = (rnd() + rnd() + rnd() - 1.5) * 80; // roughly normal across the band
    const r = 0.35 + rnd() * 0.5;
    const o = 0.12 + rnd() * 0.35;
    out.push([round(-100 + t * 1200 + off * 0.47, 1), round(820 - t * 640 + off * 0.88, 1), round(r, 2), round(o, 2), rnd() < 0.8 ? 0 : 1]);
  }
  return out;
})();
/* bright stars that twinkle: left %, top %, delay s, period s */
const TWINKLE = [
  [8, 14, 0, 3.4], [23, 71, 1.2, 4.1], [37, 9, 2.1, 3.7], [61, 83, 0.6, 4.6], [74, 18, 1.7, 3.2],
  [89, 58, 2.6, 4.3], [14, 42, 3.1, 3.9], [52, 27, 0.9, 5.1], [94, 9, 1.4, 3.6], [67, 52, 2.3, 4.8],
] as const;

export default function CursorBootPreloader({ scene, earth, onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const parts = useRef<Record<Part, boolean>>({ page: false, fonts: false, load: false, scene: false, earth: false });
  const earthRef = useRef(earth);
  const completeRef = useRef(onComplete);

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

    /* Earth's dot wears the real Earth's face (lit by the dot's own night side, so painted evenly lit) */
    const face = root.querySelector<HTMLElement>('[data-planet="earth"] .bt-body');
    if (face) {
      const c = document.createElement("canvas");
      void paintEarthInto(c, 48, 48, { cx: 24, cy: 24, r: 24, spin: 2.2 }).then(() => {
        face.style.background = `url(${c.toDataURL()}) center / cover`;
      });
    }

    const dots = [...root.querySelectorAll<HTMLElement>("[data-planet]")];
    const orbits = [...root.querySelectorAll<SVGGElement>(".bt-orbits [data-orbit]")];
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
    const fall = (dot: HTMLElement, e: EarthOnScreen) => {
      const { r } = e;
      const sys = root.querySelector<HTMLElement>(".bt-sys")!;
      const sky = root.querySelector<HTMLElement>(".bt-sky")!;
      const disc = root.querySelector<HTMLElement>(".bt-earth")!;
      /* paint the start page's Earth as it will be half way through the fade (it turns about 4 degrees a second);
         until it is painted the disc is plain */
      const map = disc.querySelector("canvas")!;
      const S = 2.4 * r; // room for the atmosphere
      void paintEarthInto(map, S, S, { cx: S / 2, cy: S / 2, r, dist: e.dist, sun: e.sun, particles: e.particles, spin: e.turnAt(performance.now() + FALL_MS - 100 + FADE_MS / 2) }).then(
        () => void (map.dataset.painted = "true")
      );
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
      run(disc.querySelector(".bt-earth-lit")!, [{ opacity: 1 }, { opacity: 0, offset: 0.6 }, { opacity: 0 }], { duration: FALL_MS, easing: ease });
      run(sky, [{ transform: "none", opacity: 1 }, { transform: "scale(1.7)", opacity: 0 }], { duration: FALL_MS, easing: "ease-in" });
      root.querySelectorAll(".bt-hud").forEach((el) => run(el, [{ opacity: 0 }], { duration: 250 }));
      /* the real Earth is underneath, the same size in the same place: fade onto it */
      fadeOut(FADE_MS, FALL_MS - 100);
    };

    const leave = () => {
      if (leaving) return;
      leaving = true;
      cancelAnimationFrame(raf);
      const e = earthRef.current;
      const dot = root.querySelector<HTMLElement>('[data-planet="earth"]');
      if (reduced || !e || !dot) return fadeOut(FADE_MS);
      fall(dot, e);
    };

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
        <svg className="bt-stars" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="bt-mw">
              <stop offset="0" stopColor="#c8cfe0" stopOpacity="0.11" />
              <stop offset="1" stopColor="#c8cfe0" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* the Milky Way's glow and its dark dust lane */}
          <ellipse cx="500" cy="500" rx="720" ry="95" transform="rotate(-28 500 500)" fill="url(#bt-mw)" />
          <ellipse cx="500" cy="512" rx="600" ry="16" transform="rotate(-28 500 500)" fill="#000" opacity="0.35" />
          {SKY.map(([x, y, r, o, t], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={TINTS[t]} opacity={o} />
          ))}
        </svg>
        {TWINKLE.map(([l, t, d, T], i) => (
          <i key={i} className="bt-twinkle" style={{ left: `${l}%`, top: `${t}%`, animationDelay: `${d}s`, animationDuration: `${T}s` }} />
        ))}
      </div>

      <div className="bt-sys" aria-hidden>
        {/* each orbit in two halves: the far half fainter than the near one */}
        <svg className="bt-orbits" viewBox="-1 -1 2 2" preserveAspectRatio="none">
          {PLANETS.map((pl) => (
            <g key={pl.id} data-orbit data-lit="false">
              <path className="bt-far" d={`M ${-pl.f} 0 A ${pl.f} ${pl.f} 0 0 1 ${pl.f} 0`} />
              <path className="bt-near" d={`M ${-pl.f} 0 A ${pl.f} ${pl.f} 0 0 0 ${pl.f} 0`} />
            </g>
          ))}
        </svg>
        {/* the plane is squashed into the slant; each planet turns on it and is turned and unsquashed back, so it stays
            round. The Sun stands in the plane too, so a planet on the far side passes behind it. */}
        <div className="bt-plane">
          <div className="bt-sunwrap">
            <i className="bt-glow" />
            <i className="bt-corona" />
            <i className="bt-sun" data-sun />
          </div>
          {PLANETS.map((pl) => (
            <div key={pl.id} className="bt-orbit" style={{ "--a": `${pl.a}deg`, "--T": `${pl.T}s`, "--dz": `${pl.dz}s` } as CSSProperties}>
              <div className="bt-arm">
                <div className="bt-at" style={{ "--f": pl.f } as CSSProperties}>
                  <div className="bt-face">
                    <div className="bt-face0">
                      <i className="bt-dot" data-planet={pl.id} data-lit="false" style={{ "--d": `${pl.d}px`, "--c": pl.c } as CSSProperties}>
                        {pl.ring && <i className="bt-ring bt-ring-far" />}
                        <i className="bt-body" style={{ background: pl.tex }} />
                        <i className="bt-night" />
                        {pl.ring && <i className="bt-ring bt-ring-near" />}
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
        <canvas className="bt-earth-map" />
        <i className="bt-earth-lit" />
      </i>

      {/* the count at the foot of the screen */}
      <div className="bt-hud">
        <div className="bt-meter">
          <div className="bt-pct" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} aria-label="Loading">
            0%
          </div>
          <i className="bt-bar" aria-hidden />
        </div>
      </div>
    </div>
  );
}
