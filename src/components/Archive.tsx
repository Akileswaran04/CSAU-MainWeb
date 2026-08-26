"use client";

import { useState, useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import clsx from "clsx";

const categories = ["All", "Workshop", "Hackathon", "Bootcamp", "Competition"];

const events = [
  {
    year: "2025",
    category: "Hackathon",
    title: "HackSphere 2025",
    description: "48-hour hackathon with 200+ teams competing to build innovative solutions for real-world problems.",
    pinned: true,
  },
  {
    year: "2025",
    category: "Workshop",
    title: "AI Foundations Bootcamp",
    description: "A 2-week intensive workshop covering neural networks, NLP, and computer vision fundamentals.",
  },
  {
    year: "2024",
    category: "Bootcamp",
    title: "Full-Stack Web Dev",
    description: "12-week bootcamp taking students from HTML basics to deploying full-stack Next.js applications.",
  },
  {
    year: "2024",
    category: "Competition",
    title: "CodeClash X",
    description: "Annual competitive programming showdown — 300+ participants, 50 problems, 3 hours.",
  },
  {
    year: "2024",
    category: "Workshop",
    title: "Cybersecurity 101",
    description: "Hands-on workshop on ethical hacking, network security, and penetration testing.",
  },
  {
    year: "2023",
    category: "Hackathon",
    title: "HackSphere 2024",
    description: "36-hour hackathon focused on sustainability tech, attracting teams from 15+ colleges.",
  },
  {
    year: "2023",
    category: "Workshop",
    title: "Cloud Computing with AWS",
    description: "Introduction to cloud infrastructure, serverless computing, and deployment pipelines.",
  },
  {
    year: "2023",
    category: "Bootcamp",
    title: "Data Science Foundations",
    description: "8-week program covering Python, statistics, pandas, and real-world data analysis projects.",
  },
];

function EventCard({ event }: { event: (typeof events)[number] }) {
  const categoryColor: Record<string, string> = {
    Workshop: "bg-cyan/20 text-cyan",
    Hackathon: "bg-magenta/20 text-magenta",
    Bootcamp: "bg-cyan/20 text-cyan",
    Competition: "bg-magenta/20 text-magenta",
  };

  return (
    <div
      className={clsx(
        "holo-card rounded-xl p-6 group cursor-pointer",
        event.pinned && "ring-1 ring-cyan/30"
      )}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-[family-name:var(--font-geist-mono)] text-cyan/70">
          {event.year}
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
      <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)] mb-2 group-hover:text-cyan transition-colors">
        {event.pinned && (
          <span className="text-cyan mr-1">📌</span>
        )}
        {event.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-foreground/50 leading-relaxed group-hover:text-foreground/70 transition-colors">
        {event.description}
      </p>

      {/* Terminal-style bottom bar */}
      <div className="mt-4 flex items-center gap-2 text-xs text-foreground/30 font-[family-name:var(--font-geist-mono)]">
        <span className="text-cyan/50">&gt;</span>
        <span className="group-hover:text-cyan/70 transition-colors">View Mission Brief</span>
      </div>
    </div>
  );
}

export default function Archive() {
  const [activeCategory, setActiveCategory] = useState("All");
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered =
    activeCategory === "All"
      ? events
      : events.filter((e) => e.category === activeCategory);

  // ScrollTrigger reveal
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );

      // Filter tabs — stagger up
      const tabs = tabsRef.current?.querySelectorAll("button");
      if (tabs) {
        gsap.fromTo(
          tabs,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.05,
            ease: "power2.out",
            scrollTrigger: {
              trigger: tabsRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Cards — stagger wave
      const cards = gridRef.current?.querySelectorAll(".holo-card");
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 30, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.45,
            stagger: 0.06,
            ease: "power2.out",
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Animate cards on filter change
  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll(".holo-card");
    if (cards && cards.length > 0) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.04, ease: "power2.out" }
      );
    }
  }, [activeCategory]);

  return (
    <section ref={sectionRef} id="archive" className="relative min-h-[100svh] flex items-center overflow-hidden py-20 sm:py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-lines opacity-20" />
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-cyan/5 rounded-full blur-3xl" />

      <div className="stage-16x9 relative z-10 px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-12 opacity-0">
          <p className="text-cyan text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">
            04
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-[family-name:var(--font-space-grotesk)]">
            The Archive
          </h2>
          <p className="mt-4 text-foreground/50 max-w-xl mx-auto">
            Mission logs from our past events — workshops, hackathons, bootcamps, and competitions.
          </p>
          <div className="section-divider mt-6" />
        </div>

        {/* Filter Tabs */}
        <div ref={tabsRef} className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
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
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((event) => (
            <EventCard key={event.title} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
