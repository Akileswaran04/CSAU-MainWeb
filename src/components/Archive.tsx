"use client";

import { useState, useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import clsx from "clsx";
import { useParallax } from "@/hooks/useParallax";

/* ============================================================
   ARCHIVE — THE DATA VAULT
   
   A darker, quieter area that looks like a high-tech crystal
   cave or futuristic library. Past projects are displayed as
   glowing "memory drives" or "holograms" floating in the air.
   Users can click them to inspect their stats.
   ============================================================ */

const categories = ["All", "Workshop", "Hackathon", "Bootcamp", "Competition"];

const events = [
  {
    year: "2025",
    category: "Hackathon",
    title: "HackSphere 2025",
    description: "48-hour hackathon with 200+ teams competing to build innovative solutions for real-world problems.",
    stats: { participants: "200+", duration: "48h", projects: "150+", winner: "Team Neon" },
    pinned: true,
  },
  {
    year: "2025",
    category: "Workshop",
    title: "AI Foundations Bootcamp",
    description: "A 2-week intensive workshop covering neural networks, NLP, and computer vision fundamentals.",
    stats: { participants: "80+", duration: "14d", projects: "30+", winner: "—" },
  },
  {
    year: "2024",
    category: "Bootcamp",
    title: "Full-Stack Web Dev",
    description: "12-week bootcamp taking students from HTML basics to deploying full-stack Next.js applications.",
    stats: { participants: "60+", duration: "12w", projects: "45+", winner: "—" },
  },
  {
    year: "2024",
    category: "Competition",
    title: "CodeClash X",
    description: "Annual competitive programming showdown — 300+ participants, 50 problems, 3 hours.",
    stats: { participants: "300+", duration: "3h", projects: "50 problems", winner: "Alpha Coders" },
  },
  {
    year: "2024",
    category: "Workshop",
    title: "Cybersecurity 101",
    description: "Hands-on workshop on ethical hacking, network security, and penetration testing.",
    stats: { participants: "45+", duration: "3d", projects: "20+", winner: "—" },
  },
  {
    year: "2023",
    category: "Hackathon",
    title: "HackSphere 2024",
    description: "36-hour hackathon focused on sustainability tech, attracting teams from 15+ colleges.",
    stats: { participants: "180+", duration: "36h", projects: "120+", winner: "GreenByte" },
  },
  {
    year: "2023",
    category: "Workshop",
    title: "Cloud Computing with AWS",
    description: "Introduction to cloud infrastructure, serverless computing, and deployment pipelines.",
    stats: { participants: "55+", duration: "5d", projects: "25+", winner: "—" },
  },
  {
    year: "2023",
    category: "Bootcamp",
    title: "Data Science Foundations",
    description: "8-week program covering Python, statistics, pandas, and real-world data analysis projects.",
    stats: { participants: "70+", duration: "8w", projects: "35+", winner: "—" },
  },
];

function MemoryDrive({
  event,
  isExpanded,
  onToggle,
}: {
  event: (typeof events)[number];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const driveRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const categoryColor: Record<string, { border: string; bg: string; text: string }> = {
    Workshop: { border: "border-cyan/25", bg: "bg-cyan/10", text: "text-cyan" },
    Hackathon: { border: "border-magenta/25", bg: "bg-magenta/10", text: "text-magenta" },
    Bootcamp: { border: "border-cyan/25", bg: "bg-cyan/10", text: "text-cyan" },
    Competition: { border: "border-magenta/25", bg: "bg-magenta/10", text: "text-magenta" },
  };

  const colors = categoryColor[event.category] || categoryColor.Workshop;

  useEffect(() => {
    if (!detailsRef.current) return;
    if (isExpanded) {
      gsap.fromTo(detailsRef.current, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.4, ease: "power2.out" });
    } else {
      gsap.to(detailsRef.current, { height: 0, opacity: 0, duration: 0.3, ease: "power2.in" });
    }
  }, [isExpanded]);

  return (
    <div
      ref={driveRef}
      className={clsx(
        "group relative holo-card rounded-xl cursor-pointer transition-all duration-300 overflow-hidden",
        event.pinned && "ring-1 ring-cyan/20",
        isExpanded && "ring-1 ring-cyan/30"
      )}
      onClick={onToggle}
    >
      {/* Hologram glow top edge */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan/20 to-transparent" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Memory drive icon */}
            <div className={`w-8 h-8 rounded ${colors.bg} ${colors.border} border flex items-center justify-center`}>
              <svg className={`w-4 h-4 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-[family-name:var(--font-geist-mono)] text-foreground/30">
                {event.year}
              </span>
            </div>
          </div>
          <span className={clsx("text-[10px] px-2 py-0.5 rounded-full", colors.bg, colors.text)}>
            {event.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold font-[family-name:var(--font-space-grotesk)] mb-2 group-hover:text-cyan transition-colors">
          {event.pinned && <span className="text-cyan mr-1">📌</span>}
          {event.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-foreground/40 leading-relaxed group-hover:text-foreground/60 transition-colors">
          {event.description}
        </p>

        {/* Expandable stats panel (inspector) */}
        <div ref={detailsRef} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
          <div className="pt-4 mt-4 border-t border-foreground/5">
            <p className="text-[10px] tracking-widest text-foreground/30 uppercase font-[family-name:var(--font-geist-mono)] mb-3">
              MISSION STATS
            </p>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(event.stats).map(([key, value]) => (
                <div key={key} className="text-center p-2 rounded bg-foreground/3">
                  <div className="text-sm font-bold text-cyan" style={{ fontFamily: "'Kenfolg', 'Centrion'" }}>{value}</div>
                  <div className="text-[9px] text-foreground/30 uppercase tracking-wider mt-0.5">{key}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom indicator */}
        <div className="mt-3 flex items-center gap-2 text-[10px] text-foreground/25 font-[family-name:var(--font-geist-mono)]">
          <span className="text-cyan/40">&gt;</span>
          <span className="group-hover:text-cyan/50 transition-colors">
            {isExpanded ? "Close inspection" : "Inspect memory drive"}
          </span>
        </div>
      </div>

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px">
        <div className={clsx(
          "h-full transition-all duration-500",
          isExpanded ? "w-full" : "w-0 group-hover:w-full",
          "bg-gradient-to-r from-transparent via-cyan/25 to-transparent"
        )} />
      </div>
    </div>
  );
}

/* Crystal formations + ambient glow with parallax */
function ArchiveParallax() {
  const crystalsRef = useParallax<HTMLDivElement>({ speed: -0.5 });
  const glowsRef = useParallax<HTMLDivElement>({ speed: -0.3 });
  return (
    <>
      {/* Crystal formations — far layer */}
      <div ref={crystalsRef} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-[10%] w-1 h-32 bg-gradient-to-b from-cyan/15 to-transparent rotate-12 origin-top" />
        <div className="absolute top-16 left-[12%] w-px h-24 bg-gradient-to-b from-cyan/10 to-transparent -rotate-6 origin-top" />
        <div className="absolute top-24 right-[15%] w-1 h-28 bg-gradient-to-b from-magenta/12 to-transparent -rotate-12 origin-top" />
        <div className="absolute top-20 right-[17%] w-px h-20 bg-gradient-to-b from-magenta/8 to-transparent rotate-8 origin-top" />
      </div>
      {/* Ambient glow — mid layer */}
      <div ref={glowsRef} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-cyan/2 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-magenta/2 rounded-full blur-[70px]" />
      </div>
    </>
  );
}

export default function Archive() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = activeCategory === "All" ? events : events.filter((e) => e.category === activeCategory);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.7, ease: "power2.out",
        scrollTrigger: { trigger: headerRef.current, start: "top 85%", toggleActions: "play none none none" },
      });
      const cards = gridRef.current?.querySelectorAll(".holo-card");
      if (cards) {
        gsap.fromTo(cards, { opacity: 0, y: 20, scale: 0.97 }, {
          opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.05, ease: "power2.out",
          scrollTrigger: { trigger: gridRef.current, start: "top 85%", toggleActions: "play none none none" },
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Re-animate cards on filter change
  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll(".holo-card");
    if (cards && cards.length > 0) {
      gsap.fromTo(cards, { opacity: 0, y: 15, scale: 0.97 }, {
        opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.04, ease: "power2.out",
      });
    }
  }, [activeCategory]);

  return (
    <section ref={sectionRef} id="archive" className="relative min-h-[100svh] flex items-center overflow-hidden py-20 sm:py-24 bg-cyber-grid">
      {/* Crystal cave background */}
      <div className="absolute inset-0 bg-grid-lines opacity-15" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#090714] to-transparent z-0" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#090714] to-transparent z-0" />

      {/* Crystal formations + ambient glow — parallax layers */}
      <ArchiveParallax />

      <div className="stage-16x9 relative z-10 px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-12 opacity-0">
          <p className="text-cyan text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">
            04 / 05
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold" style={{ fontFamily: "'Kenfolg', 'Centrion', var(--font-space-grotesk)" }}>
            <span className="glow-cyan">The Data Vault</span>
          </h2>
          <p className="mt-4 text-foreground/50 max-w-xl mx-auto" style={{ fontFamily: "var(--font-creme), 'Creme', serif" }}>
            Mission logs from our past events — each a memory drive holding stories of creation.
          </p>
          <div className="cyber-divider mt-6" />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setExpandedIndex(null); }}
              className={clsx(
                "px-4 py-2 rounded-full text-xs font-medium transition-all duration-300",
                activeCategory === cat
                  ? "bg-cyan/15 text-cyan border border-cyan/30"
                  : "text-foreground/40 border border-foreground/8 hover:border-foreground/20 hover:text-foreground/60"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Memory Drives Grid */}
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event, i) => (
            <MemoryDrive
              key={event.title}
              event={event}
              isExpanded={expandedIndex === i}
              onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
