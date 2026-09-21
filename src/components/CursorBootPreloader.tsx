"use client";

import { useEffect, useRef, useState } from "react";
import AstronautScene from "./AstronautScene";

/* ============================================================
   BOOT PRELOADER - the pre-flight checklist

   Plays once per session, before the start page. No animation
   tricks: a big counter and a ruled checklist of six systems that
   flip from WAIT to OK one after another as the count climbs, then
   "Cleared for launch" and a fade.

   The count is driven by time (so it always reads, ~3.4s) but is
   held at 92 until the page has really finished loading, so it can
   never claim to be done early. onComplete fires once, after the
   fade. Reduced motion: the same checklist, in about a second.
   ============================================================ */

interface CursorBootPreloaderProps {
  onComplete?: () => void;
}

/* the constellation that draws itself as the signal is acquired */
const NODES: [number, number][] = [[20, 128], [62, 84], [112, 104], [150, 52], [204, 74], [246, 30], [268, 96], [214, 128], [150, 118]];
const EDGES: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [6, 7], [7, 8], [8, 2]];
const CALLS = ["Searching for signal", "Locking star tracker", "Aligning the dish", "Drawing the constellation", "Link established"];
const MIN_MS = 3400;
const MIN_MS_REDUCED = 1100;
const HELD_AT = 92; // the count waits here until the page has really loaded

