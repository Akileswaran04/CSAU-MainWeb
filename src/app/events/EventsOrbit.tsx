"use client";

import { useEffect, useMemo, useRef, useState, type FocusEvent, type ReactNode } from "react";
import Link from "next/link";
import { archiveYears, isExternal, sanityImage, type PastEvent, type UpcomingEvent } from "@/data/events";
import EventPoster from "@/components/EventPoster";
import { lockScroll } from "@/lib/scrollLock";

/* ============================================================
   EVENTS ORBIT (client) - the page around one orbit.

     • HERO: the title, under it Upcoming & Current (or the empty
       launchpad when nothing is) in colour, then the way to get
       in touch (children). They rise in as the page opens.
     • ARCHIVE: a stage that holds still at the top of the screen
       for a stretch of scroll. Two huge arcs across it and a dark
       planet risen at the bottom, its rim glowing, the year pills
       in its middle. One ring of the chosen year's cards (glass,
       the poster in colour, the name, the date and where) rides
       the upper arc on its own, left to right: largest at the
       centre, where it is ringed in gold under a gold mark, and
       smaller and closer together towards the ends, as if the arc
       turned away. Pointing at or focusing a card holds the flow;
       selecting it opens the entry.
     • the year pills pick the year (kept in the URL hash, #2025).
     • scrolling into the archive, rings round the planet expand
       and the planet grows (--p). Once it holds still, the intro
       plays: the stars fade in, the arcs draw, the years rise,
       then the cards spread out from the centre. Scrolled back
       up, it runs backwards: the cards draw back into the centre,
       the years sink, the arcs undraw, the dark returns; down
       again, it plays again. A new year spreads out the same way.
       Under reduced motion the intro does not play and the flow
       starts paused.
     • one scroll (wheel, swipe or paging key) glides the whole
       page: from the top down to the archive's end, or back up.
     • a ringed target follows the mouse; a ring at the bottom
       right shows how far down the page you are.
   ============================================================ */

const CROSS_S = 15; // seconds for a card to cross the screen. ponytail: set by eye
const WARP = 0.2; // the cards crowd towards the ends: spaced x1.2 at the centre, /1.2 at the ends
const SHRINK = 0.3; // a card at the very end is this much smaller than the centre one
const GAP = 18; // px between neighbours, at the centre's size
const AFTER_LOADER_MS = 700; // the route loader is mostly faded by then (LoadingOverlay: 1.1s after 0.2s)
const INTRO_AT = 0.7; // how far through the archive's scroll (--p) its intro starts: just after the stage holds still
const OUT_AT = 0.55; // scrolled back above this (the stage has let go), it runs backwards. The gap stops it flickering
const INTRO_CARDS_MS = 1350; // the cards come after the arcs
const SPREAD_MS = 1100; // the cards fanning out from the centre along the arcs
const RETRACT_MS = 750; // and drawing back into it
const GLIDE_MS = 1800; // one scroll's glide from the top to the end of the page
const RINGS = [260, 390, 540, 710, 900]; // the rings round the planet (viewBox units)
/* a few lights riding the rings: [ring, angle in degrees from the top] */
const RING_DOTS = [[1, -38], [2, 24], [2, -71], [3, 52], [3, -18], [4, -46], [4, 33]] as const;

const LEAD = "Upcoming & Current";
const PAD_NAME = "Nothing on the launchpad right now";
const PAD_TEXT =
  "There are no upcoming events scheduled at the moment. Check the archive below for what we've run, or follow along for the next drop.";

const pad = (n: number) => String(n).padStart(2, "0");
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const ease = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const mod = (a: number, n: number) => ((a % n) + n) % n;
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** One card on the ring: an upcoming event, the empty launchpad (nothing upcoming), or an archived event. */
type Item = { up: UpcomingEvent } | { pad: true } | { past: PastEvent };
const keyOf = (it: Item) => ("past" in it ? it.past.id : "up" in it ? `up:${it.up.id}` : "pad");
const nameOf = (it: Item) => ("past" in it ? it.past.name : "up" in it ? it.up.name : PAD_NAME);

/** The orbit's shape at the stage's current size (px, stage coordinates). */
interface Geo {
  cw: number; // card width
  du: number; // the spacing of the cards, as a share of the arc (before WARP)
  cx: number;
  cy: number;
  r: [number, number]; // outer, inner arc radius
  half: [number, number]; // half the angle each arc spans across the screen
}

