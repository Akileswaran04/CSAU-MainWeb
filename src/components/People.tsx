"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useParallax } from "@/hooks/useParallax";
import ScrollTeamGrid from "@/components/ScrollTeamGrid";
import { presidents, heads, deputies, type TeamMember } from "@/data/team";

/* ============================================================
   PEOPLE — THE COMMAND CENTER

   Core team displayed on digital monitor screens in a
   cyberpunk command bridge. Uses ProofOfWork-style scroll
   animations for staggered card reveals.

   Layout:
     Row 3 (3-col) → Presidents (2) + Heads (6) = 8 cards
     Row 4 (4-col) → Deputies (14) = 14 cards
   ============================================================ */

const statusList: TeamMember["status"][] = ["online", "busy", "away"];

function assignStatuses(members: TeamMember[]): TeamMember[] {
  return members.map((m, i) => ({
    ...m,
    status: m.status ?? statusList[i % statusList.length],
  }));
}

/* Background glows with parallax */
function PeopleBg() {
  const ref1 = useParallax<HTMLDivElement>({ speed: -0.4 });
  const ref2 = useParallax<HTMLDivElement>({ speed: -0.25 });
  return (
    <>
      <div ref={ref1} className="absolute top-1/3 right-0 w-80 h-80 bg-neon-green/2 rounded-full blur-[80px]" />
      <div ref={ref2} className="absolute bottom-1/3 left-0 w-80 h-80 bg-magenta/2 rounded-full blur-[70px]" />
    </>
  );
}

export default function People() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="people"
      className="relative min-h-[100svh] flex items-center overflow-hidden py-20 sm:py-24 bg-cyber-grid"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-grid-lines opacity-15" />
      <PeopleBg />

      <div className="stage-16x9 relative z-10 px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-14 opacity-0">
          <p className="text-neon-green text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">
            05 / 05 — COMMAND
          </p>
          <h2
            className="text-4xl sm:text-5xl md:text-6xl font-bold"
            style={{ fontFamily: "'Kenfolg', 'Centrion', var(--font-space-grotesk)" }}
          >
            <span className="glow-cyan">The Command Center</span>
          </h2>
          <p className="mt-4 text-foreground/50 max-w-xl mx-auto" style={{ fontFamily: "var(--font-creme), 'Creme', serif" }}>
            The people behind the system — meet the minds piloting CSAU.
          </p>
          <div className="cyber-divider mt-6" />
        </div>

        {/* ---- Presidents + Heads → 3-col grid ---- */}
        <div className="mb-16">
          <p className="text-[10px] tracking-[0.3em] uppercase text-neon-green/50 font-[family-name:var(--font-geist-mono)] mb-4 text-center">
            ● LEADERSHIP — ROW 03
          </p>
          <ScrollTeamGrid
            items={assignStatuses([...presidents, ...heads])}
            columns={3}
            size="medium"
          />
        </div>

        {/* ---- Deputies → 4-col grid ---- */}
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-neon-green/50 font-[family-name:var(--font-geist-mono)] mb-4 text-center">
            ● DEPUTIES — ROW 04
          </p>
          <ScrollTeamGrid
            items={assignStatuses(deputies)}
            columns={4}
            size="small"
          />
        </div>

        {/* Command bridge status bar */}
        <div className="mt-14 flex justify-center">
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-lg bg-foreground/3 border border-foreground/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span className="text-[10px] tracking-widest text-foreground/30 font-[family-name:var(--font-geist-mono)]">
                CREW STATUS
              </span>
            </div>
            <div className="w-px h-4 bg-foreground/10" />
            <span className="text-[10px] text-neon-green/60 font-[family-name:var(--font-geist-mono)]">
              {presidents.filter((m) => m.status === "online").length + heads.filter((m) => m.status === "online").length + deputies.filter((m) => m.status === "online").length} ONLINE
            </span>
            <span className="text-[10px] text-neon-red/60 font-[family-name:var(--font-geist-mono)]">
              {presidents.filter((m) => m.status === "busy").length + heads.filter((m) => m.status === "busy").length + deputies.filter((m) => m.status === "busy").length} IN SESSION
            </span>
            <span className="text-[10px] text-neon-yellow/60 font-[family-name:var(--font-geist-mono)]">
              {presidents.filter((m) => m.status === "away").length + heads.filter((m) => m.status === "away").length + deputies.filter((m) => m.status === "away").length} AFK
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
