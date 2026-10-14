"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isExternal } from "@/data/events";
import { SECTIONS, STOPS } from "./stops";
import { endAutoplay, getLenis, scrollToY } from "./lenis";
import Constellation from "./Constellation";

const SpaceScene = dynamic(() => import("./SpaceScene"), { ssr: false });

/* ============================================================
   STORY SECTION - you fly through the constellation.

   The section is tall; an inner stage sticks to the viewport
   while scroll progress drives the camera from star to star, and swaps the copy for
   whichever stop it is visiting. Progress lives in a ref so the
   scene never triggers React renders.

   The section is pulled LEAD_VH up under the hero, so the stage is
   already pinned while the hero scrolls away: the scene fades in
   and the camera flies in from deep space to the first stop
   (`lead`, 0 to 1), with no seam between the two. The last stop is
   past the Sun, one constellation ahead of the ship, a star for
   every page (Constellation.tsx), and the page ends there.
   ============================================================ */

const N = STOPS.length;
const TOTAL_W = STOPS.reduce((a, s) => a + s.weight, 0);
const VH_PER_WEIGHT = 78;
const LEAD_VH = 100;

/** The section's height and its pull under the hero, also reserved by the home page before the story mounts. */
export const STORY_HEIGHT = `${LEAD_VH + TOTAL_W * VH_PER_WEIGHT + 100}vh`;
export const STORY_PULL = `-${LEAD_VH}vh`;

// cumulative weight boundaries → which stop owns a given progress
const EDGES: number[] = [];
{
  let acc = 0;
  STOPS.forEach((s) => {
    acc += s.weight;
    EDGES.push(acc / TOTAL_W);
  });
}

const leadPx = () => (window.innerHeight * LEAD_VH) / 100;

/* The flight round the Sun (the last leg, between the stops' middles, as SpaceScene's KEYS): the copy clears while
   the ship is out there, and the last stop owns the screen only once it has nearly arrived. */
const MID = EDGES.map((e, i) => ((i ? EDGES[i - 1] : 0) + e) / 2);
const LOOP_FROM = MID[N - 2] + (MID[N - 1] - MID[N - 2]) * 0.12;
const LOOP_TO = MID[N - 1] - (MID[N - 1] - MID[N - 2]) * 0.06;
/* Past Contact the story takes the scroll and plays itself, like a film, at a set pace to the last stop: a scroll
   down there starts it, a scroll up hands control back (StorySection, with the home's smooth scroll) */
const PLAY_FROM = MID[N - 2] + (MID[N - 1] - MID[N - 2]) * 0.02;
const PLAY_SECONDS = 14; // the whole flight from Contact round the Sun to the last stop (the owner found 22 too slow)
/* the ship arrives at the last stop (past the Sun) here, in scroll progress: the constellation forms then, not before */
const ARRIVED = (TOTAL_W - STOPS[N - 1].weight / 2) / TOTAL_W - 0.004;

/** `onWarm`: the scene is compiled and drawing. `covered`: the home's gate is over it (it is built under the boot
    preloader), so nothing is drawn yet. */
