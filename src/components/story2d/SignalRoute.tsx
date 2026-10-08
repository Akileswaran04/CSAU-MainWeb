"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { isExternal } from "@/data/events";
import { SECTIONS, STOP_LAYOUT, type Stop } from "@/components/story/stops";
import { scrollToY } from "@/components/story/lenis";
import "./signal-route.css";

/* ============================================================
   SIGNAL ROUTE - the home story as a true-scale flight from
   Earth to the Sun, in 2D (after Josh Worth's "If the Moon Were
   Only 1 Pixel", an Awwwards inspiration entry).

   Scroll is distance: the lane is one astronomical unit long and
   every body on it is at its real size and place. Earth, Venus and
   Mercury are a pixel or two wide, so each carries a lens drawn
   100x larger; the Sun is to scale. The stops sit along the lane
   as beacons, a ruler counts the AU down, and the telemetry reads
   the distance to the Sun and the signal delay back to Earth,
   which grows as the ship follows the signal out.

   No WebGL and nothing to warm up: the frame loop runs only while
   the page scrolls, and writes transforms and a few text nodes.
   Same props and STORY_HEIGHT as story/StorySection, so the two
   are interchangeable.
   ============================================================ */

const N = STOP_LAYOUT.length;
const TOTAL_W = STOP_LAYOUT.reduce((a, s) => a + s.weight, 0);
const VH_PER_WEIGHT = 78;

/** The section's height (the same as the 3D story's, so the home page reserves the same space). */
export const STORY_HEIGHT = `${TOTAL_W * VH_PER_WEIGHT + 100}vh`;

const EDGES: number[] = [];
const CENTRES: number[] = [];
{
  let acc = 0;
  STOP_LAYOUT.forEach((s) => {
    CENTRES.push((acc + s.weight / 2) / TOTAL_W);
    acc += s.weight;
    EDGES.push(acc / TOTAL_W);
  });
}

const AU_KM = 149_597_870.7;
const C_KM_S = 299_792.458;
const AU_END = 0.025; // the flight stops this far short of the Sun
/** how far along the lane (0 at Earth, 1 at the Sun) the ship is at scroll progress p */
const alongAt = (p: number) => p * (1 - AU_END);
const ORBITS = [
  { id: "venus", name: "Venus", au: 0.723, lift: 0.3 },
  { id: "mercury", name: "Mercury", au: 0.387, lift: 0.2 },
] as const;
const TICKS = Array.from({ length: 11 }, (_, i) => i / 10);
const pad = (n: number) => String(n).padStart(2, "0");
const KM = new Intl.NumberFormat("en-US");
const HUD_MS = 66; // the telemetry text is redrawn at most this often while flying
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** A tile of stars drawn once, repeated as a layer's background. */
function starTile(size: number, count: number, seed: number, rMax: number): string {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (!g) return "";
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    g.globalAlpha = 0.25 + rnd() * 0.65;
    g.fillStyle = "#f6f1e4";
    g.beginPath();
    g.arc(rnd() * size, rnd() * size, 0.3 + rnd() * rMax, 0, Math.PI * 2);
    g.fill();
  }
  return `url(${c.toDataURL("image/png")})`;
}

