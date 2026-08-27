"use client";

import { useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useParallax } from "@/hooks/useParallax";

/* Dynamically import the heavy 3D core scene */
const SpinningCore3D = dynamic(() => import("@/components/SpinningCore3D"), {
  ssr: false,
  loading: () => null,
});

/* ============================================================
   ORIGIN — THE CORE / STARTING VILLAGE
   
   A giant glowing CPU core sits at the center. The "About Us"
   text appears inside a holographic text box like an NPC quest
   terminal in a sci-fi game.
   ============================================================ */

const stats = [
  { label: "Established", value: "2018", icon: "⏱" },
  { label: "Members", value: "500+", icon: "👥" },
  { label: "Events", value: "50+", icon: "🎯" },
  { label: "Domains", value: "10+", icon: "⚡" },
];

const lore = [
  "Born from the corridors of College of Engineering, Guidy — one of India's oldest and most prestigious engineering institutions.",
  "CSAU emerged as a beacon for students passionate about technology and innovation. What started as a small group of curious minds evolved into a thriving community.",
  "Today, CSAU stands as one of the most active technical communities at Anna University, bridging the gap between academic learning and real-world engineering.",
];

/* Background glow with parallax */
function ParallaxBg() {
  const ref = useParallax<HTMLDivElement>({ speed: -0.4 });
  return (
    <div
      ref={ref}
      className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan/4 rounded-full blur-[80px]"
    />
  );
}

export default function Origin() {
  const sectionRef = useRef<HTMLElement>(null);
  const coreContainerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const dataLinesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 3D core container entrance
      gsap.fromTo(coreContainerRef.current, { opacity: 0, scale: 0.5 }, {
        opacity: 1, scale: 1, duration: 1, ease: "back.out(1.4)",
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%", toggleActions: "play none none none" },
      });

      // Terminal slides in
      gsap.fromTo(terminalRef.current, { opacity: 0, x: 60, filter: "blur(6px)" }, {
        opacity: 1, x: 0, filter: "blur(0px)", duration: 0.8, delay: 0.4, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 60%", toggleActions: "play none none none" },
      });

      // Stats cards stagger in
      const statCards = statsRef.current?.querySelectorAll(".stat-card");
      if (statCards) {
        gsap.fromTo(statCards, { opacity: 0, y: 30, scale: 0.9 }, {
          opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.3)",
          scrollTrigger: { trigger: statsRef.current, start: "top 80%", toggleActions: "play none none none" },
        });
      }

      // Data stream lines
      if (dataLinesRef.current) {
        const lines = dataLinesRef.current.querySelectorAll(".data-line");
        gsap.fromTo(lines, { opacity: 0, scaleX: 0 }, {
          opacity: 0.4, scaleX: 1, duration: 0.6, stagger: 0.05, ease: "power2.out",
          scrollTrigger: { trigger: dataLinesRef.current, start: "top 85%", toggleActions: "play none none none" },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="origin" className="relative min-h-[100svh] flex items-center overflow-hidden py-20 sm:py-24 bg-cyber-grid">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-lines opacity-20" />

      {/* Ambient glow — parallax far layer */}
      <ParallaxBg />

      <div className="stage-16x9 relative z-10 px-5 sm:px-8 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-cyan text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">
            02 / 05
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold" style={{ fontFamily: "'Kenfolg', 'Centrion', var(--font-space-grotesk)" }}>
            <span className="glow-cyan">The Core</span>
          </h2>
          <p className="mt-3 text-foreground/40 text-sm tracking-wide" style={{ fontFamily: "var(--font-creme), 'Creme', serif" }}>
            Starting Village — Where every journey begins
          </p>
          <div className="cyber-divider mt-6" />
        </div>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
          {/* Left — CPU Core Visual */}
          <div className="flex flex-col items-center justify-center relative">
            {/* Data stream lines (decorative) */}
            <div ref={dataLinesRef} className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="data-line absolute h-px bg-gradient-to-r from-transparent via-cyan/20 to-transparent"
                  style={{
                    top: `${15 + i * 14}%`,
                    left: "10%",
                    right: "10%",
                    transformOrigin: "left",
                  }}
                />
              ))}
            </div>

            {/* 3D CPU Core */}
            <div ref={coreContainerRef} className="relative w-56 h-56 sm:w-72 sm:h-72 opacity-0">
              <Suspense fallback={null}>
                <SpinningCore3D />
              </Suspense>
            </div>

            {/* Core status text */}
            <div className="mt-6 text-center">
              <p className="text-[10px] tracking-[0.3em] text-cyan/30 uppercase font-[family-name:var(--font-geist-mono)]">
                SYSTEM STATUS: ONLINE
              </p>
              <p className="text-[10px] tracking-[0.2em] text-foreground/20 mt-1 font-[family-name:var(--font-geist-mono)]">
                INITIALIZING REALM v2.0...
              </p>
            </div>
          </div>

          {/* Right — Holographic Terminal (NPC Quest Box) */}
          <div ref={terminalRef} className="opacity-0">
            <div className="relative holo-card rounded-xl p-8 border border-cyan/15 overflow-hidden">
              {/* Terminal header bar */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-cyan/10">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-neon-red/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neon-yellow/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neon-green/60" />
                </div>
                <span className="text-[10px] tracking-[0.3em] text-foreground/30 uppercase font-[family-name:var(--font-geist-mono)]">
                  LORE_TERMINAL // CSAU_ORIGIN
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                  <span className="text-[9px] text-neon-green/60 font-[family-name:var(--font-geist-mono)]">ACTIVE</span>
                </div>
              </div>

              {/* NPC dialogue style */}
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded border border-cyan/30 bg-cyan/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-cyan text-xs font-bold" style={{ fontFamily: "'Kenfolg', 'Centrion'" }}>N</span>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-widest text-cyan/60 uppercase font-[family-name:var(--font-geist-mono)] mb-1">
                      SYSTEM.GUIDE
                    </p>
                    <div className="space-y-3">
                      {lore.map((text, i) => (
                        <p key={i} className="text-sm text-foreground/60 leading-relaxed" style={{ fontFamily: "var(--font-creme), 'Creme', serif" }}>
                          <span className="text-cyan/40 mr-1">&gt;</span>
                          {text}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quest acceptance line */}
              <div className="flex items-center gap-2 text-xs text-foreground/30 font-[family-name:var(--font-geist-mono)]">
                <span className="text-cyan/50">▸</span>
                <span className="text-foreground/40">Press [SCROLL] to continue your journey...</span>
              </div>

              {/* Holographic shimmer overlay */}
              <div className="absolute inset-0 holo-shimmer pointer-events-none rounded-xl" />
            </div>

            {/* Stats row */}
            <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {stats.map((stat) => (
                <div key={stat.label} className="stat-card holo-card rounded-lg p-3 text-center border border-cyan/10">
                  <span className="text-lg">{stat.icon}</span>
                  <div className="text-lg font-bold text-cyan glow-cyan mt-1" style={{ fontFamily: "'Kenfolg', 'Centrion', var(--font-space-grotesk)" }}>
                    {stat.value}
                  </div>
                  <p className="text-[9px] text-foreground/40 tracking-wider uppercase mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
