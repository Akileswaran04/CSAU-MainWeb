"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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

function DayNode({ day, index, isActive, onClick }: { day: number; index: number; isActive: boolean; onClick: () => void }) {
  const isMilestone = milestones.some((m) => m.day === day);
  const completed = day <= 72; // simulated progress

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.01, duration: 0.3 }}
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

  return (
    <section id="journey" className="relative min-h-[100svh] flex items-center overflow-hidden py-20 sm:py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-lines opacity-20" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-magenta/5 rounded-full blur-3xl" />

      <div className="stage-16x9 relative z-10 px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-cyan text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">
            05
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-[family-name:var(--font-space-grotesk)]">
            The Journey
          </h2>
          <p className="mt-4 text-foreground/50 max-w-xl mx-auto">
            100 Days of Code — track your progress through the digital skill tree.
          </p>
          <div className="section-divider mt-6" />
        </motion.div>

        {/* Stats Bar */}
        <div className="flex justify-center gap-8 sm:gap-16 mb-16">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-2xl sm:text-3xl font-bold text-cyan font-[family-name:var(--font-space-grotesk)]">
                {stat.value}
              </div>
              <div className="text-xs text-foreground/40 mt-1 tracking-wider uppercase">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interactive Timeline */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          {/* Progress bar */}
          <div className="relative mb-8">
            <div className="h-1 bg-foreground/10 rounded-full">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "72%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-1 bg-gradient-to-r from-cyan to-magenta rounded-full"
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-foreground/30 font-[family-name:var(--font-geist-mono)]">
              <span>Day 01</span>
              <span>Day 100</span>
            </div>
          </div>

          {/* Day nodes */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {Array.from({ length: 100 }, (_, i) => i + 1).map((day, index) => (
              <DayNode
                key={day}
                day={day}
                index={index}
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
                  "text-xs font-[family-name:var(--font-geist-mono)] px-3 py-1 rounded-full transition-all",
                  selectedDay === m.day
                    ? "bg-magenta/20 text-magenta border border-magenta/40"
                    : "text-foreground/40 hover:text-foreground/60 border border-foreground/10"
                )}
              >
                Day {m.day}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Selected milestone detail */}
        {selectedMilestone && (
          <motion.div
            key={selectedMilestone.day}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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
          </motion.div>
        )}
      </div>
    </section>
  );
}