/** `stops` comes from buildStops(). `onWarm`: the story is ready to scroll (at once: there is nothing to compile). */
export default function SignalRoute({ stops, onWarm }: { stops: Stop[]; onWarm?: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const farRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLSpanElement>(null);
  const sunKmRef = useRef<HTMLSpanElement>(null);
  const sunAuRef = useRef<HTMLSpanElement>(null);
  const delayRef = useRef<HTMLSpanElement>(null);
  const orbitRefs = useRef<(SVGSVGElement | null)[]>([]);
  const [panel, setPanel] = useState<number | null>(null);

  useEffect(() => {
    onWarm?.();
  }, [onWarm]);

  /* the flight: scroll -> distance, written straight to the DOM */
  useEffect(() => {
    const section = sectionRef.current;
    const scene = sceneRef.current;
    const world = worldRef.current;
    if (!section || !scene || !world) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const geo = { w: 0, h: 0, au: 0, shipX: 0, lane: 0 };
    const far = { tile: 384, k: 0.012 };
    const near = { tile: 512, k: 0.05 };
    if (farRef.current) farRef.current.style.backgroundImage = starTile(far.tile, 70, 7, 0.55);
    if (nearRef.current) nearRef.current.style.backgroundImage = starTile(near.tile, 34, 11, 1.1);

    /* the stop being visited is shown by attributes alone, so a stop change costs no React render
       (hidden chapters are visibility: hidden, so their links are out of the tab order too) */
    const chapters = [...section.querySelectorAll<HTMLElement>(".story-chapter")];
    const beacons = [...section.querySelectorAll<HTMLElement>(".sr-beacon")];
    const ticks = [...section.querySelectorAll<HTMLElement>(".story-tick")];
    const firsts = ticks.map((t) => Number(t.dataset.first));
    let shownIdx = 0;
    const showStop = (idx: number) => {
      if (idx === shownIdx) return;
      shownIdx = idx;
      const stateOf = (i: number) => (i === idx ? "active" : i < idx ? "past" : "next");
      chapters.forEach((c, i) => {
        c.dataset.state = stateOf(i);
        c.setAttribute("aria-hidden", String(i !== idx));
      });
      beacons.forEach((b, i) => (b.dataset.state = stateOf(i)));
      let sec = 0;
      firsts.forEach((f, k) => {
        if (f <= idx) sec = k;
      });
      ticks.forEach((t, k) => {
        t.dataset.on = String(k === sec);
        t.dataset.done = String(k < sec);
        t.setAttribute("aria-current", String(k === sec));
      });
    };

    let raf = 0;
    let lastP = -1;
    let lastT = 0;
    let vel = 0;
    let shown = { au: "", km: "", delay: "" };
    let hudAt = 0;

    const frame = (t: number) => {
      raf = 0;
      const span = section.offsetHeight - window.innerHeight;
      const p = span > 0 ? clamp01(-section.getBoundingClientRect().top / span) : 0;
      const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
      lastT = t;
      const speed = lastP < 0 || reduced ? 0 : Math.abs(p - lastP) / dt;
      lastP = p;
      vel += (Math.min(1, speed * 4) - vel) * Math.min(1, dt * 6);

      const along = alongAt(p);
      const x = along * geo.au;
      const off = geo.shipX - x;
      world.style.transform = `translate3d(${off.toFixed(1)}px,0,0)`;
      farRef.current?.style.setProperty("transform", `translate3d(${(-((x * far.k) % far.tile)).toFixed(1)}px,0,0)`);
      nearRef.current?.style.setProperty("transform", `translate3d(${(-((x * near.k) % near.tile)).toFixed(1)}px,0,0)`);

      /* the signal link starts at Earth while Earth is on screen; its clip ends it at the ship */
      linkRef.current?.style.setProperty("transform", `translate3d(${Math.max(0, off).toFixed(1)}px,0,0)`);
      trailRef.current?.style.setProperty("transform", `scaleX(${(0.22 + vel * 0.78).toFixed(3)})`);

      const last = vel <= 0.004; // the trail has settled: this frame ends the run
      if (!last) raf = requestAnimationFrame(frame);

      const idx = EDGES.findIndex((e) => p < e);
      showStop(idx < 0 ? N - 1 : idx);

      /* telemetry: a few times a second while flying, exact when it stops; only figures that changed */
      if (!last && t - hudAt < HUD_MS) return;
      hudAt = t;
      const toSun = 1 - along;
      const au = toSun.toFixed(3);
      const km = Math.round(toSun * AU_KM / 1000) * 1000;
      const kmText = KM.format(km);
      const secs = Math.round((along * AU_KM) / C_KM_S);
      const delay = `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`;
      if (au !== shown.au && sunAuRef.current) sunAuRef.current.textContent = au;
      if (kmText !== shown.km && sunKmRef.current) sunKmRef.current.textContent = kmText;
      if (delay !== shown.delay && delayRef.current) delayRef.current.textContent = delay;
      shown = { au, km: kmText, delay };
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const layout = () => {
      const w = scene.clientWidth;
      const h = scene.clientHeight;
      const phone = window.matchMedia("(max-width: 820px)").matches;
      geo.w = w;
      geo.h = h;
      geo.au = 10 * Math.max(w, 700); // px per AU
      geo.shipX = Math.round(w * (phone ? 0.3 : 0.6));
      geo.lane = Math.round(h * (phone ? 0.7 : 0.8));
      scene.style.setProperty("--au", `${geo.au}px`);
      scene.style.setProperty("--lane", `${geo.lane}px`);
      scene.style.setProperty("--ship-x", `${geo.shipX}px`);
      /* each orbit crosses the lane as a sliver of a circle round the Sun */
      orbitRefs.current.forEach((svg, i) => {
        if (!svg) return;
        const r = ORBITS[i].au * geo.au;
        const half = h;
        const dx = r - Math.sqrt(r * r - half * half);
        svg.setAttribute("width", String(Math.ceil(dx) + 2));
        svg.setAttribute("height", String(half * 2));
        svg.setAttribute("viewBox", `0 0 ${Math.ceil(dx) + 2} ${half * 2}`);
        svg.firstElementChild?.setAttribute("d", `M${(dx + 1).toFixed(2)} 0A${r.toFixed(1)} ${r.toFixed(1)} 0 0 0 ${(dx + 1).toFixed(2)} ${half * 2}`);
      });
      kick();
    };

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(scene);
    window.addEventListener("scroll", kick, { passive: true });
    /* the scene's own CSS loops (flame, pulses, pings) stop while it is off screen */
    const io = new IntersectionObserver(([e]) => scene.toggleAttribute("data-off", !e.isIntersecting));
    io.observe(section);
    /* while the stage fills the screen, the site's star backdrop under it has nothing to draw (SpaceBackdrop) */
    const root = document.documentElement;
    const stage = section.querySelector(".story-stage");
    const cover = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= 0.95) root.dataset.stageCovered = "true";
        else delete root.dataset.stageCovered;
      },
      { threshold: [0, 0.95] },
    );
    if (stage) cover.observe(stage);
    return () => {
      ro.disconnect();
      io.disconnect();
      cover.disconnect();
      delete root.dataset.stageCovered;
      window.removeEventListener("scroll", kick);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* phones: the copy panel's height, from the tallest stop (as the 3D story measures it) */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const mq = window.matchMedia("(max-width: 820px)");
    const measure = () => {
      if (!mq.matches) return setPanel(null);
      let h = 0;
      el.querySelectorAll<HTMLElement>(".story-chapter").forEach((c) => {
        h = Math.max(h, c.scrollHeight);
      });
      setPanel(Math.min(Math.round(window.innerHeight * 0.52), Math.max(250, Math.ceil(h) + 28)));
    };
    measure();
    window.addEventListener("resize", measure);
    void document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const goToStop = (i: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    scrollToY(top + (el.offsetHeight - window.innerHeight) * CENTRES[i]);
  };

  const sections = useMemo(
    () => SECTIONS.map((sec) => ({ ...sec, first: stops.findIndex((s) => s.kind === sec.id) })).filter((sec) => sec.first >= 0),
    [stops],
  );
  /* the first paint shows stop 0; from then on the frame loop moves the state attributes (showStop) */
  const active = 0;
  const activeSection = 0;

  return (
    <section
      ref={sectionRef}
      data-section="story"
      aria-label="The CSAU story"
      className="story sr"
      style={{ height: STORY_HEIGHT, ...(panel ? ({ "--story-panel": `${panel}px` } as CSSProperties) : null) }}
    >
      <div className="story-rule" aria-hidden />

      <div className="story-stage">
        <div ref={sceneRef} className="story-canvas sr-scene" aria-hidden>
          <div ref={farRef} className="sr-stars sr-stars-far" />
          <div ref={nearRef} className="sr-stars sr-stars-near" />

          {/* the lane fades out behind the copy: what has been passed recedes */}
          <div className="sr-lanewrap">
          <div ref={worldRef} className="sr-world">
            <span className="sr-lane" />
            <span className="sr-ruler" />
            {TICKS.map((t) => (
              <span key={t} className="sr-tick" style={{ "--at": t } as CSSProperties}>
                {(1 - t).toFixed(1)} AU
              </span>
            ))}

            {ORBITS.map((o, i) => (
              <div key={o.id} className="sr-orbit" style={{ "--at": 1 - o.au } as CSSProperties}>
                <svg
                  ref={(el) => {
                    orbitRefs.current[i] = el;
                  }}
                  className="sr-orbit-arc"
                >
                  <path />
                </svg>
                <span className="sr-orbit-label">
                  {o.name} orbit · {o.au} AU
                </span>
                <span className={`sr-body sr-${o.id}`} style={{ "--lift": o.lift } as CSSProperties}>
                  <span className="sr-dot" />
                  <span className="sr-lens">
                    <Planet id={o.id} />
                  </span>
                  <span className="sr-body-label">{o.name} ×100</span>
                </span>
              </div>
            ))}

            <span className="sr-body sr-earth" style={{ "--at": 0, "--lift": 0.16 } as CSSProperties}>
              <span className="sr-dot" />
              <span className="sr-lens">
                <Planet id="earth" />
              </span>
              <span className="sr-body-label">Earth ×100</span>
            </span>

            <span className="sr-sun" style={{ "--at": 1 } as CSSProperties}>
              <span className="sr-body-label">Sun, to scale</span>
            </span>

            {stops.map((s, i) => (
              <span
                key={i}
                className="sr-beacon"
                data-state={i === active ? "active" : i < active ? "past" : "next"}
                style={{ "--at": alongAt(CENTRES[i]), "--h": i % 2 ? "44px" : "78px" } as CSSProperties}
              >
                <span className="sr-beacon-label">
                  <b>{pad(i + 1)}</b> {s.section}
                </span>
              </span>
            ))}
          </div>

          <div className="sr-linkclip">
            <div ref={linkRef} className="sr-link" />
          </div>
          </div>
          <div className="sr-ship">
            <span ref={trailRef} className="sr-trail" />
            <Ship />
          </div>

          <dl className="sr-hud">
            <div>
              <dt>To the Sun</dt>
              <dd>
                <span ref={sunAuRef}>0.000</span> AU
              </dd>
              <dd className="sr-hud-sub">
                <span ref={sunKmRef}>0</span> km
              </dd>
            </div>
            <div>
              <dt>Signal delay</dt>
              <dd>
                +<span ref={delayRef}>00:00</span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="story-copy">
          {stops.map((c, i) => {
            const state = i === active ? "active" : i < active ? "past" : "next";
            return (
              <article key={i} className="story-chapter" data-state={state} data-kind={c.kind} aria-hidden={state !== "active"}>
                <div className="story-eyebrow">
                  {c.count && <span className="story-no">{c.count.replace(" / ", " of ").replace(/^0/, "").replace(" of 0", " of ")}</span>}
                  <span>{c.eyebrow}</span>
                </div>
                <h2 className="story-title">
                  {c.lines.map((line, li) => (
                    <span className="story-line" key={li}>
                      <span style={{ transitionDelay: `${li * 90}ms` }}>{renderMark(line, c.mark)}</span>
                    </span>
                  ))}
                </h2>
                <p className="story-body">{c.body}</p>
                {c.meta && (
                  <ul className="story-meta">
                    {c.meta.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                )}
                {c.cta && (
                  <div className="story-cta">
                    {c.cta.map((b) =>
                      isExternal(b.href) ? (
                        <a
                          key={b.href + b.label}
                          href={b.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={b.ghost ? "btn story-btn-ghost" : "btn story-btn"}
                        >
                          {b.label}
                        </a>
                      ) : (
                        <Link
                          key={b.href + b.label}
                          href={b.href}
                          className={b.ghost ? "btn story-btn-ghost" : "btn story-btn"}
                        >
                          {b.label}
                        </Link>
                      ),
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <nav className="story-rail" aria-label="Story sections">
          {sections.map((sec, si) => (
            <button
              key={sec.id}
              type="button"
              className="story-tick"
              data-first={sec.first}
              data-on={si === activeSection}
              data-done={si < activeSection}
              onClick={() => goToStop(sec.first)}
              aria-label={`Go to ${sec.label}`}
              aria-current={si === activeSection}
            >
              <span className="story-tick-label">{sec.label}</span>
              <span className="story-tick-bar" />
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}

function renderMark(line: string, mark?: string) {
  if (!mark) return line;
  const idx = line.indexOf(mark);
  if (idx < 0) return line;
  return (
    <>
      {line.slice(0, idx)}
      <span className="mark">{mark}</span>
      {line.slice(idx + mark.length)}
    </>
  );
}

/** The blade ship in profile, black and red, nose to the Sun (right). */
function Ship() {
  return (
    <svg className="sr-ship-body" viewBox="0 0 124 44" fill="none" strokeLinejoin="round">
      <path className="sr-flame" d="M14 18.5L1 22l13 3.5z" fill="var(--signal)" />
      <path d="M40 15.5C70 3 98 4 121 11.5 96 9 72 12 52 19z" fill="#0b0b0d" stroke="var(--dim-300)" strokeOpacity=".6" />
      <path d="M40 28.5C70 41 98 40 121 32.5 96 35 72 32 52 25z" fill="#0b0b0d" stroke="var(--dim-300)" strokeOpacity=".6" />
      <path d="M52 18.6C72 11.8 96 9.4 118 11.6M52 25.4C72 32.2 96 34.6 118 32.4" stroke="var(--signal)" strokeWidth="1" />
      <path d="M14 17.5L58 13.5 94 18.5C102 19.8 107 21 109 22 107 23 102 24.2 94 25.5L58 30.5 14 26.5z" fill="#141519" stroke="var(--dim-300)" strokeOpacity=".75" />
      <path d="M62 15.6L92 19.6 92 24.4 62 28.4z" fill="#1d1f24" />
      <path d="M22 22H100" stroke="var(--signal)" strokeWidth=".7" opacity=".85" />
      <circle cx="70" cy="19.6" r="1.1" fill="var(--signal)" />
      <circle cx="78" cy="19.9" r="1.1" fill="var(--signal)" />
      <ellipse cx="15" cy="22" rx="2.4" ry="5.2" stroke="var(--signal)" strokeWidth="1.1" />
    </svg>
  );
}

/** The lens view of a planet, lit from the Sun on the right. */
function Planet({ id }: { id: "earth" | "venus" | "mercury" }) {
  const g = `sr-g-${id}`;
  const c = `sr-c-${id}`;
  const n = `sr-n-${id}`;
  const fill = {
    earth: ["#a9cdf2", "#3b6fae", "#14345f", "#061023"],
    venus: ["#f4e6bf", "#d7b77a", "#8f6a3c", "#22170c"],
    mercury: ["#d8d2ca", "#9a948c", "#57534e", "#151413"],
  }[id];
  return (
    <svg viewBox="0 0 100 100">
      <defs>
        <radialGradient id={g} cx="66%" cy="42%" r="72%">
          <stop offset="0" stopColor={fill[0]} />
          <stop offset=".38" stopColor={fill[1]} />
          <stop offset=".72" stopColor={fill[2]} />
          <stop offset="1" stopColor={fill[3]} />
        </radialGradient>
        <clipPath id={c}>
          <circle cx="50" cy="50" r="49" />
        </clipPath>
        <linearGradient id={n} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".94" />
          <stop offset=".4" stopColor="#000" stopOpacity=".86" />
          <stop offset=".62" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${c})`}>
        <circle cx="50" cy="50" r="49" fill={`url(#${g})`} />
        {id === "earth" && (
          <g>
            <path d="M58 18c7 0 12 4 11 9-1 4-6 4-7 8s3 7 2 11-6 6-9 3-2-8-5-11-6-4-5-9 6-11 13-11z" fill="#4f6b3f" opacity=".75" />
            <path d="M72 54c5 0 9 4 8 9s-5 9-9 8-5-5-4-9 1-8 5-8z" fill="#58733f" opacity=".7" />
            <path d="M30 34c12-5 30-6 48-3M26 60c16 4 34 4 52-2M44 80c10 2 22 1 32-3" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".35" />
          </g>
        )}
        {id === "venus" && <path d="M10 38c24-8 52-8 82 2M8 58c26 6 54 6 84-4" stroke="#fff6dc" strokeWidth="5" opacity=".25" />}
        {id === "mercury" && (
          <g fill="#3d3a36" opacity=".55">
            <circle cx="62" cy="34" r="6" />
            <circle cx="74" cy="60" r="4" />
            <circle cx="50" cy="66" r="7" />
          </g>
        )}
        {/* the night side, away from the Sun */}
        <rect x="0" y="0" width="100" height="100" fill={`url(#${n})`} />
      </g>
    </svg>
  );
}
