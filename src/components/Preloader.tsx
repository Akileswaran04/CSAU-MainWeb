"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";

/* ============================================================================
   CAVE PRELOADER — Fixed z-index layering so Enter is always clickable.
   
   Layer order (bottom → top):
     z-80  tunnel arches
     z-90  cave scene
     z-100 wooden boards (crack during loading, pointer-events:none after)
     z-110 Enter button + warning sign + progress (ALWAYS on top)
   ============================================================================ */

type Phase = "loading" | "cave" | "entering" | "done";

const BOARD_COUNT = 10;
const DUSTY_WHITE = "#E8E4DC";

const WORDS = [
  { text: "you don't need a cave", size: "clamp(1.4rem, 3.5vw, 2.4rem)" },
  { text: "you need", size: "clamp(1.8rem, 4.5vw, 3.2rem)" },
  { text: "CSAU", size: "clamp(3.5rem, 11vw, 9rem)" },
];

/* ==========================================================================
   Audio helpers
   ========================================================================== */

function createCtx(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playCrack() {
  const c = createCtx();
  if (!c) return;
  const dur = 0.18;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / c.sampleRate;
    d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 28) * 0.5;
  }
  const s = c.createBufferSource();
  s.buffer = buf;
  s.connect(c.destination);
  s.start();
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.value = 55 + Math.random() * 30;
  const g = c.createGain();
  g.gain.setValueAtTime(0.25, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.1);
}

function playWhoosh() {
  const c = createCtx();
  if (!c) return;
  const dur = 0.7;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / c.sampleRate;
    d[i] = (Math.random() * 2 - 1) * Math.sin((t / dur) * Math.PI) * 0.35;
  }
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.setValueAtTime(400, c.currentTime);
  f.frequency.exponentialRampToValueAtTime(4000, c.currentTime + dur);
  f.Q.value = 0.8;
  s.connect(f);
  f.connect(c.destination);
  s.start();
}

function playHum() {
  const c = createCtx();
  if (!c) return;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(35, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(110, c.currentTime + 2.2);
  const g = c.createGain();
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(0.12, c.currentTime + 0.5);
  g.gain.linearRampToValueAtTime(0.06, c.currentTime + 2.2);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 2.8);
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + 2.8);
}

function playDust() {
  const c = createCtx();
  if (!c) return;
  const dur = 0.55;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / c.sampleRate;
    d[i] = (Math.random() * 2 - 1) * Math.sin((t / dur) * Math.PI) * 0.06;
  }
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 3200;
  f.Q.value = 0.6;
  s.connect(f);
  f.connect(c.destination);
  s.start();
}

/* ==========================================================================
   Main Component
   ========================================================================== */

