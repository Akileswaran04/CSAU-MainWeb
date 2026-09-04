"use client";

import { useEffect, useRef, useState } from "react";

/* ============================================================
   LOADING OVERLAY — Route-loader for nav-bar / CTA navigation.

   Recreates the reference sequence:
     • Low-poly faceted backdrop with a slow diagonal sheen sweep
     • A 4-segment rounded-cap ring over a pale full track —
       segment gaps breathe independently while the whole ring
       drifts rotationally (organic, never a rigid spinner)
     • Sparse asynchronous HUD telemetry around the edges
     • A "LOADING" wordmark that fades in and out on a loop
   Exit choreography (phase === "ending"):
     peripheral layers fade → ring persists alone a beat → fade out.

   Palette follows the site's sculptural clay system — cool white
   surfaces, lavender-gray facets, a charcoal-lavender ring over a
   pale lavender track, muted gray HUD readouts and a single
   desaturated terracotta fleck.
   ============================================================ */

/* ---- Facet mesh colors (light lavender-gray family) ---- */
const SHADES: [number, number, number][] = [
  [255, 255, 255],
  [249, 247, 252],
  [244, 242, 249],
  [238, 236, 245],
  [242, 240, 248],
];

const RING_C = 200; // svg viewBox center
const RING_R = 152; // ring radius in viewBox units
const RING_W = 26; // stroke width
const TRACK_C = "#d7d4e0";
const SEG_C = "#46434f";
const WORD_C = "#7d7a87";

const HUDS: HudItem[] = [
  { key: "a", text: "0109.5", x: 7, y: 14, kind: "num", dur: 5.2, delay: 0.4 },
  { key: "b", text: "0488.9", x: 87, y: 12, kind: "num", dur: 6.1, delay: 1.6 },
  { key: "c", text: "0215.3", x: 9, y: 83, kind: "num", dur: 4.4, delay: 2.2 },
  { key: "d", text: "0509.3", x: 88, y: 78, kind: "num", dur: 5.6, delay: 0.9 },
  { key: "grid", rows: ["GRID INDEX", "08.23 · A.921"], x: 61, y: 63, kind: "grid", dur: 7, delay: 1.1 },
  { key: "sys", rows: ["SYS INDEX", "▸ LINK 04"], x: 36, y: 49, kind: "grid", dur: 6.4, delay: 2.6 },
  { key: "payload", rows: ["ALPHA PAYLOAD", "DSTRM CHK"], x: 37, y: 36, kind: "payload", dur: 8, delay: 0.2 },
  { key: "fleck", kind: "fleck", x: 75, y: 17 },
  { key: "tri1", kind: "tri", x: 20, y: 33, dur: 5.8, delay: 3.1 },
  { key: "tri2", kind: "triHollow", x: 83, y: 52, dur: 4.6, delay: 4.4 },
  { key: "dot", kind: "dot", x: 13, y: 40 },
  { key: "tick", kind: "ticks", x: 7, y: 22 },
];

type HudItem =
  | { key: string; kind: "num"; text: string; x: number; y: number; dur: number; delay: number }
  | { key: string; kind: "grid"; rows: [string, string]; x: number; y: number; dur: number; delay: number }
  | { key: string; kind: "payload"; rows: [string, string]; x: number; y: number; dur: number; delay: number }
  | { key: string; kind: "tri"; x: number; y: number; dur: number; delay: number }
  | { key: string; kind: "triHollow"; x: number; y: number; dur: number; delay: number }
  | { key: string; kind: "fleck"; x: number; y: number }
  | { key: string; kind: "dot"; x: number; y: number }
  | { key: string; kind: "ticks"; x: number; y: number };

const CODE_LINE_W = [52, 68, 40, 74, 58, 46, 66];

