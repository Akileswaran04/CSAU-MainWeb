"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import clsx from "clsx";
import { events } from "@/data/events";

/* ============================================================================
   THE ARCHIVE — mission logs. Each entry opens its own /events/[slug] page.
   ========================================================================== */

const categories = ["All", "Workshop", "Hackathon", "Bootcamp", "Competition"] as const;

function EventCard({
  event,
  index,
}: {
  event: (typeof events)[number];
  index: number;
}) {
  const categoryColor: Record<string, string> = {
    Workshop: "bg-cyan/20 text-cyan",
    Hackathon: "bg-magenta/20 text-magenta",
    Bootcamp: "bg-cyan/20 text-cyan",
    Competition: "bg-magenta/20 text-magenta",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link
        href={`/events/${event.slug}`}
        data-cursor="VIEW"
        className="holo-card rounded-xl p-6 group block cursor-pointer"
      >
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-[family-name:var(--font-geist-mono)] text-cyan/70">
            {event.year} · ARCHIVE / {event.entryNo}
          </span>
          <span
            className={clsx(
              "text-xs px-2 py-0.5 rounded-full",
              categoryColor[event.category]
            )}
          >
            {event.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] mb-2 group-hover:text-cyan transition-colors">
          {event.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-foreground/50 leading-relaxed group-hover:text-foreground/70 transition-colors">
          {event.description}
        </p>

        {/* Terminal-style bottom bar */}
        <div className="mt-4 flex items-center gap-2 text-xs text-foreground/30 font-[family-name:var(--font-geist-mono)]">
          <span className="text-cyan/50">&gt;</span>
          <span className="group-hover:text-cyan/70 transition-colors">Open Entry</span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Archive() {
  const [activeCategory, setActiveCategory] =
    useState<(typeof categories)[number]>("All");

  const filtered =
    activeCategory === "All"
      ? events
      : events.filter((e) => e.category === activeCategory);

  return (
    <section id="archive" className="relative min-h-[100svh] flex items-center overflow-hidden py-20 sm:py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-lines opacity-20" />
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-cyan/5 rounded-full blur-3xl" />

      <div className="stage-16x9 relative z-10 px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-cyan text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">
            04
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-[family-name:var(--font-display)]">
            The Archive
          </h2>
          <p className="mt-4 text-foreground/50 max-w-xl mx-auto">
            Mission logs from our past events — workshops, hackathons, bootcamps, and competitions.
          </p>
          <div className="section-divider mt-6" />
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
              className={clsx(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer",
                activeCategory === cat
                  ? "bg-cyan/20 text-cyan border border-cyan/40"
                  : "text-foreground/50 border border-foreground/10 hover:border-foreground/30 hover:text-foreground/70"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Event Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((event, i) => (
              <EventCard key={event.slug} event={event} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {/* Full archive link */}
        <div className="mt-12 text-center">
          <Link
            href="/events"
            data-cursor="ENTER"
            className="neon-underline text-sm tracking-[0.25em] uppercase text-foreground/40 hover:text-cyan transition-colors font-[family-name:var(--font-geist-mono)]"
          >
            Enter the full archive →
          </Link>
        </div>
      </div>
    </section>
  );
}
