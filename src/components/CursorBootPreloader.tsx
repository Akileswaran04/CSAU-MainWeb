"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { UplinkLoader } from "./UplinkLoader";

/* ============================================================
   CURSOR BOOT PRELOADER — White Sculptural Tactility Theme

   1. Cursor appears with "INIT" label
   2. Draws a diamond shape with SVG lines (clay accent)
   3. Types "CSAU" letter by letter with click effects
   4. UplinkLoader progress bar — driven by animation phases
      AND real page loading (whichever is ahead wins)
   5. Stage fades out only when BOTH animation AND load finish

   No skip button — preloader syncs with actual page load time.
   ============================================================ */

interface CursorBootPreloaderProps {
  onComplete?: () => void;
}

const SVGNS = "http://www.w3.org/2000/svg";



export default function CursorBootPreloader({ onComplete }: CursorBootPreloaderProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const caretLineRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const cancelledRef = useRef(false);

  // Combined progress (0-100) — max of animation phase + real loading
  const [displayProgress, setDisplayProgress] = useState(0);
  const animProgressRef = useRef(0);
  const loadProgressRef = useRef(0);
  // Whether real page loading is done
  const loadDoneRef = useRef(false);

  const cxRef = useRef(0);
  const cyRef = useRef(0);

  const setCursor = useCallback((x: number, y: number) => {
    cxRef.current = x;
    cyRef.current = y;
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }
  }, []);

  const moveTo = useCallback(
    (x: number, y: number, duration = 700): Promise<void> =>
      new Promise((resolve) => {
        const sx = cxRef.current;
        const sy = cyRef.current;
        const start = performance.now();
        const step = (t: number) => {
          if (cancelledRef.current) { resolve(); return; }
          let p = Math.min((t - start) / duration, 1);
          const e = 1 - Math.pow(1 - p, 3);
          setCursor(sx + (x - sx) * e, sy + (y - sy) * e);
          if (p < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
    [setCursor],
  );

  const setLabel = useCallback((t: string) => {
    if (labelRef.current) labelRef.current.textContent = t;
  }, []);

  const addClickFX = useCallback(() => {
    if (!stageRef.current) return;
    const ring = document.createElement("div");
    ring.style.cssText = `position:absolute;width:8px;height:8px;border-radius:50%;border:1.5px solid var(--outline-variant);left:${cxRef.current}px;top:${cyRef.current}px;transform:translate(-50%,-50%);pointer-events:none;box-shadow:0 0 8px rgba(119,118,123,0.25);animation:bootClickPulse .55s ease-out forwards;`;
    stageRef.current.appendChild(ring);
    setTimeout(() => ring.remove(), 600);
  }, []);

  const drawLine = useCallback(
    (x1: number, y1: number, x2: number, y2: number, dur = 500): Promise<void> =>
      new Promise((resolve) => {
        if (!svgRef.current) { resolve(); return; }
        const path = document.createElementNS(SVGNS, "path");
        path.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2}`);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "var(--outline)");
        path.setAttribute("stroke-width", "1.6");
        path.style.filter = "drop-shadow(0 0 4px rgba(119,118,123,0.3))";
        path.style.strokeDasharray = "1";
        path.style.strokeDashoffset = "1";
        path.style.vectorEffect = "non-scaling-stroke";
        svgRef.current.appendChild(path);

        const len = path.getTotalLength();
        path.style.strokeDasharray = String(len);
        path.style.strokeDashoffset = String(len);
        path.getBoundingClientRect();
        path.style.transition = `stroke-dashoffset ${dur}ms linear`;
        requestAnimationFrame(() => { path.style.strokeDashoffset = "0"; });
        moveTo(x2, y2, dur).then(resolve);
      }),
    [moveTo],
  );

  // Helper: set animation progress and update display
  const setAnimProgress = useCallback((pct: number) => {
    animProgressRef.current = pct;
    setDisplayProgress(Math.max(animProgressRef.current, loadProgressRef.current));
  }, []);

  // ── Real loading tracker ──
  useEffect(() => {
    if (!visible) return;

    // If page is already fully loaded (window.load fired before mount),
    // mark done immediately so the animation finish isn't blocked.
    if (document.readyState === "complete") {
      loadProgressRef.current = 100;
      loadDoneRef.current = true;
      setDisplayProgress(Math.max(100, animProgressRef.current));
      return;
    }

    let raf: number;

    const tick = () => {
      if (cancelledRef.current) return;

      // When document is fully loaded, all resources are done — force 100%
      // (readyState can change at runtime even if we early-returned above)
      if ((document.readyState as string) === "complete") {
        loadProgressRef.current = 100;
        loadDoneRef.current = true;
        setDisplayProgress(Math.max(100, animProgressRef.current));
        return;
      }

      let loaded = 0;
      let total = 0;

      // Fonts
      if (document.fonts) {
        const fonts = [...document.fonts];
        total += fonts.length;
        loaded += fonts.filter((f) => f.status === "loaded").length;
      }

      // Images
      const imgs = document.querySelectorAll<HTMLImageElement>("img");
      total += imgs.length;
      loaded += [...imgs].filter(
        (img) => img.complete && img.naturalWidth > 0,
      ).length;

      // Document ready floor
      const docReady = document.readyState === "complete" ? 30 :
                       document.readyState === "interactive" ? 15 : 0;

      const resourcePct = total > 0 ? (loaded / total) * 70 : 70;
      const pct = Math.min(100, Math.round(docReady + resourcePct));

      // Never go backwards
      const target = Math.max(loadProgressRef.current, pct);
      loadProgressRef.current = target;
      setDisplayProgress(Math.max(target, animProgressRef.current));

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    const onLoad = () => {
      loadProgressRef.current = 100;
      setDisplayProgress(Math.max(100, animProgressRef.current));
      loadDoneRef.current = true;
    };
    window.addEventListener("load", onLoad);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
    };
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cursor animation sequence ──
  useEffect(() => {
    if (!visible) return;
    cancelledRef.current = false;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const cxp = W / 2;
    const cyp = H / 2;

    setCursor(cxp, cyp);

    const run = async () => {
      await new Promise((r) => setTimeout(r, 300));

      const s = Math.min(150, W * 0.12);
      const pts: [number, number][] = [
        [cxp, cyp - s],
        [cxp + s, cyp],
        [cxp, cyp + s],
        [cxp - s, cyp],
      ];

      setLabel("INIT");
      setAnimProgress(8);
      await moveTo(pts[0][0], pts[0][1], 500);
      if (cancelledRef.current) return;

      setLabel("DRAW");
      for (let i = 0; i < pts.length; i++) {
        const next = (i + 1) % pts.length;
        await drawLine(pts[i][0], pts[i][1], pts[next][0], pts[next][1], 380);
        if (cancelledRef.current) return;
        // Incremental progress during draw: 8 → 35 over 4 lines
        setAnimProgress(8 + Math.round(((i + 1) / 4) * 27));
      }

      if (svgRef.current) {
        const poly = document.createElementNS(SVGNS, "polygon");
        poly.setAttribute("points", pts.map((p) => p.join(",")).join(" "));
        poly.setAttribute("fill", "rgba(39,39,42,.04)");
        poly.setAttribute("stroke", "var(--outline-variant)");
        poly.setAttribute("stroke-width", "1.2");
        poly.style.opacity = "0";
        svgRef.current.appendChild(poly);
        requestAnimationFrame(() => {
          poly.style.transition = "opacity .5s";
          poly.style.opacity = "1";
        });
      }
      addClickFX();
      setAnimProgress(42);

      setLabel("MARK");
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const dx = p[0] - cxp;
        const dy = p[1] - cyp;
        await moveTo(p[0], p[1], 160);
        if (cancelledRef.current) return;
        await drawLine(p[0], p[1], p[0] + dx * 0.35, p[1] + dy * 0.35, 140);
        if (cancelledRef.current) return;
        addClickFX();
        // Incremental progress during mark: 42 → 70 over 4 points
        setAnimProgress(42 + Math.round(((i + 1) / 4) * 28));
      }

      setLabel("WRITE");
      if (caretLineRef.current) caretLineRef.current.style.opacity = "1";

      const letters = wordRef.current?.querySelectorAll<HTMLElement>(".boot-char");
      if (letters?.length) {
        for (let i = 0; i < letters.length; i++) {
          const ch = letters[i];
          if (cancelledRef.current) return;
          const r = ch.getBoundingClientRect();
          const tx = r.left + r.width / 2;
          const ty = r.top + r.height * 0.78;
          await moveTo(tx, ty - 40, 260);
          if (cancelledRef.current) return;
          await moveTo(tx, ty, 140);
          if (cancelledRef.current) return;
          addClickFX();
          ch.style.opacity = "1";
          ch.style.transform = "translateY(0)";
          ch.classList.add("boot-char-filled");
          await new Promise((r) => setTimeout(r, 90));
          // Incremental progress during write: 70 → 95 over 4 letters
          setAnimProgress(70 + Math.round(((i + 1) / 4) * 25));
        }
      }

      setLabel("DONE");
      setAnimProgress(100);

      // Wait for real page loading to finish before fading out
      await new Promise<void>((resolve) => {
        const poll = setInterval(() => {
          if (cancelledRef.current || loadDoneRef.current) {
            clearInterval(poll);
            resolve();
          }
        }, 100);
      });
      if (cancelledRef.current) return;

      addClickFX();

      if (stageRef.current) {
        stageRef.current.style.transition = "opacity .6s ease";
        stageRef.current.style.opacity = "0";
        await new Promise((r) => setTimeout(r, 600));
      }
      if (!cancelledRef.current) {
        setVisible(false);
        onComplete?.();
      }
    };

    run();
    return () => { cancelledRef.current = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <>
      <style>{`
        @font-face {
          font-family: 'Sector034';
          src: url('/fonts/sector-034/sector_034.ttf') format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        @keyframes bootClickPulse { 0%{width:8px;height:8px;opacity:1} 100%{width:64px;height:64px;opacity:0} }
        .boot-char { opacity:0; transform:translateY(14px); transition: opacity .25s, transform .25s, color .25s; }
        .boot-char-filled { color: var(--on-surface) !important; -webkit-text-stroke: 1.5px var(--primary-container) !important; text-shadow: 0 0 20px rgba(39,39,42,.15), 0 0 50px rgba(39,39,42,.08) !important; }
        .uplink-bar-wrap {
          position: absolute;
          bottom: 5%;
          left: 50%;
          transform: translateX(-50%);
          width: clamp(320px, 50vw, 600px);
          height: 50px;
          z-index: 5;
          pointer-events: none;
          opacity: 0;
          animation: uplinkBarFadeIn 0.6s ease 0.3s forwards;
          background: linear-gradient(
            to top,
            rgba(251, 248, 255, 0.88) 0%,
            rgba(251, 248, 255, 0.55) 70%,
            rgba(251, 248, 255, 0) 100%
          );
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          border-top: 1px solid rgba(199, 198, 203, 0.3);
          border-radius: 4px 4px 0 0;
        }
        @keyframes uplinkBarFadeIn {
          to { opacity: 1; }
        }
      `}</style>
      <div
        ref={stageRef}
        className="fixed inset-0 overflow-hidden"
        style={{
          zIndex: 9999,
          background: `radial-gradient(ellipse at 50% 40%, var(--surface-container-low) 0%, transparent 60%), var(--background)`,
          cursor: "none",
        }}
        role="dialog"
        aria-label="Loading CSAU"
        aria-modal="true"
      >
        {/* Scanlines — light */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "repeating-linear-gradient(to bottom, rgba(26,27,34,.015) 0px, rgba(26,27,34,.015) 1px, transparent 1px, transparent 4px)", mixBlendMode: "multiply" }} />
        {/* Vignette — subtle */}
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 220px 40px rgba(26,27,34,.06)" }} />

        {/* Corners — clay dots */}
        {[{ top: "6%", left: "6%" }, { top: "6%", right: "6%" }, { bottom: "6%", left: "6%" }, { bottom: "6%", right: "6%" }].map((pos, i) => (
          <div key={i} className="absolute pointer-events-none" style={{ width: 70, height: 70, opacity: 0.5, ...pos }}>
            <span className="absolute" style={{ width: 5, height: 5, background: "var(--outline-variant)", boxShadow: "0 0 4px rgba(119,118,123,0.2)", top: i < 2 ? 0 : undefined, bottom: i >= 2 ? 0 : undefined, left: i % 2 === 0 ? 0 : undefined, right: i % 2 === 1 ? 0 : undefined }} />
            <span className="absolute" style={{ width: 5, height: 5, background: "var(--outline-variant)", boxShadow: "0 0 4px rgba(119,118,123,0.2)", top: i < 2 ? 0 : undefined, bottom: i >= 2 ? 0 : undefined, left: i % 2 === 0 ? 16 : undefined, right: i % 2 === 1 ? 16 : undefined }} />
          </div>
        ))}

        {/* SVG canvas */}
        <svg ref={svgRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 2 }} />

        {/* CSAU word */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 3 }}>
          <div ref={wordRef} className="flex" style={{ fontFamily: "'Ethnocentric', 'Sector034', sans-serif", fontWeight: 900, fontSize: "clamp(60px,14vw,200px)", letterSpacing: ".08em", color: "transparent", WebkitTextStroke: "2px var(--primary-container)", textShadow: "0 0 30px rgba(39,39,42,.1)" }}>
            {"CSAU".split("").map((ch, i) => (
              <span key={i} className="boot-char inline-block" style={{ WebkitTextStroke: "2px var(--primary-container)" }}>{ch}</span>
            ))}
          </div>
        </div>

        {/* Caret line */}
        <div ref={caretLineRef} className="absolute left-1/2 text-center pointer-events-none" style={{ bottom: "32%", transform: "translateX(-50%)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, letterSpacing: ".25em", color: "var(--outline)", opacity: 0, transition: "opacity .5s", zIndex: 3 }}>
          COMPUTER SCIENCE ASSOCIATION // CEG
        </div>

        {/* UplinkLoader progress bar — driven by animation + real load */}
        <div className="uplink-bar-wrap">
          <UplinkLoader
            progress={displayProgress}
            style={{
              position: "absolute",
              inset: 0,
            }}
          />
        </div>

        {/* Cursor */}
        <div ref={cursorRef} className="absolute top-0 left-0 pointer-events-none" style={{ zIndex: 10, width: 0, height: 0 }}>
          <svg width="26" height="26" viewBox="0 0 26 26" style={{ position: "absolute", top: -2, left: -2, overflow: "visible" }}>
            <circle cx="13" cy="13" r="11" fill="none" stroke="var(--outline-variant)" strokeWidth="1.4" opacity=".6" />
            <path d="M4 3 L4 20 L9 15.5 L12.5 22 L15.5 20.5 L12 14 L19 14 Z" fill="var(--on-surface)" stroke="var(--outline-variant)" strokeWidth="1" style={{ filter: "drop-shadow(0 0 4px rgba(119,118,123,0.3))" }} />
          </svg>
          <div ref={labelRef} className="absolute whitespace-nowrap" style={{ left: 18, top: 16, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--on-surface-variant)", letterSpacing: ".1em", opacity: 0.85 }}>READY</div>
        </div>
      </div>
    </>
  );
}