export default function CursorBootPreloader({ onComplete }: CursorBootPreloaderProps) {
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(true);
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const min = reduced ? MIN_MS_REDUCED : MIN_MS;
    const t0 = performance.now();
    let loaded = document.readyState === "complete";
    const onLoad = () => {
      loaded = true;
    };
    window.addEventListener("load", onLoad);

    let raf = 0;
    let last = -1;
    let finished = false;
    const timers: number[] = [];

    const tick = (now: number) => {
      const sim = Math.min(100, ((now - t0) / min) * 100);
      const p = Math.floor(Math.min(sim, loaded ? 100 : HELD_AT));
      if (p !== last) {
        last = p;
        setPct(p);
      }
      if (p >= 100 && !finished) {
        finished = true;
        timers.push(window.setTimeout(() => setLeaving(true), reduced ? 250 : 650));
        timers.push(
          window.setTimeout(() => {
            setVisible(false);
            completeRef.current?.();
          }, reduced ? 650 : 1250)
        );
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
      timers.forEach((id) => clearTimeout(id));
    };
  }, []);

  if (!visible) return null;

  const cleared = pct >= 100;
  const drawn = (i: number) => pct >= 8 + i * 10; // edge i starts drawing
  const call = CALLS[Math.min(CALLS.length - 1, Math.floor(pct / 22))];

  return (
    <>
      <style>{`
        .bp-root {
          position: fixed;
          inset: 0;
          z-index: var(--z-preloader);
          background: var(--space-black);
          color: var(--starlight);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: max(28px, env(safe-area-inset-top)) var(--pg-x) max(28px, env(safe-area-inset-bottom));
          transition: opacity .6s ease;
        }
        .bp-root[data-leaving="true"] { opacity: 0; }
        .bp-in { width: 100%; max-width: 720px; margin: 0 auto; }
        .bp-head {
          display: flex; justify-content: space-between; gap: 16px;
          font-size: 12px; letter-spacing: .22em; text-transform: uppercase; color: var(--dim-300);
        }
        .bp-hero { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 28px 0 8px; }
        .bp-globe { flex: none; width: clamp(84px, 24vw, 190px); aspect-ratio: 1; }
        .bp-globe svg { width: 100%; height: 100%; overflow: visible; }
        .bp-mer { transform-box: fill-box; transform-origin: center; animation: bp-mer 3.6s linear infinite; }
        .bp-mer.b { animation-delay: -1.2s; }
        .bp-mer.c { animation-delay: -2.4s; }
        @keyframes bp-mer { 0% { transform: scaleX(1); } 50% { transform: scaleX(0.03); } 100% { transform: scaleX(1); } }
        .bp-orbit { transform-origin: 50px 50px; transform: rotate(-24deg) scaleY(0.34); }
        .bp-sat { transform-origin: 50px 50px; animation: bp-turn 5.5s linear infinite; }
        @keyframes bp-turn { to { transform: rotate(360deg); } }
        .bp-count {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(56px, 18vw, 200px);
          line-height: .95;
          letter-spacing: -.02em;
          font-variant-numeric: tabular-nums;
          color: var(--starlight);
        }
        .bp-count span { font-size: .28em; letter-spacing: 0; margin-left: .15em; color: var(--dim-300); }
        .bp-sky { margin-top: 22px; width: 100%; }
        .bp-sky svg { width: 100%; height: auto; display: block; overflow: visible; }
        .bp-sweep { animation: bp-turn 3.2s linear infinite; }
        .bp-ping { transform-box: fill-box; transform-origin: center; animation: bp-ping 1.8s ease-out infinite; }
        @keyframes bp-ping { from { transform: scale(1); opacity: .9; } to { transform: scale(3.4); opacity: 0; } }
        .bp-in { position: relative; z-index: 1; }
        .bp-scene.as-root { inset: auto 0 0 0; height: 26%; }
        .bp-list { list-style: none; margin: 28px 0 0; padding: 0; display: grid; }
        .bp-row {
          display: flex; align-items: baseline; gap: 12px;
          min-height: 44px; padding: 10px 0;
          border-top: 1px solid var(--outline-variant);
          font-size: 14px; letter-spacing: .12em; text-transform: uppercase; color: var(--dim-300);
          transition: color .25s ease;
        }
        .bp-row:last-child { border-bottom: 1px solid var(--outline-variant); }
        .bp-row[data-on="true"] { color: var(--starlight); }
        .bp-lead { flex: 1; border-bottom: 1px dotted var(--outline-variant); transform: translateY(-4px); }
        .bp-state { min-width: 4ch; text-align: right; font-weight: 500; }
        .bp-row[data-on="true"] .bp-state { color: var(--lit); }
        .bp-row[data-now="true"] .bp-state { animation: bp-blink 0.9s steps(2, end) infinite; }
        @keyframes bp-blink { 50% { opacity: .25; } }
        .bp-foot { margin-top: 24px; font-size: 13px; letter-spacing: .24em; text-transform: uppercase; color: var(--dim-300); min-height: 1.4em; }
        .bp-foot[data-on="true"] { color: var(--lit); }
        .bp-ticker { position: fixed; left: 0; right: 0; bottom: 3px; overflow: hidden; border-top: 1px solid var(--outline-variant);
          padding: 10px 0; font-size: 12px; letter-spacing: .22em; text-transform: uppercase; color: var(--dim-300); white-space: nowrap; }
        .bp-ticker-track { display: inline-flex; gap: 48px; padding-left: 48px; animation: bp-tick 22s linear infinite; }
        @keyframes bp-tick { to { transform: translateX(-50%); } }
        .bp-ticker-track b { font-weight: 500; color: var(--starlight); }
        .bp-bar { position: fixed; left: 0; right: 0; bottom: 0; height: 3px; background: var(--hull-900); }
        .bp-bar > div { height: 100%; background: var(--lit); transition: width .12s linear; }
        @media (prefers-reduced-motion: reduce) {
          .bp-root, .bp-row, .bp-bar > div { transition: none; }
          .bp-row[data-now="true"] .bp-state { animation: none; }
          .bp-mer, .bp-sat, .bp-ticker-track, .bp-sweep, .bp-ping { animation: none; }
        }
      `}</style>

      <div
        className="bp-root"
        data-leaving={leaving}
        role="dialog"
        aria-modal="true"
        aria-label="Loading CSAU"
      >
        <AstronautScene className="bp-scene" />
        <div className="bp-in">
          <div className="bp-head">
            <span>CSAU</span>
            <span>Pre-flight &nbsp; T-{Math.max(0, Math.ceil(((100 - pct) / 100) * (MIN_MS / 1000)))}s</span>
          </div>

          <div className="bp-hero">
            <div className="bp-count" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Loading">
              {String(pct).padStart(3, "0")}
              <span>%</span>
            </div>
            <div className="bp-globe" aria-hidden>
              <svg viewBox="0 0 100 100" fill="none" stroke="var(--dim-300)" strokeWidth="0.8">
                <circle cx="50" cy="50" r="32" stroke="var(--starlight)" strokeWidth="1" />
                <ellipse className="bp-mer" cx="50" cy="50" rx="32" ry="32" />
                <ellipse className="bp-mer b" cx="50" cy="50" rx="32" ry="32" />
                <ellipse className="bp-mer c" cx="50" cy="50" rx="32" ry="32" />
                <path d="M18 50 h64 M22 34 h56 M22 66 h56" opacity=".55" />
                <g className="bp-orbit">
                  <circle cx="50" cy="50" r="46" strokeDasharray="2 3" opacity=".8" />
                  <g className="bp-sat">
                    <circle cx="96" cy="50" r="3.2" fill="var(--lit)" stroke="none" />
                  </g>
                </g>
              </svg>
            </div>
          </div>

          <div className="bp-sky" aria-hidden>
            <svg viewBox="0 0 290 160" preserveAspectRatio="xMidYMid meet">
              <g fill="none" stroke="var(--hull-700)" strokeWidth="0.8">
                <circle cx="145" cy="80" r="70" />
                <circle cx="145" cy="80" r="46" />
                <circle cx="145" cy="80" r="22" />
                <path d="M145 8v144M73 80h144" opacity=".5" />
                <g className="bp-sweep" style={{ transformOrigin: "145px 80px" }}>
                  <path d="M145 80L145 10" stroke="var(--lit)" strokeWidth="1.2" />
                  <path d="M145 80L145 10A70 70 0 0 1 182 20Z" fill="var(--lit)" stroke="none" opacity=".12" />
                </g>
              </g>
              {EDGES.map(([p, q], i) => (
                <line key={i} x1={NODES[p][0]} y1={NODES[p][1]} x2={NODES[q][0]} y2={NODES[q][1]} pathLength={1}
                  stroke="var(--starlight)" strokeWidth="1" strokeDasharray="1" strokeDashoffset={drawn(i) ? 0 : 1} opacity=".75"
                  style={{ transition: "stroke-dashoffset .5s ease" }} />
              ))}
              {NODES.map(([x, y], i) => {
                const on = i === 0 ? pct >= 4 : drawn(i - 1) || cleared;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r={on ? 3 : 1.4} fill={on ? "var(--lit)" : "var(--hull-700)"} style={{ transition: "all .3s ease" }} />
                    {on && <circle className="bp-ping" cx={x} cy={y} r="3" fill="none" stroke="var(--lit)" strokeWidth="0.8" />}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="bp-foot" data-on={cleared} aria-live="polite">
            {cleared ? "Link established / cleared for launch" : call}
          </div>
        </div>

        <div className="bp-ticker" aria-hidden>
          <div className="bp-ticker-track">
            {[0, 1].map((n) => (
              <span key={n} style={{ display: "inline-flex", gap: 48 }}>
                <span>Signal <b>searching</b></span>
                <span>Star tracker <b>locking</b></span>
                <span>Dish <b>aligning</b></span>
                <span>Constellation <b>plotted</b></span>
                <span>Link <b>open</b></span>
              </span>
            ))}
          </div>
        </div>

        <div className="bp-bar" aria-hidden>
          <div style={{ width: `${pct}%` }} />
        </div>
      </div>
    </>
  );
}
