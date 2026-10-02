"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { isExternal } from "@/data/events";
import { SECTIONS, STOP_LAYOUT, type Stop } from "./stops";
import { scrollToY } from "./lenis";

const SpaceScene = dynamic(() => import("./SpaceScene"), { ssr: false });

/* ============================================================
   STORY SECTION - you fly through the constellation.

   The section is tall; an inner stage sticks to the viewport
   while scroll progress drives the camera from star to star, and swaps the copy for
   whichever stop it is visiting. Progress lives in a ref so the
   scene never triggers React renders.
   ============================================================ */

const N = STOP_LAYOUT.length;
const TOTAL_W = STOP_LAYOUT.reduce((a, s) => a + s.weight, 0);
const VH_PER_WEIGHT = 78;

/** The section's height, also reserved by the home page before the story mounts so nothing shifts. */
export const STORY_HEIGHT = `${TOTAL_W * VH_PER_WEIGHT + 100}vh`;

// cumulative weight boundaries → which stop owns a given progress
const EDGES: number[] = [];
{
  let acc = 0;
  STOP_LAYOUT.forEach((s) => {
    acc += s.weight;
    EDGES.push(acc / TOTAL_W);
  });
}

/** `stops` comes from buildStops(), so it always matches STOP_LAYOUT. */
export default function StorySection({ stops }: { stops: Stop[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [active, setActive] = useState(0);
  // Phones: the height of the copy panel, measured from the tallest stop so nothing is clipped
  // and the scene gets exactly the rest of the screen. null on wide screens.
  const [panel, setPanel] = useState<number | null>(null);
  const [inView, setInView] = useState(true);
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
      const rect = el.getBoundingClientRect();
      const span = el.offsetHeight - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;
      progress.current = p;
      let idx = EDGES.findIndex((e) => p < e);
      if (idx < 0) idx = N - 1;
      setActive((a) => (a === idx ? a : idx));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

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
      const top = el.getBoundingClientRect().top + window.scrollY;
      const span = el.offsetHeight - window.innerHeight;
      const start = i === 0 ? 0 : EDGES[i - 1];
      const mid = (start + EDGES[i]) / 2;
      scrollToY(top + span * mid);
    },
    []
  );

  /* the rail lists only the sections this story has (there may be no upcoming events) */
  const sections = useMemo(
    () =>
      SECTIONS.map((sec) => ({ ...sec, first: stops.findIndex((s) => s.kind === sec.id) })).filter((sec) => sec.first >= 0),
    [stops],
  );
  const activeSection = sections.findIndex((s) => s.id === stops[active]?.kind);

  return (
    <section
      ref={sectionRef}
      data-section="story"
      aria-label="The CSAU story"
      className="story"
      style={{
        height: STORY_HEIGHT,
        ...(panel ? ({ "--story-panel": `${panel}px` } as React.CSSProperties) : null),
      }}
    >
      <div className="story-rule" aria-hidden />

      <div className="story-stage">
        <div className="story-canvas" aria-hidden>
          <SpaceScene progress={progress} active={inView && !navOpen} reduced={reduced} />
        </div>

        <div className="story-copy">
          {stops.map((c, i) => {
            const state = i === active ? "active" : i < active ? "past" : "next";
            return (
              <article
                key={i}
                className="story-chapter"
                data-state={state}
                data-kind={c.kind}
                aria-hidden={state !== "active"}
              >
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
