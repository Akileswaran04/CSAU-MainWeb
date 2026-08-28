"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ============================================================
   CURSOR BOOT PRELOADER — Faithful port of cursor-character.html
   
   Animation sequence:
   1. Cursor appears with "INIT" label
   2. Draws a diamond shape with SVG lines  
   3. Types "CSAU" letter by letter with click effects
   4. Progress counter fills to 100%
   5. Stage fades out → content reveals
   
   Uses direct DOM manipulation during animation (no React state
   updates in the hot loop) for frame-perfect cursor movement.
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
  const pctRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const cancelledRef = useRef(false);

  // ── Cursor animation (pure DOM, no React state) ──

  const cxRef = useRef(0);
  const cyRef = useRef(0);

  const setCursor = useCallback((x: number, y: number) => {
    cxRef.current = x;
    cyRef.current = y;
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }
  }, []);

  /** Eased linear interpolation using requestAnimationFrame — exact port of original */
  const moveTo = useCallback(
    (x: number, y: number, duration = 700): Promise<void> =>
      new Promise((resolve) => {
        const sx = cxRef.current;
        const sy = cyRef.current;
        const start = performance.now();
        const step = (t: number) => {
          if (cancelledRef.current) { resolve(); return; }
          let p = Math.min((t - start) / duration, 1);
          const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
          setCursor(sx + (x - sx) * e, sy + (y - sy) * e);
          if (p < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
    [setCursor],
  );

  /** Set the cursor label text directly (no React re-render) */
  const setLabel = useCallback((t: string) => {
    if (labelRef.current) labelRef.current.textContent = t;
  }, []);

  /** Set the progress counter directly (no React re-render) */
  const setPct = useCallback((n: number) => {
    if (pctRef.current) pctRef.current.textContent = String(n).padStart(3, "0");
  }, []);

  /** Click pulse ring effect at cursor position */
  const addClickFX = useCallback(() => {
    if (!stageRef.current) return;
    const ring = document.createElement("div");
    ring.style.cssText = `position:absolute;width:8px;height:8px;border-radius:50%;border:1.5px solid #00f0ff;left:${cxRef.current}px;top:${cyRef.current}px;transform:translate(-50%,-50%);pointer-events:none;box-shadow:0 0 10px #00f0ff;animation:bootClickPulse .55s ease-out forwards;`;
    stageRef.current.appendChild(ring);
    setTimeout(() => ring.remove(), 600);
  }, []);

  /** Draw an SVG line while cursor moves to endpoint — exact port of original */
  const drawLine = useCallback(
    (x1: number, y1: number, x2: number, y2: number, dur = 500): Promise<void> =>
      new Promise((resolve) => {
        if (!svgRef.current) { resolve(); return; }
        const path = document.createElementNS(SVGNS, "path");
        path.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2}`);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#00f0ff");
        path.setAttribute("stroke-width", "1.6");
        path.style.filter = "drop-shadow(0 0 5px rgba(0,240,255,.8))";
        path.style.strokeDasharray = "1";
        path.style.strokeDashoffset = "1";
        path.style.vectorEffect = "non-scaling-stroke";
        svgRef.current.appendChild(path);

        const len = path.getTotalLength();
        path.style.strokeDasharray = String(len);
        path.style.strokeDashoffset = String(len);
        // Force layout so transition triggers
        path.getBoundingClientRect();
        path.style.transition = `stroke-dashoffset ${dur}ms linear`;
        // Start line draw + cursor move simultaneously
        requestAnimationFrame(() => { path.style.strokeDashoffset = "0"; });
        moveTo(x2, y2, dur).then(resolve);
      }),
    [moveTo],
  );

  // ── Main animation sequence ──

  useEffect(() => {
    if (!visible) return;
    cancelledRef.current = false;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const cxp = W / 2;
    const cyp = H / 2;

    // Position cursor at center immediately
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
      await moveTo(pts[0][0], pts[0][1], 500);
      if (cancelledRef.current) return;

      setLabel("DRAW");
      for (let i = 0; i < pts.length; i++) {
        const next = (i + 1) % pts.length;
        await drawLine(pts[i][0], pts[i][1], pts[next][0], pts[next][1], 380);
        if (cancelledRef.current) return;
      }

      // Fill diamond
      if (svgRef.current) {
        const poly = document.createElementNS(SVGNS, "polygon");
        poly.setAttribute("points", pts.map((p) => p.join(",")).join(" "));
        poly.setAttribute("fill", "rgba(0,240,255,.06)");
        poly.setAttribute("stroke", "#00f0ff");
        poly.setAttribute("stroke-width", "1.2");
        poly.style.opacity = "0";
        svgRef.current.appendChild(poly);
        requestAnimationFrame(() => {
          poly.style.transition = "opacity .5s";
          poly.style.opacity = "1";
        });
      }
      addClickFX();
      setPct(35);

      setLabel("MARK");
      for (const p of pts) {
        const dx = p[0] - cxp;
        const dy = p[1] - cyp;
        await moveTo(p[0], p[1], 160);
        if (cancelledRef.current) return;
        await drawLine(p[0], p[1], p[0] + dx * 0.35, p[1] + dy * 0.35, 140);
        if (cancelledRef.current) return;
        addClickFX();
      }
      setPct(70);

      setLabel("WRITE");
      if (caretLineRef.current) caretLineRef.current.style.opacity = "1";

      const letters = wordRef.current?.querySelectorAll<HTMLElement>(".boot-char");
      if (letters?.length) {
        for (const ch of letters) {
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
        }
      }

      setPct(100);
      setLabel("DONE");
      await new Promise((r) => setTimeout(r, 450));
      if (cancelledRef.current) return;
      addClickFX();

      // Fade out stage
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

  const handleSkip = useCallback(() => {
    cancelledRef.current = true;
    if (stageRef.current) {
      stageRef.current.style.transition = "opacity .3s ease";
      stageRef.current.style.opacity = "0";
      setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 300);
    }
  }, [onComplete]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes bootClickPulse { 0%{width:8px;height:8px;opacity:1} 100%{width:64px;height:64px;opacity:0} }
        .boot-char { opacity:0; transform:translateY(14px); transition: opacity .25s, transform .25s, color .25s, text-shadow .25s; }
        .boot-char-filled { color:#f2f4ff !important; -webkit-text-stroke:1.5px #00f0ff !important; text-shadow:0 0 26px rgba(0,240,255,.85),0 0 60px rgba(0,240,255,.4) !important; }
      `}</style>
      <div
        ref={stageRef}
        className="fixed inset-0 overflow-hidden"
        style={{
          zIndex: 9999,
          background: "radial-gradient(ellipse at 50% 40%,#17102b 0%,transparent 60%),repeating-linear-gradient(135deg,#0a0b16 0 2px,#050507 2px 90px),repeating-linear-gradient(45deg,#0a0b16 0 2px,#050507 2px 90px),#050507",
          cursor: "none",
        }}
        role="dialog"
        aria-label="Loading CSAU"
        aria-modal="true"
      >
        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "repeating-linear-gradient(to bottom,rgba(0,240,255,.03) 0px,rgba(0,240,255,.03) 1px,transparent 1px,transparent 3px)", mixBlendMode: "screen" }} />
        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 220px 40px #020103" }} />

        {/* Corners */}
        {[{ top: "6%", left: "6%" }, { top: "6%", right: "6%" }, { bottom: "6%", left: "6%" }, { bottom: "6%", right: "6%" }].map((pos, i) => (
          <div key={i} className="absolute pointer-events-none" style={{ width: 70, height: 70, opacity: 0.5, ...pos }}>
            <span className="absolute" style={{ width: 5, height: 5, background: "#00f0ff", boxShadow: "0 0 6px #00f0ff", top: i < 2 ? 0 : undefined, bottom: i >= 2 ? 0 : undefined, left: i % 2 === 0 ? 0 : undefined, right: i % 2 === 1 ? 0 : undefined }} />
            <span className="absolute" style={{ width: 5, height: 5, background: "#00f0ff", boxShadow: "0 0 6px #00f0ff", top: i < 2 ? 0 : undefined, bottom: i >= 2 ? 0 : undefined, left: i % 2 === 0 ? 16 : undefined, right: i % 2 === 1 ? 16 : undefined }} />
          </div>
        ))}

        {/* SVG canvas */}
        <svg ref={svgRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 2 }} />

        {/* CSAU word */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 3 }}>
          <div ref={wordRef} className="flex" style={{ fontFamily: "'Zen Dots', sans-serif", fontWeight: 400, fontSize: "clamp(50px,12vw,180px)", letterSpacing: ".08em", color: "transparent", WebkitTextStroke: "1.5px rgba(0,240,255,.9)", textShadow: "0 0 40px rgba(0,240,255,.35)" }}>
            {"CSAU".split("").map((ch, i) => (
              <span key={i} className="boot-char inline-block" style={{ WebkitTextStroke: "1.5px rgba(0,240,255,.9)" }}>{ch}</span>
            ))}
          </div>
        </div>

        {/* Caret line */}
        <div ref={caretLineRef} className="absolute left-1/2 text-center pointer-events-none" style={{ bottom: "32%", transform: "translateX(-50%)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: ".25em", color: "#5c6190", opacity: 0, transition: "opacity .5s", zIndex: 3 }}>
          COMPUTER SCIENCE ASSOCIATION // CEG
        </div>

        {/* Progress */}
        <div className="absolute left-1/2 pointer-events-none" style={{ bottom: "6%", transform: "translateX(-50%)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#5c6190", letterSpacing: ".2em", zIndex: 3 }}>
          SYSTEM DRAW <span ref={pctRef} style={{ color: "#00f0ff" }}>000</span>%
        </div>

        {/* Skip */}
        <button
          onClick={handleSkip}
          className="absolute pointer-events-auto transition-colors"
          style={{ bottom: "6%", right: "6%", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: ".08em", color: "#5c6190", border: "1px solid #2a2d45", padding: "6px 12px", background: "rgba(10,11,22,.6)", cursor: "pointer", zIndex: 3 }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#00f0ff"; e.currentTarget.style.borderColor = "#00f0ff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#5c6190"; e.currentTarget.style.borderColor = "#2a2d45"; }}
        >
          SKIP INTRO »
        </button>

        {/* Cursor */}
        <div ref={cursorRef} className="absolute top-0 left-0 pointer-events-none" style={{ zIndex: 10, width: 0, height: 0 }}>
          <svg width="26" height="26" viewBox="0 0 26 26" style={{ position: "absolute", top: -2, left: -2, overflow: "visible" }}>
            <circle cx="13" cy="13" r="11" fill="none" stroke="#00f0ff" strokeWidth="1.4" opacity=".55" />
            <path d="M4 3 L4 20 L9 15.5 L12.5 22 L15.5 20.5 L12 14 L19 14 Z" fill="#f2f4ff" stroke="#00f0ff" strokeWidth="1" style={{ filter: "drop-shadow(0 0 6px #00f0ff)" }} />
          </svg>
          <div ref={labelRef} className="absolute whitespace-nowrap" style={{ left: 18, top: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#00f0ff", letterSpacing: ".1em", opacity: 0.85, textShadow: "0 0 6px #00f0ff" }}>
            READY
          </div>
        </div>
      </div>
    </>
  );
}
