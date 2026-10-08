"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { BlogPost } from "@/lib/blog";
import { scrollToY } from "@/components/story/lenis";
import { Meta } from "./parts";

const BlogScene = dynamic(() => import("./BlogScene"), { ssr: false });

/* ============================================================
   BLOG FLIGHT - the home story's ship visits every post.

   The same stage as the home story (its .story-* styles): a tall
   section whose sticky stage holds the scene, the copy for the stop
   being visited and a rail. Stop 0 is the page header with the topic
   bands; every post after it is a stop with its cover beside the
   route. Progress lives in a ref so the scene never renders React.
   ============================================================ */

const VH_PER_STOP = 78;
const pad = (n: number) => String(n).padStart(2, "0");

export default function BlogFlight({ posts, intro }: { posts: BlogPost[]; intro: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const n = posts.length + 1;
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  /* the route loader holds until the scene is compiled and the covers are in (aria-busy below) */
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  // phones: the copy panel's height, from the tallest stop (as the home story measures it)
  const [panel, setPanel] = useState<number | null>(null);
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const on = (e: Event) => setNavOpen((e as CustomEvent<{ open: boolean }>).detail.open);
    window.addEventListener("csau:nav-state", on);
    return () => window.removeEventListener("csau:nav-state", on);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const span = el.offsetHeight - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -el.getBoundingClientRect().top / span)) : 0;
      progress.current = p;
      const idx = Math.min(n - 1, Math.floor(p * n));
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
  }, [n]);

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
  }, [posts]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "120px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const goTo = (i: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    scrollToY(top + (el.offsetHeight - window.innerHeight) * ((i + 0.5) / n));
  };

  const stateOf = (i: number) => (i === active ? "active" : i < active ? "past" : "next");

  return (
    <section
      ref={sectionRef}
      className="story bl-flight"
      aria-label="Blog flight: the ship visits one post at a time"
      aria-busy={!ready}
      style={{
        height: `${n * VH_PER_STOP + 100}vh`,
        ...(panel ? ({ "--story-panel": `${panel}px` } as CSSProperties) : null),
      }}
    >
      <div className="story-stage">
        <div className="story-canvas" aria-hidden>
          <BlogScene posts={posts} progress={progress} active={inView && !navOpen} reduced={reduced} onReady={onReady} />
        </div>

        <div className="story-copy">
          <div className="story-chapter bl-flight-intro" data-state={stateOf(0)} aria-hidden={active !== 0} inert={active !== 0}>
            {intro}
          </div>
          {posts.map((post, i) => {
            const state = stateOf(i + 1);
            return (
              <article key={post.id} className="story-chapter" data-state={state} aria-hidden={state !== "active"}>
                <div className="story-eyebrow">
                  <span className="story-no">
                    {pad(i + 1)} / {pad(posts.length)}
                  </span>
                  <span>{post.author}</span>
                </div>
                <h2 className="story-title">
                  <span className="story-line">
                    <span>{post.title}</span>
                  </span>
                </h2>
                <p className="story-body">{post.excerpt}</p>
                <div className="story-meta">
                  <Meta post={post} />
                </div>
                <div className="story-cta">
                  <a
                    className="btn story-btn"
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Read “${post.title}” on Medium (opens in a new tab)`}
                    tabIndex={state === "active" ? 0 : -1}
                  >
                    Read on Medium →
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        <nav className="story-rail" aria-label="Posts">
          {posts.map((post, i) => (
            <button
              key={post.id}
              type="button"
              className="story-tick"
              data-on={active === i + 1}
              data-done={active > i + 1}
              onClick={() => goTo(i + 1)}
              aria-label={`Go to ${post.title}`}
              aria-current={active === i + 1}
            >
              <span className="story-tick-label">{pad(i + 1)}</span>
              <span className="story-tick-bar" />
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}
