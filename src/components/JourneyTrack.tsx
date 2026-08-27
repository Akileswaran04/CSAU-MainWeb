"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { milestones, journeyProgress } from "@/data/journey";

/* ============================================================================
   JOURNEY TRACK — the dedicated /journey page. A vertical futuristic
   landscape: a glowing rail from DAY 01 → DAY 100 with milestone stations.
   ========================================================================== */

const stats = [
  { label: "Days Completed", value: String(journeyProgress.daysCompleted) },
  { label: "Active Participants", value: journeyProgress.participants },
  { label: "Lines of Code", value: journeyProgress.linesOfCode },
];

export default function JourneyTrack() {
  return (
    <div className="px-5 sm:px-8 lg:px-12 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <header className="text-center mb-14">
        <p className="text-cyan text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">
          05 · 100 DAYS OF CODE
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-[family-name:var(--font-display)]">
          The Journey
        </h1>
        <p className="mt-4 text-foreground/50 max-w-xl mx-auto">
          One hundred days. One hundred commits to becoming better. Traverse the
          track checkpoint by checkpoint.
        </p>
        <div className="section-divider mt-6" />
      </header>

      {/* Stats */}
      <div className="flex justify-center gap-8 sm:gap-16 mb-16">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-cyan font-[family-name:var(--font-display)]">
              {s.value}
            </div>
            <div className="text-xs text-foreground/40 mt-1 tracking-wider uppercase">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Vertical track */}
      <ol className="relative pl-10 sm:pl-0">
        {/* the rail */}
        <span
          aria-hidden
          className="absolute left-[11px] sm:left-1/2 sm:-translate-x-px top-2 bottom-2 w-px bg-gradient-to-b from-cyan via-magenta to-[#F0A35B]"
        />
        {milestones.map((m, i) => {
          const reached = m.day <= journeyProgress.daysCompleted;
          const leftSide = i % 2 === 0;
          return (
            <li
              key={m.day}
              className={clsx(
                "relative pb-12 sm:grid sm:grid-cols-2 sm:gap-16 items-center"
              )}
            >
              {/* node */}
              <span
                aria-hidden
                className={clsx(
                  "absolute -left-10 sm:left-1/2 top-1.5 -translate-x-1/2 w-[23px] h-[23px] rounded-full border flex items-center justify-center",
                  reached
                    ? "bg-magenta/20 border-magenta shadow-[0_0_15px_rgba(215,124,203,0.5)]"
                    : "bg-[#090714] border-foreground/20"
                )}
              >
                <span
                  className={clsx(
                    "w-2 h-2 rounded-full",
                    reached ? "bg-magenta" : "bg-foreground/25"
                  )}
                />
              </span>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.05 * (i % 2) }}
                data-cursor="VIEW"
                className={clsx(
                  "holo-card rounded-xl p-6",
                  !leftSide && "sm:col-start-2",
                  leftSide && "sm:col-start-1 sm:text-right"
                )}
              >
                <p
                  className={clsx(
                    "text-[10px] tracking-[0.3em] font-[family-name:var(--font-geist-mono)] mb-2",
                    reached ? "text-magenta" : "text-foreground/30"
                  )}
                >
                  CHECKPOINT — DAY {String(m.day).padStart(3, "0")}
                </p>
                <h2 className="text-xl font-semibold font-[family-name:var(--font-display)] text-foreground/90 mb-2">
                  {m.label}
                </h2>
                <p className="text-sm text-foreground/50 leading-relaxed">
                  {m.description}
                </p>
                <p
                  className={clsx(
                    "mt-3 text-[10px] tracking-[0.25em] uppercase font-[family-name:var(--font-geist-mono)]",
                    reached ? "text-cyan/70" : "text-foreground/25"
                  )}
                >
                  {reached ? "Status / Reached" : `Status / Day ${journeyProgress.daysCompleted} · In transit`}
                </p>
              </motion.div>
            </li>
          );
        })}
      </ol>

      {/* Finale marker */}
      <div className="text-center mt-4">
        <p className="text-xs tracking-[0.35em] uppercase text-foreground/30 font-[family-name:var(--font-geist-mono)]">
          Day 100 · The realm awaits you
        </p>
      </div>
    </div>
  );
}
