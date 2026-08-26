"use client";

import { useState, useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import clsx from "clsx";

const milestones = [
  { day: 1, label: "Getting Started", description: "Set up your environment, pick a language, write your first line of code." },
  { day: 10, label: "First Steps", description: "Variables, loops, and conditionals. You're speaking the machine's language." },
  { day: 25, label: "Building Momentum", description: "Functions, data structures, and solving your first real problems." },
  { day: 50, label: "Halfway Hero", description: "APIs, databases, and building complete mini-projects." },
  { day: 75, label: "Advanced Terrain", description: "Algorithms, system design, and open-source contributions." },
  { day: 100, label: "Digital Realm Master", description: "You've completed the journey. A new developer is born." },
];

const stats = [
  { label: "Days Completed", value: "72" },
  { label: "Active Participants", value: "120+" },
  { label: "Lines of Code", value: "500K+" },
];

function DayNode({ day, isActive, onClick }: { day: number; isActive: boolean; onClick: () => void }) {
  const isMilestone = milestones.some((m) => m.day === day);
  const completed = day <= 72;

  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative rounded-full transition-all duration-300 cursor-pointer",
        isMilestone ? "w-8 h-8 z-10" : "w-4 h-4",
        completed
          ? isMilestone
            ? "bg-magenta shadow-[0_0_15px_rgba(215,124,203,0.6)]"
            : "bg-cyan shadow-[0_0_8px_rgba(84,217,232,0.4)]"
          : "bg-foreground/10 hover:bg-foreground/20",
        isActive && "ring-2 ring-cyan/60 ring-offset-2 ring-offset-[#090714]"
      )}
      title={`Day ${day}`}
      aria-label={`Day ${day}`}
    />
  );
}

export default function Journey() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const selectedMilestone = milestones.find((m) => m.day === selectedDay);

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const statsBarRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const nodesContainerRef = useRef<HTMLDivElement>(null);
  const milestoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.7, ease: "power2.out",
        scrollTrigger: { trigger: headerRef.current, start: "top 85%", toggleActions: "play none none none" },
      });
      gsap.fromTo(progressBarRef.current, { scaleX: 0 }, {
        scaleX: 1, duration: 1.2, ease: "power2.out",
        scrollTrigger: { trigger: progressBarRef.current, start: "top 85%", toggleActions: "play none none none" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Animate milestone card on selection
  useEffect(() => {
    if (selectedMilestone && milestoneRef.current) {
      gsap.fromTo(
        milestoneRef.current,
        { opacity: 0, y: 15, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.5)" }
      );
    }
  }, [selectedMilestone]);

  return (
    <section ref={sectionRef} id="journey" className="relative min-h-[100svh] flex items-center overflow-hidden py-20 sm:py-24 bg-cyber-grid">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-lines opacity-20" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-neon-yellow/2 rounded-full blur-[60px]" />

      <div className="stage-16x9 relative z-10 px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-16 opacity-0">
          <p className="text-cyan text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">
            05
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold" style={{ fontFamily: "'Centrion', var(--font-space-grotesk)" }}>
            <span className="glow-cyan">The Journey</span>
          </h2>
          <p className="mt-4 text-foreground/50 max-w-xl mx-auto">
            100 Days of Code — track your progress through the digital skill tree.
          </p>
          <div className="cyber-divider mt-6" />
        </div>

        {/* Stats Bar */}
        <div ref={statsBarRef} className="flex justify-center gap-8 sm:gap-16 mb-16 opacity-0">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-cyan font-[family-name:var(--font-space-grotesk)]">
                {stat.value}
              </div>
              <div className="text-xs text-foreground/40 mt-1 tracking-wider uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Timeline */}
        <div className="mb-10">
          {/* Progress bar */}
          <div className="relative mb-8">
            <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
              <div
                ref={progressBarRef}
                className="h-full bg-gradient-to-r from-cyan to-magenta rounded-full origin-left"
                style={{ transform: "scaleX(0)" }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-foreground/30 font-[family-name:var(--font-geist-mono)]">
              <span>Day 01</span>
              <span>Day 100</span>
            </div>
          </div>

          {/* Day nodes */}
          <div ref={nodesContainerRef} className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {Array.from({ length: 100 }, (_, i) => i + 1).map((day) => (
              <DayNode
                key={day}
                day={day}
                isActive={selectedDay === day}
                onClick={() => setSelectedDay(selectedDay === day ? null : day)}
              />
            ))}
          </div>

          {/* Milestone labels */}
          <div className="flex justify-center gap-4 mt-6 flex-wrap">
            {milestones.map((m) => (
              <button
                key={m.day}
                onClick={() => setSelectedDay(selectedDay === m.day ? null : m.day)}
                className={clsx(
                  "milestone-label text-xs font-[family-name:var(--font-geist-mono)] px-3 py-1 rounded-full transition-all",
                  selectedDay === m.day
                    ? "bg-magenta/20 text-magenta border border-magenta/40"
                    : "text-foreground/40 hover:text-foreground/60 border border-foreground/10"
                )}
              >
                Day {m.day}
              </button>
            ))}
          </div>
        </div>

        {/* Selected milestone detail */}
        {selectedMilestone && (
          <div
            key={selectedMilestone.day}
            ref={milestoneRef}
            className="max-w-lg mx-auto holo-card rounded-xl p-6 text-center border border-magenta/20"
          >
            <div className="text-magenta text-sm font-[family-name:var(--font-geist-mono)] mb-1">
              CHECKPOINT — DAY {selectedMilestone.day}
            </div>
            <h3 className="text-xl font-semibold font-[family-name:var(--font-space-grotesk)] text-foreground/90 mb-2">
              {selectedMilestone.label}
            </h3>
            <p className="text-sm text-foreground/50 leading-relaxed">
              {selectedMilestone.description}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