/** The flow, read and written by the frame loop (no re-renders). */
interface Flow {
  offset: number;
  vel: number;
  seek: number;
  hover: boolean;
  focus: boolean;
  stop: boolean;
  visible: boolean;
  goal: 0 | 1; // the cards spread out on the arcs (1) or drawn back into the centre (0)
  spreadAt: number; // when they set off towards it
  spread: number; // how far they are, 0 (at the centre, unseen) to 1 (each in its place)
  wake: () => void;
}

/** A point on arc k, u from 0 (just off the left edge) to 1 (just off the right). */
const at = (g: Geo, k: number, u: number): [number, number] => {
  const a = (u * 2 - 1) * g.half[k];
  return [g.cx + g.r[k] * Math.sin(a), g.cy - g.r[k] * Math.cos(a)];
};
/** Where a card at u sits on the upper arc, and its size: crowding and shrinking towards the ends. */
const cardAt = (g: Geo, u: number): [number, number, number] => {
  const t = 2 * u - 1;
  const w = (t * (1 + WARP)) / (1 + WARP * Math.abs(t)); // -1 to 1, as t, but closer together near the ends
  const a = w * g.half[0];
  return [g.cx + g.r[0] * Math.sin(a), g.cy - g.r[0] * Math.cos(a), 1 - SHRINK * Math.abs(w)];
};
const arcPath = (g: Geo, k: number, u0: number, u1: number) => {
  const [x0, y0] = at(g, k, u0);
  const [x1, y1] = at(g, k, u1);
  const r = g.r[k].toFixed(1);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};

/** The empty launch pad, drawn in hairlines: three points of sky above the mast. */
function LaunchPad() {
  return (
    <div className="ev-poster evo-pad">
      <svg viewBox="0 0 160 132" aria-hidden focusable="false">
        <g className="evo-pad-sky">
          <circle cx="80" cy="16" r="1.4" />
          <circle cx="80" cy="34" r="1.4" />
          <circle cx="80" cy="52" r="1.4" />
        </g>
        <path d="M108 30 V96 M108 44 H96 M108 66 H96" />
        <path d="M62 96 H118 M44 108 H136 M30 120 H150" />
      </svg>
    </div>
  );
}

const Calendar = () => (
  <svg className="evo-cal" viewBox="0 0 12 12" aria-hidden focusable="false">
    <rect x="1.5" y="2.5" width="9" height="8" rx="1" />
    <path d="M1.5 5.5h9M4 1v3M8 1v3" />
  </svg>
);

/** A card's face: the poster, the name (which opens the entry), the date and how it ran or its status. */
function CardBody({ it, onOpen }: { it: Item; onOpen: () => void }) {
  const ev = "past" in it ? it.past : "up" in it ? it.up : null;
  return (
    <>
      {ev ? <EventPoster name={ev.name} tag={ev.tag} poster={ev.poster} loading="eager" /> : <LaunchPad />}
      <h3 className="evo-name">
        <button type="button" className="evo-open" aria-haspopup="dialog" onClick={onOpen}>
          {nameOf(it)}
        </button>
      </h3>
      {"past" in it ? (
        <div className="evo-meta tabular">
          <Calendar />
          {`${it.past.date}${it.past.tag ? ` · ${it.past.tag}` : ""}`}
        </div>
      ) : (
        "up" in it && (
          <div className="evo-meta tabular">
            <Calendar />
            {it.up.date} · <span className="evo-status">{it.up.status}</span>
          </div>
        )
      )}
    </>
  );
}

