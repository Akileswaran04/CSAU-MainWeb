"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SECTIONS, STOPS } from "./stops";
import { scrollToY } from "./lenis";

const PondScene = dynamic(() => import("./PondScene"), { ssr: false });

/* ============================================================
   STORY SECTION — the koi guides you through the pond.

   The section is tall; an inner stage sticks to the viewport
   while scroll progress drives the koi, and swaps the copy for
   whichever stop it is visiting. Progress lives in a ref so the
   scene never triggers React renders.
   ============================================================ */

const N = STOPS.length;
const TOTAL_W = STOPS.reduce((a, s) => a + s.weight, 0);
const VH_PER_WEIGHT = 78;

// cumulative weight boundaries → which stop owns a given progress
const EDGES: number[] = [];
{
  let acc = 0;
  STOPS.forEach((s) => {
    acc += s.weight;
    EDGES.push(acc / TOTAL_W);
  });
}
const FIRST_OF_SECTION = SECTIONS.map((sec) => STOPS.findIndex((s) => s.kind === sec.id));

export default function StorySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(true);
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

  const activeSection = SECTIONS.findIndex((s) => s.id === STOPS[active].kind);

  return (
    <section
      ref={sectionRef}
      data-section="story"
      aria-label="The CSAU story"
      className="story"
      style={{ height: `${TOTAL_W * VH_PER_WEIGHT + 100}vh` }}
    >
      <svg className="story-wave" viewBox="0 0 1440 48" preserveAspectRatio="none" aria-hidden>
        <path d="M0 48V22C120 6 240 6 360 20s240 26 360 14 240-28 360-16 240 22 360 8V48Z" />
      </svg>

      <div className="story-stage">
        <div className="story-canvas" aria-hidden>
          <PondScene progress={progress} active={inView} reduced={reduced} />
        </div>

        <div className="story-copy">
          {STOPS.map((c, i) => {
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
                  {c.count && <span className="story-no">{c.count}</span>}
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
                    {c.cta.map((b) => (
                      <Link
                        key={b.href + b.label}
                        href={b.href}
                        data-route-load
                        className={b.ghost ? "btn story-btn-ghost" : "btn story-btn"}
                        tabIndex={state === "active" ? 0 : -1}
                      >
                        {b.label}
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <nav className="story-rail" aria-label="Story sections">
          {SECTIONS.map((sec, si) => (
            <button
              key={sec.id}
              type="button"
              className="story-tick"
              data-on={si === activeSection}
              data-done={si < activeSection}
              onClick={() => goToStop(FIRST_OF_SECTION[si])}
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