export default function Preloader() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);
  const [gone, setGone] = useState(false);
  const [boardsBlocking, setBoardsBlocking] = useState(true);
  const phaseRef = useRef<Phase>("loading");

  const containerRef = useRef<HTMLDivElement>(null);
  const boardsRef = useRef<HTMLDivElement>(null);
  const caveRef = useRef<HTMLDivElement>(null);
  const tunnelRef = useRef<HTMLDivElement>(null);
  const lightOverlayRef = useRef<HTMLDivElement>(null);
  const enterBtnRef = useRef<HTMLButtonElement>(null);
  const warningRef = useRef<HTMLDivElement>(null);
  const wordLayerRef = useRef<HTMLDivElement>(null);
  const archRefs = useRef<HTMLDivElement[]>([]);

  /* ---- Break a single board (split into halves) ---- */
  const breakBoard = useCallback((index: number) => {
    playCrack();
    const topEl = boardsRef.current?.querySelector(
      `[data-board="${index}"][data-half="top"]`
    );
    const botEl = boardsRef.current?.querySelector(
      `[data-board="${index}"][data-half="bottom"]`
    );
    const crackEl = boardsRef.current?.querySelector(
      `[data-board="${index}"][data-crack]`
    );

    if (crackEl) gsap.to(crackEl, { opacity: 1, duration: 0.15 });

    if (topEl) {
      gsap.to(topEl, {
        y: -(8 + Math.random() * 16),
        rotation: (Math.random() - 0.5) * 2.5,
        duration: 0.3,
        ease: "power2.out",
      });
    }
    if (botEl) {
      gsap.to(botEl, {
        y: 8 + Math.random() * 16,
        rotation: (Math.random() - 0.5) * 2.5,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }, []);

  /* ---- Loading ---- */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    let start = performance.now();
    let loaded = document.readyState === "complete";
    const onLoad = () => (loaded = true);
    window.addEventListener("load", onLoad);

    let raf = 0;
    let lastBreak = -1;

    function tick(now: number) {
      const t = (now - start) / 7000;
      const cap = loaded ? 1 : 0.92;
      const p = Math.min(t, cap);
      setProgress(Math.floor(p * 100));

      const target = Math.floor(p * (BOARD_COUNT + 1));
      if (target > lastBreak && phaseRef.current === "loading") {
        for (let i = lastBreak + 1; i <= Math.min(target, BOARD_COUNT - 1); i++) {
          breakBoard(i);
        }
        lastBreak = Math.min(target, BOARD_COUNT - 1);
      }

      if (p >= 1 && phaseRef.current === "loading") {
        for (let i = lastBreak + 1; i < BOARD_COUNT; i++) {
          setTimeout(() => breakBoard(i), (i - lastBreak) * 55);
        }
        phaseRef.current = "cave";
        setTimeout(() => {
          setPhase("cave");
          setBoardsBlocking(false); // boards no longer block clicks
        }, BOARD_COUNT * 55 + 350);
      }

      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
      document.body.style.overflow = "";
    };
  }, [breakBoard]);

  /* ---- Cave reveal ---- */
  useEffect(() => {
    if (phase !== "cave") return;
    if (caveRef.current) {
      gsap.fromTo(caveRef.current, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power2.out" });
    }
    if (warningRef.current) {
      gsap.fromTo(warningRef.current, { opacity: 0, y: -15 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.3, ease: "back.out(1.3)" });
    }
    if (enterBtnRef.current) {
      gsap.fromTo(enterBtnRef.current, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.55, delay: 0.6, ease: "back.out(2)" });
    }
  }, [phase]);

  /* ---- Enter click ---- */
  const handleEnter = useCallback(() => {
    if (phaseRef.current !== "cave") return;
    phaseRef.current = "entering";
    setPhase("entering");

    playWhoosh();

    // Vanish all board halves off screen
    const allHalves = boardsRef.current?.querySelectorAll("[data-half]");
    if (allHalves) {
      allHalves.forEach((el, i) => {
        const isTop = (el as HTMLElement).dataset.half === "top";
        gsap.to(el, {
          y: isTop ? -window.innerHeight * 1.2 : window.innerHeight * 1.2,
          x: (Math.random() - 0.5) * 400,
          rotation: (Math.random() - 0.5) * 25,
          opacity: 0,
          duration: 0.55 + Math.random() * 0.2,
          ease: "power2.in",
          delay: i * 0.015,
        });
      });
    }

    const tl = gsap.timeline({
      onComplete: () => {
        phaseRef.current = "done";
        (window as any).__csauEntered = true;
        window.dispatchEvent(new CustomEvent("csau:entered"));
        document.documentElement.classList.add("csau-entered");
        document.body.style.overflow = "";
        setGone(true);
      },
    });

    tl.to([enterBtnRef.current, warningRef.current], { opacity: 0, duration: 0.3 }, 0);
    tl.call(() => playHum(), undefined, 0.2);
    tl.to(lightOverlayRef.current, { opacity: 1, duration: 1.4, ease: "power2.inOut" }, 0.4);

    archRefs.current.forEach((arch, i) => {
      if (arch) {
        tl.to(arch, { borderColor: "rgba(232,228,220,0.22)", boxShadow: "0 0 10px rgba(232,228,220,0.06)", duration: 0.3 }, 0.6 + i * 0.12);
      }
    });

    tl.to(tunnelRef.current, { scale: 4.5, duration: 3, ease: "power2.in" }, 1.2);

    WORDS.forEach((_, i) => {
      const t = 4.5 + i * 3.2;
      tl.call(() => showWord(i), undefined, t);
      tl.call(() => dustWord(i), undefined, t + 1.8);
    });

    tl.to(containerRef.current, { opacity: 0, duration: 0.8, ease: "power2.in" }, WORDS.length * 3.2 + 5.5);
  }, []);

  /* ---- Show word ---- */
  function showWord(index: number) {
    if (!wordLayerRef.current) return;
    wordLayerRef.current.innerHTML = "";
    const { text, size } = WORDS[index];
    const isLast = index === WORDS.length - 1;

    const wrapper = document.createElement("div");
    wrapper.className = "tunnel-word";
    wrapper.style.cssText = `
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      font-family: 'Centrion', var(--font-display), sans-serif;
      font-size: ${size}; font-weight: 700;
      letter-spacing: ${isLast ? "0.12em" : "0.06em"};
      color: ${isLast ? "#ffffff" : DUSTY_WHITE}; white-space: nowrap;
      text-shadow: ${isLast ? "0 0 40px rgba(255,255,255,0.4), 0 0 80px rgba(232,228,220,0.2)" : "0 0 25px rgba(232,228,220,0.25)"};
    `;
    for (const ch of text) {
      const span = document.createElement("span");
      span.textContent = ch === " " ? "\u00A0" : ch;
      span.style.display = "inline-block";
      wrapper.appendChild(span);
    }
    wordLayerRef.current.appendChild(wrapper);
    gsap.fromTo(wrapper, { opacity: 0, scale: 0.88, filter: "blur(4px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.55, ease: "power2.out" });
  }

  /* ---- Dissolve word ---- */
  function dustWord(index: number) {
    playDust();
    const wrapper = wordLayerRef.current?.querySelector(".tunnel-word");
    if (!wrapper) return;
    const chars = wrapper.querySelectorAll("span");
    const isLast = index === WORDS.length - 1;
    const count = isLast ? 8 : 4;

    chars.forEach((ch) => {
      const rect = (ch as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      for (let p = 0; p < count; p++) {
        const dot = document.createElement("div");
        dot.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${2 + Math.random() * (isLast ? 5 : 3)}px;height:${2 + Math.random() * (isLast ? 5 : 3)}px;background:${isLast ? "#fff" : DUSTY_WHITE};border-radius:50%;pointer-events:none;z-index:120;opacity:0.9;`;
        document.body.appendChild(dot);
        gsap.to(dot, { x: (Math.random() - 0.5) * (isLast ? 280 : 180), y: (Math.random() - 0.5) * (isLast ? 280 : 160) - 30, opacity: 0, scale: 0, duration: 0.7 + Math.random() * 0.4, ease: "power2.out", onComplete: () => dot.remove() });
      }
      gsap.to(ch, { y: (Math.random() - 0.5) * 50, x: (Math.random() - 0.5) * 70, opacity: 0, rotation: (Math.random() - 0.5) * 35, scale: 0.2, duration: 0.65, ease: "power2.in" });
    });
    gsap.to(wrapper, { opacity: 0, duration: 0.75, delay: 0.4 });
  }

  if (gone) return null;

  const boardH = 10; // vh per board

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] overflow-hidden" style={{ background: "#000" }}>

      {/* ═══ Layer z-90: Cave scene ═══ */}
      <div ref={caveRef} className="absolute inset-0" style={{ opacity: 0, zIndex: 90 }}>
        {/* Cave arch body */}
        <div style={{
          position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "85%", height: "90%",
          background: "radial-gradient(ellipse 100% 80% at 50% 100%, #0c0908 0%, #060404 55%, #000 100%)",
          borderRadius: "50% 50% 0 0 / 28% 28% 0 0",
          border: "2px solid rgba(55,45,35,0.2)", borderBottom: "none", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at 15% 22%, rgba(45,38,30,0.3) 0%, transparent 40%), radial-gradient(circle at 75% 50%, rgba(55,42,32,0.2) 0%, transparent 35%), radial-gradient(circle at 35% 80%, rgba(40,32,26,0.22) 0%, transparent 28%)",
          }} />
          <div style={{
            position: "absolute", bottom: 0, left: "16%", right: "16%", height: "70%",
            background: "radial-gradient(ellipse at 50% 100%, #020101 0%, #000 100%)",
            borderRadius: "50% 50% 0 0 / 40% 40% 0 0",
          }} />
        </div>
      </div>

      {/* ═══ Layer z-100: Wooden boards ═══ */}
      <div
        ref={boardsRef}
        className="absolute inset-0"
        style={{ zIndex: 100, pointerEvents: boardsBlocking ? "auto" : "none" }}
      >
        {[...Array(BOARD_COUNT)].map((_, i) => {
          const topPct = (BOARD_COUNT - 1 - i) * boardH;
          const wPct = 68 + i * 3.2;
          const hueShift = i * 2;
          return (
            <div key={i} data-board={i} style={{ position: "absolute", top: `${topPct}vh`, left: "50%", transform: "translateX(-50%)", width: `${wPct}%`, height: `${boardH}vh`, overflow: "visible" }}>
              {/* Top half */}
              <div data-board={i} data-half="top" style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "50%",
                background: `repeating-linear-gradient(${1 + i * 0.4}deg, transparent, transparent 6px, rgba(0,0,0,0.06) 6px, rgba(0,0,0,0.06) 7px), linear-gradient(180deg, hsl(${38 + hueShift}, 58%, 32%) 0%, hsl(${36 + hueShift}, 52%, 28%) 50%, hsl(${34 + hueShift}, 55%, 30%) 100%)`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.4)",
                borderRadius: "2px 2px 0 0", transformOrigin: "center bottom",
              }}>
                <div style={{ position: "absolute", left: "6%", bottom: "30%", width: "3px", height: "3px", borderRadius: "50%", background: "radial-gradient(circle, #2a1a08, #4a3018)" }} />
                <div style={{ position: "absolute", right: "6%", bottom: "30%", width: "3px", height: "3px", borderRadius: "50%", background: "radial-gradient(circle, #2a1a08, #4a3018)" }} />
              </div>
              {/* Crack line */}
              <div data-board={i} data-crack style={{
                position: "absolute", top: "50%", left: 0, right: 0, height: "2px",
                background: "rgba(0,0,0,0.8)", opacity: 0, zIndex: 2, transform: "translateY(-1px)",
                boxShadow: "0 0 6px rgba(0,0,0,0.6)",
              }} />
              {/* Bottom half */}
              <div data-board={i} data-half="bottom" style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
                background: `repeating-linear-gradient(${1 + i * 0.4}deg, transparent, transparent 6px, rgba(0,0,0,0.06) 6px, rgba(0,0,0,0.06) 7px), linear-gradient(180deg, hsl(${34 + hueShift}, 55%, 30%) 0%, hsl(${32 + hueShift}, 50%, 26%) 50%, hsl(${30 + hueShift}, 48%, 24%) 100%)`,
                boxShadow: "inset 0 1px 0 rgba(0,0,0,0.3), inset 0 -1px 0 rgba(255,255,255,0.04), 0 2px 6px rgba(0,0,0,0.5)",
                borderRadius: "0 0 2px 2px", transformOrigin: "center top",
              }}>
                <div style={{ position: "absolute", left: "6%", top: "30%", width: "3px", height: "3px", borderRadius: "50%", background: "radial-gradient(circle, #2a1a08, #4a3018)" }} />
                <div style={{ position: "absolute", right: "6%", top: "30%", width: "3px", height: "3px", borderRadius: "50%", background: "radial-gradient(circle, #2a1a08, #4a3018)" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ Layer z-110: Enter button + warning (ALWAYS above everything) ═══ */}
      <div className="absolute inset-0" style={{ zIndex: 110, pointerEvents: "none" }}>

        {/* Hanging light + warning sign */}
        <div ref={warningRef} style={{
          position: "absolute", right: "15%", top: "8%", opacity: 0,
          display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none",
        }}>
          <div style={{ width: "12px", height: "6px", background: "linear-gradient(180deg, #555, #333)", borderRadius: "2px 2px 0 0", boxShadow: "0 0 8px rgba(200,180,120,0.15)" }} />
          <div style={{ width: "1.5px", height: "40px", background: "linear-gradient(180deg, #666, #888, #666)" }} />
          <div style={{
            width: "14px", height: "14px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,230,150,0.9) 0%, rgba(255,200,80,0.4) 40%, transparent 70%)",
            boxShadow: "0 0 20px rgba(255,210,100,0.3), 0 0 50px rgba(255,200,80,0.12)", marginBottom: "4px",
          }} />
          <div style={{ width: "1px", height: "14px", background: "#555" }} />
          <div style={{
            width: "56px", height: "48px",
            background: "linear-gradient(140deg, #D4A017, #B8860B)",
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "5px",
            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
            animation: "sway 3s ease-in-out infinite", transformOrigin: "top center",
          }}>
            <span style={{ fontFamily: "'Centrion', var(--font-display), sans-serif", fontSize: "18px", fontWeight: 900, color: "#1a0f00", lineHeight: 1 }}>!</span>
          </div>
          <p style={{ fontFamily: "'Centrion', var(--font-display), sans-serif", fontSize: "8px", letterSpacing: "0.3em", color: "rgba(212,160,23,0.45)", textAlign: "center", marginTop: "5px", textTransform: "uppercase" }}>CAUTION</p>
        </div>

        {/* Enter button — pointer-events:auto so it's clickable */}
        {phase === "cave" && (
          <button
            ref={enterBtnRef}
            onClick={handleEnter}
            style={{
              position: "absolute", left: "50%", top: "55%", transform: "translate(-50%, -50%)",
              opacity: 0, background: "transparent",
              border: "1.5px solid rgba(232,228,220,0.35)", borderRadius: "3px",
              padding: "14px 52px", cursor: "pointer", pointerEvents: "auto",
              fontFamily: "'Centrion', var(--font-display), sans-serif",
              fontSize: "13px", fontWeight: 700, letterSpacing: "0.45em",
              color: DUSTY_WHITE, textTransform: "uppercase", transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = DUSTY_WHITE;
              e.currentTarget.style.boxShadow = "0 0 22px rgba(232,228,220,0.25), inset 0 0 18px rgba(232,228,220,0.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(232,228,220,0.35)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            ENTER
          </button>
        )}

        {/* Progress (during loading) */}
        {phase === "loading" && (
          <span style={{
            position: "absolute", bottom: "3%", left: "50%", transform: "translateX(-50%)",
            fontFamily: "'Centrion', var(--font-geist-mono), monospace",
            fontSize: "10px", letterSpacing: "0.3em", color: "rgba(232,228,220,0.2)",
          }}>
            {String(progress).padStart(3, "0")}
          </span>
        )}
      </div>

      {/* ═══ Layer z-85: Tunnel arches ═══ */}
      <div ref={tunnelRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0, transformOrigin: "50% 58%", zIndex: 85 }}>
        {[...Array(9)].map((_, i) => (
          <div key={i} ref={(el) => { if (el) archRefs.current[i] = el; }} style={{
            position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: `${86 - i * 8}%`, height: `${92 - i * 8}%`,
            border: "1.5px solid rgba(232,228,220,0.02)",
            borderRadius: "50% 50% 0 0 / 32% 32% 0 0",
          }} />
        ))}
        <div ref={lightOverlayRef} style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 62%, rgba(232,218,190,0.1) 0%, rgba(180,150,100,0.04) 40%, transparent 75%)",
          opacity: 0,
        }} />
      </div>

      {/* ═══ Layer z-120: Words ═══ */}
      <div ref={wordLayerRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 120 }} />

      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(1.5deg); }
          75% { transform: rotate(-1.5deg); }
        }
      `}</style>
    </div>
  );
}
