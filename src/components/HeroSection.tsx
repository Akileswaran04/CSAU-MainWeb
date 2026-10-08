"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { paintEarthInto } from "./space/earthCanvas";

/* ============================================================
   HERO SECTION - Full-viewport hero after the power-on handoff

   Left-aligned wordmark and telemetry block; three radar rings
   widen from a signal dot on the right. Scroll down to follow
   the signal.

   Earth, the story's own (space/earth.ts), rises at the foot while the
   story below gets ready, and the page holds still until it has
   (HomeClient): a little way while the story waits its turn, most of
   the way while its scene is built, and the rest when it is drawing.
   Then a light runs along the horizon and the Scroll hint appears.
   ============================================================ */

/** how far the story below has got: waiting its turn, its scene being built, drawing */
export type StoryStage = "wait" | "build" | "ready";

export default function HeroSection({ story = "ready" }: { story?: StoryStage }) {
  const [visible, setVisible] = useState(false);
  const [scrollHint, setScrollHint] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setScrollHint(true), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const rise = (delay: number, dist = 20) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : `translateY(${dist}px)`,
    transition: `opacity .8s ease ${delay}s, transform .8s cubic-bezier(.2,.8,.2,1) ${delay}s`,
  });

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 8%",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      {/* Radar rings - three rings widening from a signal dot, off to the right */}
      <div
        className="absolute pointer-events-none"
        aria-hidden
        style={{
          top: "50%",
          left: "74%",
          width: "min(70vw, 560px)",
          height: "min(70vw, 560px)",
          transform: "translate(-50%, -50%)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "1px solid var(--hull-700)",
              opacity: 0,
              animation: `ping-out 9s cubic-bezier(.2,.6,.3,1) ${i * 3}s infinite`,
            }}
          />
        ))}
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 10,
            height: 10,
            marginLeft: -5,
            marginTop: -5,
            borderRadius: "50%",
            background: "var(--signal)",
          }}
        />
      </div>

      <EarthRise story={story} />

      {/* Content */}
      <div className="relative" style={{ zIndex: 10, display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(44px, 9vw, 120px)",
            letterSpacing: ".04em",
            color: "var(--on-surface)",
            margin: 0,
            lineHeight: 1,
            ...rise(0.1, 24),
          }}
        >
          CSAU
        </h1>

        <div style={{ width: 48, height: 1, background: "var(--lit)", ...rise(0.3, 0) }} />

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(13px, 1.4vw, 16px)",
            letterSpacing: ".2em",
            color: "var(--on-surface-variant)",
            textTransform: "uppercase",
            margin: 0,
            ...rise(0.2, 16),
          }}
        >
          Computer Society of Anna University
        </p>

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: ".2em",
            color: "var(--outline)",
            textTransform: "uppercase",
            margin: 0,
            ...rise(0.4, 0),
          }}
        >
          CEG, Anna University, 13.08 N 80.27 E
        </p>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute flex flex-col gap-2"
        style={{
          left: "8%",
          bottom: 40,
          zIndex: 10,
          opacity: scrollHint && story === "ready" ? 1 : 0,
          transition: "opacity 1s ease",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: ".2em",
            color: "var(--outline)",
            textTransform: "uppercase",
          }}
        >
          Scroll
        </span>
        <div
          style={{
            width: 1,
            height: 32,
            background: "var(--outline-variant)",
            animation: "scroll-dot 2s ease-in-out infinite",
          }}
        />
      </div>
    </section>
  );
}

/* Earth's top, rising from the foot of the hero. A wide arc of a big globe, its pole tipped away so the
   horizon shows the tropics rather than the ice, turned to the continents, lit from the upper right (the radar's
   side). Its foot fades into the dark the story starts in, so there is no seam below the hero. It is painted once
   (again only if the width changes: phones resize as the address bar comes and goes) and rises only
   once painted, so it never rises empty. */
function EarthRise({ story }: { story: StoryStage }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [geo, setGeo] = useState<{ w: number; R: number; h: number; m: number } | null>(null);
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let w = 0;
    let live = true;
    const paint = () => {
      if (window.innerWidth === w) return;
      w = window.innerWidth;
      const R = Math.round(Math.min(1100, Math.max(320, w * 0.62))); // the globe's radius
      const cap = Math.round(Math.min(220, Math.max(110, window.innerHeight * 0.2))); // how much of it shows
      const m = Math.max(100, Math.round(R * 0.12)); // room above it for the atmosphere and its glow (the fade masks the box)
      const h = cap + m;
      setGeo({ w, R, h, m });
      void paintEarthInto(canvas, w, h, { cx: w / 2, cy: m + R, r: R, dist: 3, tilt: -1.05, spin: 4.4, sun: [0.55, 0.45, 0.7] }, 150000).then(
        () => live && setPainted(true)
      );
    };
    paint();
    let t = 0;
    const onResize = () => {
      clearTimeout(t);
      t = window.setTimeout(paint, 250);
    };
    window.addEventListener("resize", onResize);
    return () => {
      live = false;
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="earthrise" data-story={painted ? story : "off"} aria-hidden style={{ height: geo?.h ?? 0 }}>
      {geo && (
        <i
          className="earthrise-air"
          style={{ left: geo.w / 2 - geo.R, top: geo.m, width: 2 * geo.R, height: 2 * geo.R } as CSSProperties}
        >
          <i className="earthrise-ping" />
        </i>
      )}
      <canvas ref={ref} className="earthrise-map" />
    </div>
  );
}

