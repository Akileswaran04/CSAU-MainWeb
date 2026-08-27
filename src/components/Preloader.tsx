"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";

/* ============================================================================
   MINE ENTRANCE PRELOADER
   
   Layer order (bottom → top):
     z-80  tunnel arches
     z-90  cave scene (dark mine behind the boards)
     z-100 wooden planks — FULL SCREEN, sealing the mine entrance
     z-110 Enter button + warning sign + progress (ALWAYS on top, clickable)
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
   Wood plank texture generator
   ========================================================================== */

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function woodGrainStyle(index: number, half: "top" | "bottom"): React.CSSProperties {
  const rng = seededRandom(index * 137 + (half === "top" ? 0 : 71));
  const baseHue = 22 + Math.floor(rng() * 12);
  const baseSat = 38 + Math.floor(rng() * 18);
  const baseLit = 18 + Math.floor(rng() * 10);
  const darkLit = baseLit - 6;
  const ringCount = 3 + Math.floor(rng() * 4);
  const grainAngle = -2 + rng() * 4;

  const grainLayers: string[] = [];
  for (let r = 0; r < ringCount; r++) {
    const offset = 8 + rng() * 84;
    const thickness = 1 + rng() * 2;
    const alpha = 0.04 + rng() * 0.06;
    grainLayers.push(
      `linear-gradient(${grainAngle}deg, transparent ${offset - thickness}%, rgba(0,0,0,${alpha}) ${offset}%, transparent ${offset + thickness}%)`
    );
  }

  const hasKnot = rng() > 0.6;
  const knotX = 15 + Math.floor(rng() * 70);
  const knotY = half === "top" ? 25 + Math.floor(rng() * 50) : 20 + Math.floor(rng() * 55);
  const knotSize = 6 + Math.floor(rng() * 6);
  const knotShadow = `radial-gradient(ellipse ${knotSize}px ${knotSize * 0.7}px at ${knotX}% ${knotY}%, rgba(30,15,5,0.7) 0%, rgba(50,25,10,0.4) 50%, transparent 100%)`;

  const nailCount = Math.floor(rng() * 3) + 1;
  const nails: string[] = [];
  for (let n = 0; n < nailCount; n++) {
    const nx = 4 + Math.floor(rng() * 12);
    const ny = half === "top" ? 50 + Math.floor(rng() * 40) : 10 + Math.floor(rng() * 40);
    const ns = 2 + Math.floor(rng() * 2);
    nails.push(
      `radial-gradient(circle ${ns}px at ${nx}% ${ny}%, rgba(15,8,2,0.9) 0%, rgba(40,25,12,0.3) 60%, transparent 100%)`
    );
  }

  const allLayers: string[] = [
    `linear-gradient(180deg, hsl(${baseHue}, ${baseSat}%, ${baseLit}%) 0%, hsl(${baseHue - 2}, ${baseSat - 4}%, ${darkLit}%) 100%)`,
    ...grainLayers,
  ];

  if (hasKnot) allLayers.push(knotShadow);
  allLayers.push(...nails);

  const edgeTop = half === "top"
    ? "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 12%)"
    : "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 8%)";
  const edgeBot = half === "top"
    ? "linear-gradient(0deg, rgba(0,0,0,0.3) 0%, transparent 15%)"
    : "linear-gradient(0deg, rgba(0,0,0,0.25) 0%, transparent 12%)";

  allLayers.push(edgeTop);
  allLayers.push(edgeBot);

  return {
    background: allLayers.join(", "),
    boxShadow: half === "top"
      ? "inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -2px 0 rgba(0,0,0,0.5)"
      : "inset 0 2px 0 rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.03), 0 3px 8px rgba(0,0,0,0.6)",
  };
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

  const boardH = 100 / BOARD_COUNT; // exact % to fill screen

  /* ---- Break a single board ---- */
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
          setBoardsBlocking(false);
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
      gsap.fromTo(caveRef.current, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1.1, ease: "power2.out" });
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
        tl.to(arch, { borderColor: "rgba(232,228,220,0.22)", boxShadow: "0 0 10px rgba(232,228,220,0.06)", duration: 0.3 }, 0.6 + (ARCH_COUNT - 1 - i) * 0.12);
      }
    });

    tl.to(tunnelRef.current, { scale: 4.5, y: 120, duration: 3, ease: "power2.in" }, 1.2);

    WORDS.forEach((_, i) => {
      const t = 4.5 + i * 3.2;
      tl.call(() => showWord(i), undefined, t);
      tl.call(() => dustWord(i), undefined, t + 1.8);
    });

    tl.to(containerRef.current, { opacity: 0, duration: 0.8, ease: "power2.in" }, WORDS.length * 3.2 + 5.5);
  }, []);

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

  const ARCH_COUNT = 9;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] overflow-hidden" style={{ background: "#000" }}>

      {/* ═══ Layer z-90: Cave — dark mine behind the planks ═══ */}
      <div ref={caveRef} className="absolute inset-0" style={{ opacity: 0, zIndex: 90 }}>
        {/* Deep cave walls */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 80% 70% at 50% 55%, #0c0908 0%, #060404 40%, #000 75%)",
        }} />
        {/* Rocky texture layers */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 10% 15%, rgba(45,38,30,0.25) 0%, transparent 30%), radial-gradient(circle at 85% 20%, rgba(55,42,32,0.15) 0%, transparent 25%), radial-gradient(circle at 20% 80%, rgba(40,32,26,0.2) 0%, transparent 22%), radial-gradient(circle at 80% 75%, rgba(50,38,28,0.18) 0%, transparent 20%)",
        }} />
        {/* Deep darkness in center */}
        <div style={{
          position: "absolute", top: "30%", left: "25%", right: "25%", bottom: "10%",
          background: "radial-gradient(ellipse at 50% 50%, #010101 0%, transparent 70%)",
        }} />
        {/* Damp wall edges */}
        <div style={{
          position: "absolute", inset: 0,
          boxShadow: "inset 0 0 120px 40px rgba(0,0,0,0.8), inset 0 0 60px 20px rgba(0,0,0,0.5)",
        }} />
      </div>

      {/* ═══ Layer z-100: Wooden planks — FULL SCREEN mine seal ═══ */}
      <div
        ref={boardsRef}
        className="absolute inset-0"
        style={{ zIndex: 100, pointerEvents: boardsBlocking ? "auto" : "none" }}
      >
        {[...Array(BOARD_COUNT)].map((_, i) => {
          const topPct = i * boardH;
          const woodStyle = woodGrainStyle(i, "top");
          const woodStyleBot = woodGrainStyle(i, "bottom");
          return (
            <div key={i} data-board={i} style={{
              position: "absolute",
              top: `${topPct}%`,
              left: 0,
              right: 0,
              height: `${boardH}%`,
              overflow: "visible",
            }}>
              {/* Top half of plank */}
              <div data-board={i} data-half="top" style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "50%",
                ...woodStyle,
                borderRadius: "0", transformOrigin: "center bottom",
              }}>
                {/* Saw marks */}
                <div style={{
                  position: "absolute", top: "35%", left: "3%", right: "3%", height: "1px",
                  background: `linear-gradient(90deg, transparent, rgba(0,0,0,0.12) ${20 + i * 5}%, rgba(0,0,0,0.08) ${50 + i * 3}%, transparent)`,
                  opacity: 0.5,
                }} />
                <div style={{
                  position: "absolute", top: "65%", left: "5%", right: "5%", height: "1px",
                  background: `linear-gradient(90deg, transparent, rgba(0,0,0,0.08) ${30 + i * 4}%, transparent)`,
                  opacity: 0.4,
                }} />
              </div>
              {/* Crack line */}
              <div data-board={i} data-crack style={{
                position: "absolute", top: "50%", left: 0, right: 0, height: "2px",
                background: "rgba(0,0,0,0.8)", opacity: 0, zIndex: 2, transform: "translateY(-1px)",
                boxShadow: "0 0 6px rgba(0,0,0,0.6)",
              }} />
              {/* Bottom half of plank */}
              <div data-board={i} data-half="bottom" style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
                ...woodStyleBot,
                borderRadius: "0", transformOrigin: "center top",
              }}>
                <div style={{
                  position: "absolute", top: "30%", left: "4%", right: "4%", height: "1px",
                  background: `linear-gradient(90deg, transparent, rgba(0,0,0,0.1) ${25 + i * 4}%, rgba(0,0,0,0.06) ${60 + i * 2}%, transparent)`,
                  opacity: 0.4,
                }} />
              </div>
            </div>
          );
        })}
        {/* Nail strip across the middle — horizontal brace */}
        <div style={{
          position: "absolute", top: "48%", left: 0, right: 0, height: "4%",
          background: "linear-gradient(180deg, hsl(20, 30%, 14%) 0%, hsl(22, 35%, 18%) 50%, hsl(18, 28%, 12%) 100%)",
          zIndex: 3,
          boxShadow: "0 2px 8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}>
          {/* Nail heads on the brace */}
          {[8, 20, 35, 50, 65, 80, 92].map((pct) => (
            <div key={pct} style={{
              position: "absolute", left: `${pct}%`, top: "50%", transform: "translate(-50%, -50%)",
              width: "6px", height: "6px", borderRadius: "50%",
              background: "radial-gradient(circle, #555 0%, #333 60%, #222 100%)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
            }} />
          ))}
        </div>
      </div>

      {/* ═══ Layer z-110: Enter + warning (ALWAYS on top, clickable) ═══ */}
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

        {/* Enter button */}
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

        {/* Progress counter */}
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
      <div ref={tunnelRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0, transformOrigin: "50% 100%", zIndex: 85 }}>
        {[...Array(ARCH_COUNT)].map((_, i) => (
          <div key={i} ref={(el) => { if (el) archRefs.current[i] = el; }} style={{
            position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: `${86 - i * 8}%`, height: `${92 - i * 8}%`,
            border: "1.5px solid rgba(232,228,220,0.02)",
            borderRadius: "50% 50% 0 0 / 32% 32% 0 0",
          }} />
        ))}
        <div ref={lightOverlayRef} style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(0deg, rgba(232,218,190,0.12) 0%, rgba(180,150,100,0.05) 30%, transparent 70%)",
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
