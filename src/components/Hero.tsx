"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const HeroScene3D = dynamic(() => import("@/components/HeroScene3D"), {
  ssr: false,
  loading: () => null,
});

/* ============================================================
   HERO — THE CYBERPUNK GATE
   
   Pure movement transitions. No opacity fades.
   Gate doors slide apart. Title slides up. Camera pushes through.
   ============================================================ */

const TITLE_LETTERS = "CSAU".split("");

function FloatingParticles() {
  return (
    <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            top: `${6 + ((i * 6.7) % 88)}%`,
            left: `${2 + ((i * 9.3) % 96)}%`,
            width: `${1 + (i % 3)}px`,
            height: `${1 + (i % 3)}px`,
            background:
              i % 3 === 0 ? "#00f0ff" : i % 3 === 1 ? "#ff00aa" : "#39ff14",
            boxShadow: `0 0 ${4 + (i % 4) * 2}px currentColor`,
            animation: `float-particle ${2.5 + (i % 4) * 0.8}s ease-in-out ${i * 0.25}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  const gateLeftRef = useRef<HTMLDivElement>(null);
  const gateRightRef = useRef<HTMLDivElement>(null);
  const gateFrameRef = useRef<HTMLDivElement>(null);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        /* ═══ ENTRANCE — slide up from below, no opacity ═══ */
        const entranceTl = gsap.timeline({ delay: 0.6 });

        const letters = titleRef.current?.querySelectorAll(".hero-letter");
        if (letters?.length) {
          gsap.set(letters, { y: 100, scale: 1.6 });
          entranceTl.to(letters, {
            y: 0,
            scale: 1,
            duration: 1,
            ease: "power4.out",
            stagger: 0.1,
          });
        }

        entranceTl.fromTo(subtitleRef.current,
          { y: 30, letterSpacing: "1.2em" },
          { y: 0, letterSpacing: "0.3em", duration: 1, ease: "power3.out" },
          "-=0.5"
        );

        entranceTl.fromTo(taglineRef.current,
          { y: 20 },
          { y: 0, duration: 0.7, ease: "power2.out" },
          "-=0.4"
        );

        entranceTl.fromTo(scrollHintRef.current,
          { y: 10 },
          { y: 0, duration: 0.5, ease: "power2.out" },
          "-=0.1"
        );

        /* ═══ SCROLL-DRIVEN — pure movement, no opacity ═══ */
        const gateTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
            onUpdate: (self) => setScrollProgress(self.progress),
          },
        });

        /* Gate doors slide apart (0 → 0.55) */
        gateTl.to(gateLeftRef.current,
          { x: "-120%", rotateY: -30, duration: 0.55, ease: "power2.inOut" }, 0);
        gateTl.to(gateRightRef.current,
          { x: "120%", rotateY: 30, duration: 0.55, ease: "power2.inOut" }, 0);

        /* Gate frame scales up and exits top (0.4 → 0.6) */
        gateTl.to(gateFrameRef.current,
          { scale: 1.15, y: -50, duration: 0.2, ease: "power2.in" }, 0.4);

        /* Glow expands (0 → 0.5) */
        gateTl.to(glowRef.current,
          { scale: 6, duration: 0.5, ease: "power2.in" }, 0);

        /* Title slides up and out (0.05 → 0.45) */
        const letters2 = titleRef.current?.querySelectorAll(".hero-letter");
        if (letters2?.length) {
          gateTl.to(letters2, {
            y: -150,
            scale: 0.7,
            duration: 0.4,
            stagger: 0.02,
            ease: "power2.in",
          }, 0.05);
        }

        /* Subtitle + tagline slide up and out */
        gateTl.to(subtitleRef.current,
          { y: -80, duration: 0.35, ease: "power2.in" }, 0.08);
        gateTl.to(taglineRef.current,
          { y: -60, duration: 0.3, ease: "power2.in" }, 0.1);
        gateTl.to(scrollHintRef.current,
          { y: -40, duration: 0.15, ease: "power2.in" }, 0.05);

        /* 3D scene scales up + pushes through (0.4 → 0.7) */
        gateTl.to(canvasRef.current,
          { scale: 1.5, y: -200, duration: 0.3, ease: "power2.in" }, 0.4);

        /* Whole section pushes up (0.6 → 0.85) */
        gateTl.to(sectionRef.current,
          { y: "-15%", duration: 0.25, ease: "power2.in" }, 0.6);

      }, sectionRef);

      return () => ctx.revert();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full h-full bg-cyber-grid overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a12] via-[#060610] to-[#090714] z-0" />

      {/* 3D */}
      <div ref={canvasRef} className="absolute inset-0 z-[1]" style={{ opacity: 0.65 }}>
        <Suspense fallback={null}>
          <HeroScene3D scrollProgress={scrollProgress} />
        </Suspense>
      </div>

      {/* Glow */}
      <div ref={glowRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full z-[2]"
        style={{ background: "radial-gradient(circle, rgba(0,240,255,0.08) 0%, transparent 70%)" }}
      />

      <FloatingParticles />

      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
        <div className="absolute left-0 right-0 h-[1px] opacity-15"
          style={{ background: "linear-gradient(90deg, transparent, #00f0ff, transparent)", animation: "scanline 5s linear infinite" }}
        />
      </div>

      {/* ═══ THE GATE ═══ */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div ref={gateFrameRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(82vw,620px)] h-[min(78svh,540px)] gate-frame rounded-t-[130px]"
        >
          {/* Corners */}
          <div className="absolute -top-1 -left-1 w-7 h-7 border-t-2 border-l-2 border-cyan/50 rounded-tl-lg" />
          <div className="absolute -top-1 -right-1 w-7 h-7 border-t-2 border-r-2 border-cyan/50 rounded-tr-lg" />
          <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-2 border-l-2 border-cyan/50 rounded-bl-lg" />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-2 border-r-2 border-cyan/50 rounded-br-lg" />

          {/* Left door */}
          <div ref={gateLeftRef}
            className="absolute top-0 left-0 w-1/2 h-full overflow-hidden will-change-transform"
            style={{ transformOrigin: "left center" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a12] to-[#0d0d1a]" />
            <div className="absolute inset-0 opacity-30">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="absolute left-0 right-0 border-b border-cyan/10" style={{ top: `${12.5 * (i + 1)}%` }} />
              ))}
              {[...Array(4)].map((_, i) => (
                <div key={`v${i}`} className="absolute top-0 bottom-0 border-r border-cyan/8" style={{ left: `${25 * (i + 1)}%` }} />
              ))}
            </div>
            <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-cyan/40 via-cyan/20 to-cyan/40 shadow-[0_0_15px_rgba(0,240,255,0.3)]" />
          </div>

          {/* Right door */}
          <div ref={gateRightRef}
            className="absolute top-0 right-0 w-1/2 h-full overflow-hidden will-change-transform"
            style={{ transformOrigin: "right center" }}
          >
            <div className="absolute inset-0 bg-gradient-to-l from-[#0a0a12] to-[#0d0d1a]" />
            <div className="absolute inset-0 opacity-30">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="absolute left-0 right-0 border-b border-cyan/10" style={{ top: `${12.5 * (i + 1)}%` }} />
              ))}
              {[...Array(4)].map((_, i) => (
                <div key={`v${i}`} className="absolute top-0 bottom-0 border-l border-cyan/8" style={{ right: `${25 * (i + 1)}%` }} />
              ))}
            </div>
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-cyan/40 via-cyan/20 to-cyan/40 shadow-[0_0_15px_rgba(0,240,255,0.3)]" />
          </div>

          {/* Top arch */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-gradient-to-r from-transparent via-cyan/25 to-transparent rounded-full shadow-[0_0_25px_rgba(0,240,255,0.2)]" />
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 pointer-events-none">
        <div className="text-center" style={{ perspective: "800px" }}>
          <h1 ref={titleRef}
            className="text-[7rem] sm:text-[9.5rem] md:text-[12rem] font-bold tracking-tighter leading-none"
            style={{ fontFamily: "'Kenfolg', 'Centrion', var(--font-space-grotesk), sans-serif" }}
          >
            {TITLE_LETTERS.map((letter, i) => (
              <span key={i} className="hero-letter inline-block glow-cyan"
                style={{ willChange: "transform" }}
              >{letter}</span>
            ))}
          </h1>
        </div>

        <div className="text-center mt-3">
          <p ref={subtitleRef}
            className="text-xs sm:text-sm md:text-base tracking-[0.3em] uppercase text-cyan/40"
            style={{ fontFamily: "var(--font-creme), 'Creme', serif" }}
          >Computer Society of Anna University</p>
        </div>

        <div ref={taglineRef} className="text-center mt-6 max-w-md mx-auto">
          <p className="text-foreground/25 text-xs sm:text-sm leading-relaxed" style={{ fontFamily: "var(--font-creme), 'Creme', serif" }}>
            Where innovation meets excellence. Welcome to the digital realm.
          </p>
        </div>

        <div ref={scrollHintRef} className="mt-14 flex flex-col items-center gap-2">
          <span className="text-[9px] tracking-[0.5em] text-cyan/25 uppercase font-[family-name:var(--font-geist-mono)]">
            Scroll to Enter
          </span>
          <div className="relative w-4 h-7 border border-cyan/15 rounded-full flex justify-center pt-1.5">
            <div className="w-[3px] h-[6px] bg-cyan/30 rounded-full" style={{ animation: "scroll-dot 1.8s ease-in-out infinite" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