export default function LoadingOverlay({ phase }: { phase: "loading" | "ending" }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const facetRef = useRef<HTMLCanvasElement>(null);
  const arcRef = useRef<SVGPathElement>(null);
  const arcGlowRef = useRef<SVGPathElement>(null);
  const [stage, setStage] = useState(0);

  /* ---- End choreography: peripherals fade → ring beat → whole fade ---- */
  useEffect(() => {
    if (phase !== "ending") return;
    setStage(1);
    const t2 = setTimeout(() => setStage(2), 520);
    const t3 = setTimeout(() => setStage(3), 980);
    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [phase]);

  /* ---- Facet mesh + ring arc animation loop ---- */
  useEffect(() => {
    const canvas = facetRef.current;
    const arc = arcRef.current;
    const arcGlow = arcGlowRef.current;
    if (!canvas || !arc || !arcGlow) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const polar = (cx: number, cy: number, r: number, deg: number) => {
      const a = (deg * Math.PI) / 180;
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    };

    const buildMesh = (w: number, h: number) => {
      const cols = Math.max(6, Math.round(w / 170));
      const rows = Math.max(4, Math.round(h / 150));
      const vx = (i: number) => (w / cols) * i;
      const vy = (j: number) => (h / rows) * j;
      const pts = [];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const cellW = vx(i + 1) - vx(i);
          const cellH = vy(j + 1) - vy(j);
          const nudge = () => ({
            x: Math.random() * cellW * 0.5 - cellW * 0.25,
            y: Math.random() * cellH * 0.5 - cellH * 0.25,
          });
          const a0 = { x: vx(i), y: vy(j) };
          const a1 = { x: vx(i + 1), y: vy(j) };
          const b0 = { x: vx(i), y: vy(j + 1) };
          const b1 = { x: vx(i + 1), y: vy(j + 1) };
          const inner = {
            x: (a0.x + a1.x + b0.x + b1.x) / 4 + nudge().x,
            y: (a0.y + a1.y + b0.y + b1.y) / 4 + nudge().y,
          };
          const n0 = nudge();
          const n1 = nudge();
          const shade = SHADES[(i * 3 + j * 5 + (i + j) % 2) % SHADES.length];
          const phase = Math.random() * Math.PI * 2;
          pts.push(
            { tri: [{ x: a0.x + n0.x, y: a0.y + n0.y }, { x: a1.x + n1.x, y: a1.y + n1.y }, { x: inner.x, y: inner.y }], shade, phase, cx: (a0.x + a1.x + inner.x) / 3, cy: (a0.y + a1.y + inner.y) / 3 },
            { tri: [{ x: b0.x - n0.x, y: b0.y + n1.y }, { x: b1.x - n1.x, y: b1.y - n0.y }, { x: inner.x, y: inner.y }], shade, phase: phase + 1.7, cx: (b0.x + b1.x + inner.x) / 3, cy: (b0.y + b1.y + inner.y) / 3 },
          );
        }
      }
      return pts;
    };

    let tris: ReturnType<typeof buildMesh> = [];
    let dpr = 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tris = buildMesh(rect.width, rect.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const t0 = performance.now();
    const dirX = 0.72;
    const dirY = 0.6;

    const frame = () => {
      const t = (performance.now() - t0) / 1000;

      /* facets */
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);
      for (const tri of tris) {
        const wave = Math.sin((tri.cx * dirX + tri.cy * dirY) * 0.018 - t * 1.1 + tri.phase);
        const k = Math.max(0, Math.min(1, 0.5 + wave * 0.5)) * 0.45;
        const [r, g, b] = tri.shade;
        ctx.fillStyle = `rgb(${Math.round(r + (255 - r) * k)},${Math.round(g + (255 - g) * k)},${Math.round(b + (255 - b) * k)})`;
        ctx.beginPath();
        ctx.moveTo(tri.tri[0].x, tri.tri[0].y);
        ctx.lineTo(tri.tri[1].x, tri.tri[1].y);
        ctx.lineTo(tri.tri[2].x, tri.tri[2].y);
        ctx.closePath();
        ctx.fill();
      }

      /* ring: four gaps breathing independently over a slow rotation */
      const rot = t * 8 + Math.sin(t * 0.21) * 5;
      const gaps = [0, 1, 2, 3].map((i) => {
        const center = rot + i * 90 + Math.sin(t * 0.5 + i * 2.1) * 7;
        const width =
          8 +
          22 * Math.sin(t * 0.85 + i * 1.9) +
          13 * Math.sin(t * 0.31 + i * 0.9 + 2.4);
        return { c: center, w: Math.max(5, Math.min(72, width)) };
      });

      let d = "";
      for (let i = 0; i < 4; i++) {
        const a1 = gaps[i].c + gaps[i].w / 2;
        let a2 = gaps[(i + 1) % 4].c - gaps[(i + 1) % 4].w / 2;
        while (a2 < a1) a2 += 360;
        const sweep = a2 - a1;
        if (sweep < 1) continue;
        const p1 = polar(RING_C, RING_C, RING_R, a1);
        const p2 = polar(RING_C, RING_C, RING_R, a2);
        d += `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${RING_R} ${RING_R} 0 ${sweep > 180 ? 1 : 0} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
      }
      if (d) {
        arc.setAttribute("d", d);
        arcGlow.setAttribute("d", d);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const rootClass =
    "rl-root" +
    (stage >= 1 ? " rl-x1" : "") +
    (stage >= 2 ? " rl-x2" : "") +
    (stage >= 3 ? " rl-x3" : "");

  return (
    <div ref={rootRef} className={rootClass} role="status" aria-live="polite">
      <style>{`
        .rl-root {
          position: fixed;
          inset: 0;
          z-index: 650;
          background: #fbf8ff;
          overflow: hidden;
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
          -webkit-font-smoothing: antialiased;
        }
        .rl-facets {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          transition: opacity .45s ease;
        }
        .rl-ringbox {
          position: absolute;
          left: 50%;
          top: 42%;
          transform: translate(-50%, -50%);
          width: min(32vw, 340px);
          height: min(32vw, 340px);
          transition: opacity .4s ease .05s;
        }
        .rl-rings, .rl-glow {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
        }
        .rl-glow {
          filter: blur(9px);
          opacity: .5;
        }
        .rl-rings path {
          fill: none;
          stroke: ${SEG_C};
          stroke-width: ${RING_W};
          stroke-linecap: round;
        }
        .rl-glow path {
          fill: none;
          stroke: ${SEG_C};
          stroke-width: ${RING_W + 10};
          stroke-linecap: round;
        }
        .rl-track {
          fill: none;
          stroke: ${TRACK_C};
          stroke-width: ${RING_W};
          stroke-linecap: round;
          opacity: .55;
        }

        /* ---- Wordmark (breathes) ---- */
        .rl-word {
          position: absolute;
          left: calc(50% + min(32vw, 340px) * 0.315);
          top: calc(42% + min(32vw, 340px) * 0.36);
          transform: translate(-50%, -50%);
          display: flex;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 300;
          font-size: clamp(11px, 1.5vw, 15px);
          letter-spacing: .62em;
          text-transform: uppercase;
          color: ${WORD_C};
          white-space: nowrap;
          animation: rlWordBreathe 6.4s ease-in-out infinite;
          transition: opacity .4s ease;
          margin-left: .62em; /* compensate trailing letter-spacing */
        }
        .rl-word span { display: inline-block; }
        .rl-word .rl-accent { color: #5f5c6b; }
        .rl-word .rl-b { animation: rlAccent 6.4s ease-in-out infinite; }
        @keyframes rlWordBreathe {
          0%, 100% { opacity: 0; }
          12% { opacity: .95; }
          46% { opacity: .8; }
          74% { opacity: .12; }
        }
        @keyframes rlAccent {
          0%, 100% { opacity: 0; }
          14% { opacity: .95; }
          48% { opacity: .55; }
          76% { opacity: .08; }
        }

        /* ---- HUD items ---- */
        .rl-hud {
          position: absolute;
          inset: 0;
          color: #807d8a;
          letter-spacing: .18em;
          font-size: clamp(8px, .95vw, 11px);
          pointer-events: none;
          transition: opacity .42s ease;
        }
        .rl-hud > div { position: absolute; }
        .rl-num { animation: rlFadeInOut var(--d, 5s) ease-in-out infinite; animation-delay: var(--dl, 0s); }
        .rl-grid { animation: rlFadeInOut var(--d, 6s) ease-in-out infinite; animation-delay: var(--dl, 0s); }
        .rl-grid .l1 { color: #55525e; font-size: .92em; }
        .rl-grid .l2 { color: #8a8794; margin-top: 3px; font-size: .88em; letter-spacing: .12em; }
        .rl-payload { animation: rlFadeInOut var(--d, 8s) ease-in-out infinite; animation-delay: var(--dl, 0s); }
        .rl-payload .l1 { color: #55525e; font-size: .92em; }
        .rl-payload .l2 { color: #8a8794; margin-top: 3px; font-size: .88em; }
        .rl-payload .bar {
          height: 2px;
          background: #2e2d35;
          margin-top: 5px;
          transform-origin: left center;
          animation: rlBarFill 3.4s cubic-bezier(.3,.7,.4,1) infinite;
        }
        .rl-fleck { width: 5px; height: 5px; border-radius: 50%; background: #c96a5c; animation: rlDotPulse 4s ease-in-out infinite; }
        .rl-tri { width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 10px solid #45434f; animation: rlFadeInOut 5.8s ease-in-out infinite; }
        .rl-triHollow {
          width: 11px; height: 11px;
          border: 1.5px solid #a4a1ad;
          transform: rotate(45deg);
          animation: rlFadeInOut 4.6s ease-in-out infinite;
        }
        .rl-dot { width: 4px; height: 4px; border-radius: 50%; background: #c3c0cc; animation: rlDotPulse 5s ease-in-out infinite; }
        .rl-ticks { display: flex; flex-direction: column; gap: 5px; }
        .rl-ticks i { display: block; height: 1px; background: #cac7d2; }
        .rl-ticks i:nth-child(1) { width: 46px; }
        .rl-ticks i:nth-child(2) { width: 26px; }
        .rl-ticks i:nth-child(3) { width: 62px; }
        .rl-code {
          position: absolute !important;
          display: flex;
          flex-direction: column;
          gap: 6px;
          opacity: .5;
          animation: rlFlicker 3.2s steps(2) infinite;
          transition: opacity .4s ease;
        }
        .rl-code i { display: block; height: 1px; background: #b7b4bf; }

        @keyframes rlFadeInOut {
          0%, 100% { opacity: 0; }
          10% { opacity: .6; }
          22% { opacity: .9; }
          58% { opacity: .62; }
          82% { opacity: .12; }
        }
        @keyframes rlFlicker {
          0%, 100% { opacity: .45; }
          46% { opacity: .25; }
          54% { opacity: .5; }
          70% { opacity: .3; }
        }
        @keyframes rlDotPulse {
          0%, 100% { opacity: .15; }
          50% { opacity: .8; }
        }
        @keyframes rlBarFill {
          0% { transform: scaleX(0); }
          55% { transform: scaleX(1); }
          100% { transform: scaleX(1); opacity: .2; }
        }

        /* ---- Exit stages ---- */
        .rl-x1 .rl-facets,
        .rl-x1 .rl-hud,
        .rl-x1 .rl-code,
        .rl-x1 .rl-word { opacity: 0; }
        .rl-x2 .rl-ringbox { opacity: 0; }
        .rl-x3 { opacity: 0; transition: opacity .42s ease; }
        .rl-x1 .rl-ringbox { transition: opacity .4s ease .05s; }
      `}</style>

      {/* Faceted backdrop */}
      <canvas ref={facetRef} className="rl-facets" />

      {/* Ring + track */}
      <div className="rl-ringbox">
        <svg className="rl-glow" viewBox="0 0 400 400" aria-hidden>
          <path ref={arcGlowRef} d="" />
        </svg>
        <svg className="rl-rings" viewBox="0 0 400 400" aria-hidden>
          <circle className="rl-track" cx={RING_C} cy={RING_C} r={RING_R} />
          <path ref={arcRef} d="" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="rl-word" aria-hidden>
        {"LOADING".split("").map((ch, i) => (
          <span key={i} className={i >= 4 ? "rl-accent rl-b" : undefined} style={{ animationDelay: `${(i * 0.28) % 2}s` }}>
            {ch}
          </span>
        ))}
      </div>

      {/* HUD telemetry */}
      <div className="rl-hud" aria-hidden>
        {HUDS.map((h) => {
          if (h.kind === "fleck")
            return <div key={h.key} className="rl-fleck" style={{ left: `${h.x}%`, top: `${h.y}%` }} />;
          switch (h.kind) {
            case "tri":
            case "triHollow":
              return (
                <div
                  key={h.key}
                  className={h.kind === "tri" ? "rl-tri" : "rl-triHollow"}
                  style={{ left: `${h.x}%`, top: `${h.y}%`, animationDuration: `${h.dur}s`, animationDelay: `${h.delay}s` }}
                />
              );
            case "dot":
              return <div key={h.key} className="rl-dot" style={{ left: `${h.x}%`, top: `${h.y}%` }} />;
            case "ticks":
              return (
                <div key={h.key} className="rl-ticks" style={{ left: `${h.x}%`, top: `${h.y}%` }}>
                  <i /><i /><i />
                </div>
              );
            case "payload":
              return (
                <div
                  key={h.key}
                  className="rl-payload"
                  style={{ left: `${h.x}%`, top: `${h.y}%`, ["--d" as string]: `${h.dur}s`, ["--dl" as string]: `${h.delay}s` }}
                >
                  <div className="l1">{h.rows[0]}</div>
                  <div className="l2">{h.rows[1]}</div>
                  <div className="bar" style={{ width: 96 }} />
                </div>
              );
            case "grid":
              return (
                <div
                  key={h.key}
                  className="rl-grid"
                  style={{ left: `${h.x}%`, top: `${h.y}%`, ["--d" as string]: `${h.dur}s`, ["--dl" as string]: `${h.delay}s` }}
                >
                  <div className="l1">{h.rows[0]}</div>
                  <div className="l2">{h.rows[1]}</div>
                </div>
              );
            default:
              return (
                <div key={h.key} className="rl-num" style={{ left: `${h.x}%`, top: `${h.y}%`, ["--d" as string]: `${h.dur}s`, ["--dl" as string]: `${h.delay}s` }}>
                  {h.text}
                </div>
              );
          }
        })}
      </div>

      {/* Console-log texture, right edge */}
      <div className="rl-code" style={{ right: "3%", top: "31%" }} aria-hidden>
        {CODE_LINE_W.map((w, i) => (
          <i key={i} style={{ width: `${w}px`, opacity: 0.5 + 0.4 * Math.sin(i * 2.7) }} />
        ))}
      </div>
    </div>
  );
}
