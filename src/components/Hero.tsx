"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEntered } from "@/hooks/useEntered";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ============================================================
   Hero Section — THE CYBERPUNK GATE (lightweight)
   ============================================================ */
export default function Hero() {
  const ready = useEntered();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ready) return;

    const tl = gsap.timeline({ delay: 0.2 });

    tl.fromTo(titleRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" })
      .fromTo(subtitleRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.4")
      .fromTo(descRef.current, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.3")
      .fromTo(ctaRef.current, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.5)" }, "-=0.2")
      .fromTo(scrollRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8 }, "-=0.1");

    gsap.to(arrowRef.current, { x: 6, duration: 0.7, ease: "power1.inOut", repeat: -1, yoyo: true });

    const scrollLine = scrollRef.current?.querySelector("div");
    if (scrollLine) gsap.to(scrollLine, { y: 8, duration: 0.7, ease: "power1.inOut", repeat: -1, yoyo: true });

    return () => { tl.kill(); };
  }, [ready]);

  return (
    <section
      id="gate"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cyber-grid"
    >
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a12] via-transparent to-[#0a0a12] z-0" />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan/3 rounded-full blur-[60px] z-0" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div>
          <h1
            ref={titleRef}
            className="text-7xl sm:text-8xl md:text-9xl font-bold tracking-tighter text-foreground glow-cyan"
            style={{ fontFamily: "'Centrion', var(--font-space-grotesk), sans-serif" }}
          >
            CSAU
          </h1>
        </div>

        <div>
          <p ref={subtitleRef} className="mt-4 text-sm sm:text-base md:text-lg tracking-[0.3em] uppercase text-cyan/60 font-[family-name:var(--font-geist-mono)]">
            Computer Society of Anna University
          </p>
        </div>

        <div>
          <p ref={descRef} className="mt-6 text-lg sm:text-xl text-foreground/40 max-w-xl mx-auto leading-relaxed">
            Entering the cyberpunk digital realm — where code meets neon.
          </p>
        </div>

        <div ref={ctaRef} className="mt-10">
          <a
            href="#origin"
            className="inline-flex items-center gap-3 px-8 py-4 border border-cyan rounded-lg text-cyan font-medium tracking-wide hover:bg-cyan/10 transition-all duration-300 animate-pulse-cyan"
            style={{ fontFamily: "'Centrion', var(--font-space-grotesk), sans-serif" }}
          >
            <span>ENTER THE REALM</span>
            <span ref={arrowRef} className="text-lg inline-block">→</span>
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div ref={scrollRef} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
        <span className="text-xs tracking-widest text-cyan/30 uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-cyan/50 to-transparent" />
      </div>
    </section>
  );
}