export default function StorySection({ onWarm: onWarmProp, covered = false }: { onWarm?: () => void; covered?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useRef(0);
  /* the warp to a page from the constellation: when it began (performance.now()), 0 when not warping */
  const warp = useRef(0);
  const lead = useRef(0);
  const remeasure = useRef(() => {});
  const [active, setActive] = useState(0);
  const [arrived, setArrived] = useState(false);
  // Phones: the height of the copy panel, measured from the tallest stop so nothing is clipped
  // and the scene gets exactly the rest of the screen. null on wide screens.
  const [panel, setPanel] = useState<number | null>(null);
  const [inView, setInView] = useState(true);
  /* the route loader holds until the scene's shaders are compiled (aria-busy below) */
  const [warm, setWarm] = useState(false);
  /* how far the scene's build has got (data-load, read by the page's loaders) */
  const [load, setLoad] = useState(0.1);
  const onLoad = useCallback((share: number) => setLoad((l) => Math.max(l, share)), []);
  const onWarm = useCallback(() => {
    setWarm(true);
    onWarmProp?.();
  }, [onWarmProp]);
  /* the fullscreen menu covers the page: stop drawing the 3D scene under it */
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    const on = (e: Event) => setNavOpen((e as CustomEvent<{ open: boolean }>).detail.open);
    window.addEventListener("csau:nav-state", on);
    return () => window.removeEventListener("csau:nav-state", on);
  }, []);
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = -el.getBoundingClientRect().top;
      const span = el.offsetHeight - window.innerHeight - leadPx();
      lead.current = Math.min(1, Math.max(0, y / leadPx()));
      el.style.setProperty("--lead", lead.current.toFixed(3));
      const p = span > 0 ? Math.min(1, Math.max(0, (y - leadPx()) / span)) : 0;
      progress.current = p;
      let idx = EDGES.findIndex((e) => p < e);
      if (idx < 0) idx = N - 1;
      if (idx === N - 1 && p < LOOP_TO) idx = N - 2;
      // from out round the Sun to the end there is no copy: the last stop has none (were it shown again at LOOP_TO,
      // Contact would still be its chapter and come back before the ship arrived)
      el.toggleAttribute("data-cruise", p > LOOP_FROM);
      setActive((a) => (a === idx ? a : idx));
      setArrived(p >= ARRIVED);
      const l = getLenis();
      if (l && l !== film.lenis) {
        film.off?.();
        film.lenis = l;
        film.off = l.on("virtual-scroll", ({ deltaY }) => onInput(l, deltaY));
      }
      // scrolled down past Contact (not a jump from the rail): the film starts
      if (l && !l.isLocked && !l.userData?.jump && film.prev < PLAY_FROM && p >= PLAY_FROM) play(l, p);
      film.prev = p;
    };
    // prev starts unknown: a page that opens (or comes back) already past Contact does not start the film by itself
    const film: { lenis?: ReturnType<typeof getLenis>; off?: () => void; prev: number } = { prev: NaN };
    /* the autoplay: user input reaches here even while it plays (it is locked, so input does not scroll) */
    const onInput = (l: NonNullable<ReturnType<typeof getLenis>>, deltaY: number) => {
      const p = progress.current;
      if (l.isLocked) {
        if (deltaY < 0) endAutoplay(); // scrolling up takes the controls back
        return;
      }
      if (deltaY > 0 && p >= PLAY_FROM) play(l, p);
    };
    const play = (l: NonNullable<ReturnType<typeof getLenis>>, p: number) => {
      if (p >= MID[N - 1] - 0.002) return; // already there
      const span = el.offsetHeight - window.innerHeight - leadPx();
      const top = el.getBoundingClientRect().top + window.scrollY + leadPx();
      const left = (MID[N - 1] - p) / (MID[N - 1] - MID[N - 2]);
      l.scrollTo(top + span * MID[N - 1], { duration: PLAY_SECONDS * left, easing: (x) => x, lock: true });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    remeasure.current = onScroll;
    return () => {
      film.off?.();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // the story is built under the preloader, before the hero mounts above it (in the render that lifts `covered`):
  // measure again then, or the lead-in reads as already done and the first stop's copy sits over the hero
  useEffect(() => remeasure.current(), [covered]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const mq = window.matchMedia("(max-width: 820px)");
    const measure = () => {
      if (!mq.matches) {
        setPanel(null);
        return;
      }
      let h = 0;
      el.querySelectorAll<HTMLElement>(".story-chapter").forEach((c) => {
        h = Math.max(h, c.scrollHeight);
      });
      const cap = Math.round(window.innerHeight * 0.52);
      setPanel(Math.min(cap, Math.max(250, Math.ceil(h) + 28)));
    };
    measure();
    window.addEventListener("resize", measure);
    void document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "120px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const goToStop = useMemo(
    () => (i: number) => {
      const el = sectionRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY + leadPx();
      const span = el.offsetHeight - window.innerHeight - leadPx();
      const start = i === 0 ? 0 : EDGES[i - 1];
      // the last stop, the constellation, is held at the very end of the page
      scrollToY(top + span * (i === N - 1 ? 1 : (start + EDGES[i]) / 2));
    },
    []
  );

  const sections = useMemo(
    () => SECTIONS.map((sec) => ({ ...sec, first: STOPS.findIndex((s) => s.kind === sec.id) })).filter((sec) => sec.first >= 0),
    [],
  );
  const activeSection = sections.findIndex((s) => s.id === STOPS[active]?.kind);

  return (
    <section
      ref={sectionRef}
      data-section="story"
      aria-label="The journey"
      aria-busy={!warm}
      data-load={warm ? 1 : load}
      data-warm={warm}
      className="story"
      style={{
        height: STORY_HEIGHT,
        marginTop: STORY_PULL,
        ...(panel ? ({ "--story-panel": `${panel}px` } as React.CSSProperties) : null),
      }}
    >
      <div className="story-stage">
        <div className="story-canvas" aria-hidden>
          <SpaceScene progress={progress} lead={lead} active={inView && !navOpen && !covered} reduced={reduced} onWarm={onWarm} onLoad={onLoad} warp={warp} />
        </div>

        <div className="story-copy">
          {STOPS.map((c, i) => {
            if (c.kind === "map") return null;
            const state = i === active ? "active" : i < active ? "past" : "next";
            return (
              <article
                key={i}
                className="story-chapter"
                data-state={state}
                data-kind={c.kind}
                aria-hidden={state !== "active"}
              >
                <h2 className="story-title">
                  {c.lines.map((line, li) => (
                    <span className="story-line" key={li}>
                      <span style={{ transitionDelay: `${li * 90}ms` }}>{renderMark(line, c.mark)}</span>
                    </span>
                  ))}
                </h2>
                {c.body.split("\n\n").filter(Boolean).map((para, pi) => (
                  <p key={pi} className="story-body" data-lead={pi === 0 && c.body.includes("\n\n") ? "" : undefined}>
                    {para}
                  </p>
                ))}
                {c.items && c.items.length > 0 && (
                  <ul className="story-meta">
                    {c.items.map((m) => (
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
                          tabIndex={state === "active" ? 0 : -1}
                        >
                          {b.label}
                        </a>
                      ) : (
                        <Link
                          key={b.href + b.label}
                          href={b.href}
                          data-route-load
                          className={b.ghost ? "btn story-btn-ghost" : "btn story-btn"}
                          tabIndex={state === "active" ? 0 : -1}
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

        <Constellation on={arrived} warpRef={warp} />

        <nav className="story-rail" aria-label="Story sections">
          {sections.map((sec, si) => (
            <button
              key={sec.id}
              type="button"
              className="story-tick"
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