function EntryPanel({
  items,
  index,
  onGo,
  onClose,
}: {
  items: Item[];
  index: number;
  onGo: (i: number) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const it = items[index];
  const prev = items[index - 1];
  const next = items[index + 1];
  const past = "past" in it ? it.past : null;
  const up = "up" in it ? it.up : null;
  const ev = past ?? up;
  /* where it sits: its year in the archive, or among the upcoming */
  const group = items.filter((x) => (past ? "past" in x && x.past.year === past.year : !("past" in x)));
  const text = past ? past.log || past.blurb : up ? up.blurb : PAD_TEXT;
  const photos = past?.photos ?? [];

  /* lock the page and move focus in; undo both on close */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const release = lockScroll();
    closeRef.current?.focus();
    return () => {
      release();
      opener?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [index]);

  useEffect(() => {
    const onKey = (k: KeyboardEvent) => {
      if (k.key === "Escape") onClose();
      else if (k.key === "ArrowLeft" && index > 0) onGo(index - 1);
      else if (k.key === "ArrowRight" && index < items.length - 1) onGo(index + 1);
      else if (k.key === "Tab") {
        // keep focus inside the panel
        const all = panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        if (!all?.length) return;
        const first = all[0];
        const last = all[all.length - 1];
        const inside = panelRef.current?.contains(document.activeElement);
        if (k.shiftKey && (document.activeElement === first || !inside)) {
          k.preventDefault();
          last.focus();
        } else if (!k.shiftKey && (document.activeElement === last || !inside)) {
          k.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, items.length, onGo, onClose]);

  return (
    <div className="dm-detail evo-panel" role="dialog" aria-modal="true" aria-labelledby="evo-panel-name">
      <button type="button" className="dm-detail-scrim" aria-label="Close entry" tabIndex={-1} onClick={onClose} />
      <div ref={panelRef} className="dm-detail-panel evo-panel-sheet">
        <div className="dm-detail-head">
          <span className="dm-detail-index tabular">
            {past ? past.year : LEAD}
            {group.length > 1 && ` · ${pad(group.indexOf(it) + 1)} / ${pad(group.length)}`}
          </span>
          <button type="button" ref={closeRef} className="tm-step" aria-label="Close entry" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="evo-panel-body" key={keyOf(it)}>
          <h3 id="evo-panel-name" className="evo-panel-name">
            {nameOf(it)}
          </h3>
          <div className="evo-panel-poster">
            {ev ? <EventPoster name={ev.name} tag={ev.tag} poster={ev.poster} /> : <LaunchPad />}
          </div>
          {ev && (
            <dl className="evo-facts">
              <div>
                <dt>Date</dt>
                <dd className="tabular">{ev.date}</dd>
              </div>
              {ev.tag && (
                <div>
                  <dt>How it ran</dt>
                  <dd>{ev.tag}</dd>
                </div>
              )}
              {past?.stat && (
                <div>
                  <dt>Location</dt>
                  <dd className="ev-stat">{past.stat}</dd>
                </div>
              )}
              {up && (
                <div>
                  <dt>Status</dt>
                  <dd className="evo-status">{up.status}</dd>
                </div>
              )}
            </dl>
          )}
          {text && <p className="evo-log">{text}</p>}
          {up?.href &&
            up.cta &&
            (isExternal(up.href) ? (
              <a
                href={up.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-signal evo-cta"
                aria-label={`${up.cta}: ${up.name}. Opens in a new tab.`}
              >
                {up.cta} ↗
              </a>
            ) : (
              <Link href={up.href} data-route-load className="btn btn-signal evo-cta">
                {up.cta} →
              </Link>
            ))}
          {photos.length > 0 && past && (
            <ul className="ev-photos" aria-label={`Photos from ${past.name}`}>
              {photos.map((photo, i) => (
                <li key={photo}>
                  <a
                    className="ev-photo"
                    href={sanityImage(photo, 1600)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Photo ${i + 1} of ${photos.length} from ${past.name}. Opens in a new tab.`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sanityImage(photo, 192, 144)} alt="" width={96} height={72} decoding="async" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav className="evo-panel-nav" aria-label="Browse the events">
          <button
            type="button"
            disabled={!prev}
            onClick={() => onGo(index - 1)}
            aria-label={prev ? `Previous: ${nameOf(prev)}` : "Previous"}
          >
            <span>← Previous</span>
            {prev && <span className="evo-panel-nav-name">{nameOf(prev)}</span>}
          </button>
          <button
            type="button"
            disabled={!next}
            onClick={() => onGo(index + 1)}
            aria-label={next ? `Next: ${nameOf(next)}` : "Next"}
          >
            <span>Next →</span>
            {next && <span className="evo-panel-nav-name">{nameOf(next)}</span>}
          </button>
        </nav>
      </div>
    </div>
  );
}

/** The ringed target that follows the mouse: the dot at once, the rings a little behind. */
function Target() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const main = el?.closest("main");
    const ring = el?.firstElementChild as HTMLElement | null;
    const dot = el?.lastElementChild as HTMLElement | null;
    if (!el || !main || !ring || !dot || !window.matchMedia("(pointer: fine)").matches || still()) return;
    main.classList.add("evo-nocursor");
    let x = 0;
    let y = 0;
    let rx = 0;
    let ry = 0;
    let raf = 0;
    let on = false;
    const tick = () => {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
      raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.2 ? requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const t = e.target as Element;
      const inside = main.contains(t);
      x = e.clientX;
      y = e.clientY;
      if (inside && !on) {
        rx = x; // appear at the pointer, not glide in from where it left
        ry = y;
      }
      on = inside;
      el.toggleAttribute("data-on", inside);
      el.toggleAttribute("data-hot", inside && !!t.closest("a, button"));
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const out = (e: PointerEvent) => {
      if (e.relatedTarget) return;
      on = false;
      el.removeAttribute("data-on");
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerout", out);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerout", out);
      cancelAnimationFrame(raf);
      main.classList.remove("evo-nocursor");
    };
  }, []);

  return (
    <div ref={ref} className="evo-target" aria-hidden>
      <span className="evo-target-ring" />
      <span className="evo-target-dot" />
    </div>
  );
}

export default function EventsOrbit({
  past,
  current,
  head,
  children,
}: {
  past: PastEvent[];
  current: UpcomingEvent[];
  head: ReactNode;
  children: ReactNode;
}) {
  /* upcoming and current (or the empty launchpad) under the title; the ring is one year of the archive.
     The entry panel browses them all: the lead first, then the archive, newest first */
  const { years, lead, all, byYear } = useMemo(() => {
    const years = archiveYears(past);
    const lead: Item[] = current.length ? current.map((up) => ({ up })) : [{ pad: true }];
    const archive = past.map((ev) => ({ past: ev }));
    return {
      years,
      lead,
      all: [...lead, ...archive],
      byYear: new Map(years.map((y) => [y, archive.filter((it) => it.past.year === y)])),
    };
  }, [past, current]);

  const [year, setYear] = useState(years[0] ?? "");
  const [shown, setShown] = useState(year); // the set on the orbit; follows `year` once the old set has faded
  const [hero, setHero] = useState<"wait" | "play" | "done">("wait");
  const [intro, setIntro] = useState<"out" | "in">("out");
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [placed, setPlaced] = useState(false);

  const archRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const planetRef = useRef<HTMLDivElement>(null);
  const archP = useRef(0); // how far through the archive's scroll, 0 to 1
  const stageTo = useRef<(on: boolean) => void>(() => {}); // plays (true) or reverses (false) the archive's intro; armed once the hero has played
  const progRef = useRef<SVGSVGElement>(null);
  const arcEls = useRef<(SVGPathElement | null)[]>([]);
  const apexRef = useRef<HTMLElement>(null);
  const cardEls = useRef<(HTMLLIElement | null)[]>([]);
  const geo = useRef<Geo | null>(null);
  const swap = useRef(0);
  const flow = useRef<Flow>({
    offset: 0,
    vel: 0,
    seek: 0,
    hover: false,
    focus: false,
    stop: false,
    visible: true,
    goal: 0,
    spreadAt: 0,
    spread: 0,
    wake: () => {},
  });

  const list = useMemo(() => byYear.get(shown) ?? [], [byYear, shown]);

  const pick = (y: string) => {
    if (y === year) return;
    setYear(y);
    history.replaceState(history.state, "", `#${y}`);
    clearTimeout(swap.current);
    swap.current = window.setTimeout(() => setShown(y), still() ? 0 : 240); // the old set fades out first
  };

  /** Bring card i of the ring to the centre (a focused card). */
  const centre = (i: number) => {
    const f = flow.current;
    const g = geo.current;
    if (!g) return;
    const span = Math.max(list.length * g.du, 1 + g.du);
    let d = mod(0.5 - (f.offset - i * g.du), span);
    if (d > span / 2) d -= span;
    if (still()) f.offset += d;
    else f.seek = d;
    f.wake();
  };

  /* the year in the hash: read on load and whenever it is edited */
  useEffect(() => {
    const fromHash = () => {
      const y = decodeURIComponent(location.hash.slice(1));
      if (byYear.has(y)) {
        setYear(y);
        setShown(y);
      }
    };
    const r = requestAnimationFrame(fromHash);
    window.addEventListener("hashchange", fromHash);
    return () => {
      cancelAnimationFrame(r);
      window.removeEventListener("hashchange", fromHash);
    };
  }, [byYear]);

  /* the intros: the hero's as the page opens (as the route loader fades, or at once when there is none);
     the archive's plays once it is scrolled INTRO_AT through and runs backwards above OUT_AT (the scroll
     effect below calls stageTo) */
  useEffect(() => {
    const timers: number[] = [];
    let on = false;
    const to = (next: boolean) => {
      if (next === on) return;
      on = next;
      const f = flow.current;
      f.goal = next ? 1 : 0;
      f.spreadAt = performance.now() + (next ? INTRO_CARDS_MS : 0); // in: after the arcs; back: at once
      f.wake();
      setIntro(next ? "in" : "out");
    };
    const play = () => {
      if (still()) {
        const f = flow.current;
        f.goal = 1;
        f.spread = 1;
        f.stop = true; // paused from the first frame (the effect below keeps it in step)
        setPaused(true);
        setHero("done");
        setIntro("in");
        return;
      }
      setHero("play");
      stageTo.current = to;
      to(archP.current >= INTRO_AT); // already scrolled there (a restored scroll)
    };
    const afterLoader = () => timers.push(window.setTimeout(play, AFTER_LOADER_MS));
    const r = requestAnimationFrame(() => {
      const gate = document.querySelector<HTMLElement>(".rl-root");
      if (gate && gate.style.opacity !== "0" && !still()) window.addEventListener("route-reveal", afterLoader, { once: true });
      else play();
    });
    return () => {
      cancelAnimationFrame(r);
      window.removeEventListener("route-reveal", afterLoader);
      timers.forEach(clearTimeout);
      stageTo.current = () => {};
    };
  }, []);

  useEffect(() => {
    flow.current.stop = paused || open !== null;
  }, [paused, open]);

  /* the orbit's shape: from the stage's size and where the planet rises */
  useEffect(() => {
    const stage = stageRef.current;
    const planet = planetRef.current;
    if (!stage || !planet) return;
    const relayout = () => {
      stage.style.minHeight = "";
      const w = stage.clientWidth;
      const bandTop = parseFloat(getComputedStyle(stage).paddingTop);
      const floor = () => planet.offsetTop - 18;
      /* a card is its glass, the poster (4:5) in it, then the name and the date: more lines on a narrow card */
      const text = (c: number) => (c < 150 ? 130 : 100);
      /* the band the centre card needs, hung just under the top of the arc */
      const fit = (c: number) => 28 + c * 1.25 + text(c);
      const need = fit(112); // the smallest card that still reads
      if (floor() - bandTop < need) {
        stage.style.minHeight = `${stage.offsetHeight + need - (floor() - bandTop)}px`; // phones: the stage grows
      }
      stage.style.top = `${Math.min(0, window.innerHeight - stage.offsetHeight)}px`; // taller than the screen: holds by its bottom
      const band = floor() - bandTop;
      let cw = clamp(Math.min(w * 0.17, (band - 128) / 1.25), 112, 240);
      if (fit(cw) > band) cw = clamp((band - 158) / 1.25, 112, 240);
      const st = cw * 0.5; // how much lower the inner arc runs (an orbit line behind the cards)
      const y2 = bandTop + Math.max(0, band - fit(cw)) * 0.35;
      const X = w / 2 + (cw * (1 - SHRINK)) / 2 + 24; // a card at either end is just off the screen
      const s = clamp(w * 0.075, 32, 110); // how far the arcs fall to the edges
      const r2 = (X * X + s * s) / (2 * s);
      const r1 = r2 - st;
      const g: Geo = { cw, du: 0, cx: w / 2, cy: y2 + r2, r: [r2, r1], half: [Math.asin(X / r2), Math.asin(Math.min(1, X / r1))] };
      /* the spacing: the smallest at which no two neighbours touch, anywhere along the arc */
      const clear = (du: number) => {
        for (let u = 0; u + du <= 1; u += 0.025) {
          const [x0, , s0] = cardAt(g, u);
          const [x1, , s1] = cardAt(g, u + du);
          if (x1 - x0 < (cw * (s0 + s1)) / 2 + GAP * s1) return false;
        }
        return true;
      };
      g.du = 0.04;
      while (g.du < 0.45 && !clear(g.du)) g.du += 0.005;
      geo.current = g;
      stage.style.setProperty("--cw", `${cw.toFixed(1)}px`);
      arcEls.current.forEach((p, k) => p?.setAttribute("d", arcPath(g, k, 0, 1)));
      apexRef.current?.style.setProperty("translate", `${g.cx.toFixed(1)}px ${(g.cy - r2).toFixed(1)}px`);
      flow.current.wake();
    };
    relayout();
    const ro = new ResizeObserver(relayout);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  /* the flow: one loop moves the ring's cards along the arcs */
  useEffect(() => {
    const f = flow.current;
    const n = list.length;
    const cards = cardEls.current;
    cards.length = n;
    const seen = list.map(() => ({ hidden: undefined as boolean | undefined, c: false }));
    if (f.goal === 1 && !still()) {
      // a new year spreads in from the centre
      f.spread = 0;
      f.spreadAt = Math.max(f.spreadAt, performance.now() + 60);
    }
    f.vel = 0;
    f.seek = 0;
    let raf = 0;
    let last = performance.now();
    let first = true;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = geo.current;
      if (g) {
        if (first) {
          first = false;
          f.offset = 0.5 + g.du * 0.3; // the ring's first card starts at the centre
          setPlaced(true);
        }
        const want = f.stop || f.hover || f.focus || f.goal === 0 || now < f.spreadAt ? 0 : 1 / CROSS_S;
        f.vel += (want - f.vel) * Math.min(1, dt * 3);
        if (f.seek) {
          const step = Math.abs(f.seek) < 1e-4 ? f.seek : f.seek * Math.min(1, dt * 5);
          f.offset += step;
          f.seek -= step;
        }
        f.offset += f.vel * dt;
        const span = Math.max(n * g.du, 1 + g.du);
        if (now >= f.spreadAt && f.spread !== f.goal) {
          const step = (dt * 1000) / (f.goal ? SPREAD_MS : RETRACT_MS);
          f.spread = f.goal ? Math.min(1, f.spread + step) : Math.max(0, f.spread - step);
        }
        const spread = ease(0, 1, f.spread);
        const fade = ease(0, 0.27, f.spread); // they show as they leave the centre, and go as they reach it
        for (let i = 0; i < n; i++) {
          const el = cards[i];
          if (!el) continue;
          const s = seen[i];
          const at0 = mod(f.offset - i * g.du, span);
          if (at0 > 1) {
            if (s.hidden !== true) {
              // off the arc: waits unseen mid-stage, so its poster still loads
              s.hidden = true;
              el.toggleAttribute("data-hidden", true);
              el.style.opacity = "0";
              const [x, y] = at(g, 0, 0.5);
              el.style.transform = `translate3d(${(x - g.cw / 2).toFixed(1)}px, ${(y + 12).toFixed(1)}px, 0)`;
            }
            continue;
          }
          if (s.hidden !== false) {
            s.hidden = false;
            el.toggleAttribute("data-hidden", false);
          }
          const u = 0.5 + (at0 - 0.5) * spread;
          const [x, y, sc] = cardAt(g, u);
          const o = ease(0, 0.06, u) * (1 - ease(0.94, 1, u)) * fade;
          el.style.transform = `translate3d(${(x - g.cw / 2).toFixed(1)}px, ${(y + 12).toFixed(1)}px, 0) scale(${sc.toFixed(3)})`;
          el.style.opacity = o.toFixed(3);
          const c = Math.abs(at0 - 0.5) < g.du / 2; // where it is headed: one gold card, even mid-spread
          if (c !== s.c) el.toggleAttribute("data-c", (s.c = c));
        }
      }
      if (f.visible) raf = requestAnimationFrame(frame);
    };
    f.wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    f.wake();
    return () => {
      cancelAnimationFrame(raf);
      f.wake = () => {};
    };
  }, [list]);

  /* the loop sleeps while the stage is off the screen */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const io = new IntersectionObserver(([e]) => {
      flow.current.visible = e.isIntersecting;
      if (e.isIntersecting) flow.current.wake();
    });
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  /* the page's scroll: the ring at the bottom right, and the archive's (--p, 0 to 1: from its top entering
     the screen until the stage lets go), which expands the rings, grows the planet and starts the intro */
  useEffect(() => {
    const ring = progRef.current;
    const arch = archRef.current;
    const stage = stageRef.current;
    if (!ring || !arch || !stage) return;
    const dots = Array.from(ring.querySelectorAll<SVGCircleElement>(".evo-progress-dot"));
    let marks: number[] = [];
    let raf = 0;
    const room = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const update = () => {
      raf = 0;
      const p = clamp(window.scrollY / room(), 0, 1);
      ring.style.setProperty("--p", p.toFixed(4));
      marks.forEach((m, i) => dots[i].toggleAttribute("data-on", p >= m - 0.002));
      const vh = window.innerHeight;
      const r = arch.getBoundingClientRect();
      const q = clamp((vh - r.top) / Math.max(1, vh + r.height - stage.offsetHeight), 0, 1);
      archP.current = q;
      stage.style.setProperty("--p", q.toFixed(4));
      if (q >= INTRO_AT) stageTo.current(true);
      else if (q < OUT_AT) stageTo.current(false);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    /* one dot on the ring where each section starts */
    const measure = () => {
      marks = [arch].map((el) => clamp((el.getBoundingClientRect().top + window.scrollY) / room(), 0, 1));
      marks.forEach((m, i) => {
        const a = m * Math.PI * 2 - Math.PI / 2;
        dots[i].setAttribute("cx", (22 + 18 * Math.cos(a)).toFixed(2));
        dots[i].setAttribute("cy", (22 + 18 * Math.sin(a)).toFixed(2));
      });
      onScroll();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  /* one scroll goes all the way: a single turn of the wheel, swipe or paging key glides the page down to its end
     (the rings expand, the stage holds, the intro plays on the way) or back up to the top (and it all reverses).
     Not while an overlay holds the scroll lock (the entry panel, the menu), and at once under reduced motion. */
  useEffect(() => {
    let raf = 0;
    let gliding = false;
    let touchY: number | null = null;
    const bottom = () => document.documentElement.scrollHeight - window.innerHeight;
    const locked = () => document.documentElement.classList.contains("scroll-locked");
    const glide = (down: boolean) => {
      const from = window.scrollY;
      const to = down ? bottom() : 0;
      if (gliding || Math.abs(to - from) < 2) return;
      if (still()) return window.scrollTo(0, to);
      gliding = true;
      const t0 = performance.now();
      const ms = GLIDE_MS * (0.5 + 0.5 * Math.min(1, Math.abs(to - from) / Math.max(1, bottom())));
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / ms);
        const e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2; // ease in and out
        window.scrollTo(0, from + (to - from) * e);
        if (k < 1) raf = requestAnimationFrame(step);
        else gliding = false;
      };
      raf = requestAnimationFrame(step);
    };
    const onWheel = (e: WheelEvent) => {
      if (locked() || e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // ctrl: zooming; sideways: not ours
      e.preventDefault(); // the glide does the scrolling (and swallows a trackpad's run-on)
      glide(e.deltaY > 0);
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY = !locked() && e.touches.length === 1 ? e.touches[0].clientY : null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY === null || e.touches.length !== 1) return;
      e.preventDefault();
      const dy = touchY - e.touches[0].clientY;
      if (Math.abs(dy) > 24) {
        touchY = null;
        glide(dy > 0);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (locked() || e.altKey || e.ctrlKey || e.metaKey || t.closest("input, textarea, select, [contenteditable]")) return;
      const space = e.key === " " && !t.closest("button, a"); // on a button, Space presses it
      const down = ["PageDown", "ArrowDown", "End"].includes(e.key) || (space && !e.shiftKey);
      const up = ["PageUp", "ArrowUp", "Home"].includes(e.key) || (space && e.shiftKey);
      if (!down && !up) return;
      e.preventDefault();
      glide(down);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  /* keyboard: a focused card is brought to the centre and holds the flow */
  const onCardsFocus = (e: FocusEvent<HTMLOListElement>) => {
    flow.current.focus = true;
    const i = cardEls.current.indexOf((e.target as Element).closest("li"));
    if (i >= 0 && (e.target as Element).matches(":focus-visible")) centre(i);
  };
  const onCardsBlur = (e: FocusEvent<HTMLOListElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) flow.current.focus = false;
  };

  const go = (i: number) => {
    setOpen(i);
    const it = all[i];
    if ("past" in it) pick(it.past.year);
  };

  return (
    <>
      <div className="evo-hero" data-intro={hero}>
        <div className="evo-top">{head}</div>
        <section className="evo-up" aria-labelledby="evo-up-h">
          <h2 id="evo-up-h" className="evo-label evo-up-head">
            <span className="evo-up-dot" data-on={current.length > 0 || undefined} aria-hidden />
            {LEAD}
            {current.length > 0 && <span className="evo-up-count tabular">{current.length}</span>}
          </h2>
          <ul className="evo-up-row">
            {lead.map((it, i) => (
              <li key={keyOf(it)} className="evo-card" data-lead="" data-c="" style={{ ["--i" as string]: i }}>
                <CardBody it={it} onOpen={() => setOpen(all.indexOf(it))} />
              </li>
            ))}
          </ul>
        </section>
        {children}
      </div>

      <div ref={archRef} className="evo-arch">
        <div ref={stageRef} className="evo-stage" data-intro={intro}>
          <svg className="evo-rings" viewBox="-1000 -1000 2000 2000" aria-hidden focusable="false">
            {RING_DOTS.map(([i, deg]) => (
              <circle
                key={`${i}${deg}`}
                className="evo-ring-dot"
                r="4"
                cx={(RINGS[i] * Math.sin((deg * Math.PI) / 180)).toFixed(1)}
                cy={(-RINGS[i] * Math.cos((deg * Math.PI) / 180)).toFixed(1)}
                style={{ ["--k" as string]: 0.35 + i * 0.25 }}
              />
            ))}
            {RINGS.map((r, i) => (
              <circle key={r} r={r} style={{ ["--k" as string]: 0.35 + i * 0.25 }} />
            ))}
          </svg>

          <svg className="evo-arcs" aria-hidden focusable="false">
            <path
              ref={(p) => {
                arcEls.current[0] = p;
              }}
              className="evo-arc"
              pathLength={1}
            />
            <path
              ref={(p) => {
                arcEls.current[1] = p;
              }}
              className="evo-arc"
              pathLength={1}
            />
          </svg>
          {/* the gold mark at the top of the arc, over the centre card */}
          <i ref={apexRef} className="evo-apex" aria-hidden />

          {years.length > 0 && (
            <div className="evo-years">
              <div className="evo-years-head">
                <h2 id="ev-archive-h" className="evo-label">
                  Archive
                </h2>
                <button
                  type="button"
                  className="evo-chip evo-play"
                  aria-label={paused ? "Play" : "Pause"}
                  onClick={() => setPaused((p) => !p)}
                >
                  <span aria-hidden>{paused ? "▶" : "❚❚"}</span>
                </button>
              </div>
              <div className="evo-years-row" role="group" aria-labelledby="ev-archive-h">
                {years.map((y) => (
                  <button key={y} type="button" className="evo-chip" aria-pressed={y === year} onClick={() => pick(y)}>
                    {y}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ol
            className="evo-cards"
            aria-busy={!placed}
            data-year={shown}
            data-leaving={year !== shown || undefined}
            onFocus={onCardsFocus}
            onBlur={onCardsBlur}
          >
            {list.map((it, i) => (
              <li
                key={keyOf(it)}
                ref={(el) => {
                  cardEls.current[i] = el;
                }}
                className="evo-card"
                onPointerEnter={() => {
                  flow.current.hover = true;
                }}
                onPointerLeave={() => {
                  flow.current.hover = false;
                }}
              >
                <CardBody it={it} onOpen={() => setOpen(all.indexOf(it))} />
              </li>
            ))}
          </ol>

          <div ref={planetRef} className="evo-planet evo-stage-planet" aria-hidden />
        </div>
      </div>

      <svg ref={progRef} className="evo-progress" viewBox="0 0 44 44" aria-hidden focusable="false">
        <circle className="evo-progress-track" cx="22" cy="22" r="18" />
        <circle className="evo-progress-bar" cx="22" cy="22" r="18" pathLength={1} />
        <circle className="evo-progress-dot" r="3" />
      </svg>

      <Target />

      {open !== null && <EntryPanel items={all} index={open} onGo={go} onClose={() => setOpen(null)} />}
    </>
  );
}
