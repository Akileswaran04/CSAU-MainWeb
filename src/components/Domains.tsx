"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useParallax } from "@/hooks/useParallax";
import MagneticCard from "@/components/MagneticCard";

/* ============================================================
   DOMAINS — THE TRAINING GROUNDS
   
   Floating neon platforms, one per domain. Each is a "character
   class" or "guild tent." Clicking zooms the camera in to show
   what that domain does.
   ============================================================ */

const domains = [
  {
    name: "AI / ML",
    subtitle: "The Oracle Guild",
    description: "Artificial Intelligence & Machine Learning — Building intelligent systems that learn, adapt, and predict.",
    icon: "🧠",
    color: "cyan" as const,
    skills: ["Neural Networks", "NLP", "Computer Vision", "Deep Learning"],
  },
  {
    name: "Web Dev",
    subtitle: "The Architect's Workshop",
    description: "Full-stack development — From pixel-perfect frontends to scalable backend architectures.",
    icon: "🌐",
    color: "magenta" as const,
    skills: ["React", "Next.js", "Node.js", "TypeScript"],
  },
  {
    name: "Data Science",
    subtitle: "The Analytarium",
    description: "Data Analytics & Visualization — Turning raw data into actionable insights and predictions.",
    icon: "📊",
    color: "cyan" as const,
    skills: ["Python", "Pandas", "Visualization", "Statistics"],
  },
  {
    name: "Coding & CP",
    subtitle: "The Arena",
    description: "Competitive Programming — Sharpening algorithmic thinking and problem-solving under pressure.",
    icon: "⚡",
    color: "magenta" as const,
    skills: ["Algorithms", "Data Structures", "Problem Solving", "Contests"],
  },
  {
    name: "Cybersecurity",
    subtitle: "The Shadow Guard",
    description: "Ethical Hacking & Security — Protecting the digital frontier from threats.",
    icon: "🔐",
    color: "cyan" as const,
    skills: ["Pen Testing", "Network Security", "Cryptography", "Forensics"],
  },
  {
    name: "Cloud & DevOps",
    subtitle: "The Skyforge",
    description: "Infrastructure & Automation — Scaling systems to millions with reliability.",
    icon: "☁️",
    color: "magenta" as const,
    skills: ["AWS", "Docker", "Kubernetes", "CI/CD"],
  },
  {
    name: "UI / UX",
    subtitle: "The Design Sanctum",
    description: "Design & Experience — Crafting interfaces that delight, inspire, and convert.",
    icon: "🎨",
    color: "cyan" as const,
    skills: ["Figma", "Prototyping", "User Research", "Design Systems"],
  },
  {
    name: "Open Source",
    subtitle: "The Commons",
    description: "Community & Collaboration — Contributing to the global ecosystem of shared knowledge.",
    icon: "💻",
    color: "magenta" as const,
    skills: ["Git", "GitHub", "Documentation", "Community"],
  },
];

function PlatformCard({
  domain,
  isExpanded,
  onToggle,
}: {
  domain: (typeof domains)[number];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const isCyan = domain.color === "cyan";
  const borderClass = isCyan ? "border-cyan/20 hover:border-cyan/50" : "border-magenta/20 hover:border-magenta/50";
  const glowClass = isCyan
    ? "hover:shadow-[0_0_30px_rgba(0,240,255,0.12)]"
    : "hover:shadow-[0_0_30px_rgba(255,0,170,0.12)]";
  const accentClass = isCyan ? "text-cyan" : "text-magenta";
  const bgClass = isCyan ? "bg-cyan/10" : "bg-magenta/10";

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
      ref={cardRef}
      className={`group relative holo-card rounded-xl border ${borderClass} ${glowClass} cursor-pointer transition-all duration-300 overflow-hidden ${isExpanded ? "ring-1 ring-cyan/20" : ""}`}
      onClick={onToggle}
    >
      {/* Floating platform indicator */}
      <div className="absolute top-0 left-0 right-0 h-px">
        <div
          className={`h-full ${isCyan ? "bg-gradient-to-r from-transparent via-cyan/40 to-transparent" : "bg-gradient-to-r from-transparent via-magenta/40 to-transparent"}`}
        />
      </div>

      <div className="p-5">
        {/* Platform header */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl" role="img" aria-label={domain.name}>{domain.icon}</span>
          <div className="flex-1">
            <h3
              className={`text-base font-semibold font-[family-name:var(--font-space-grotesk)] ${accentClass} group-hover:glow-cyan transition-all`}
            >
              {domain.name}
            </h3>
            <p className="text-[10px] tracking-widest text-foreground/30 uppercase font-[family-name:var(--font-geist-mono)]">
              {domain.subtitle}
            </p>
          </div>
          <div className={`w-6 h-6 rounded border ${isCyan ? "border-cyan/20" : "border-magenta/20"} flex items-center justify-center transition-transform duration-300 ${isExpanded ? "rotate-45" : ""}`}>
            <span className={`text-xs ${accentClass}`}>+</span>
          </div>
        </div>

        <p className="text-xs text-foreground/40 leading-relaxed mt-2">
          {domain.description}
        </p>

        {/* Expandable details (zoomed-in view) */}
        <div ref={detailsRef} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
          <div className="pt-4 mt-4 border-t border-foreground/5">
            <p className="text-[10px] tracking-widest text-foreground/30 uppercase font-[family-name:var(--font-geist-mono)] mb-3">
              SKILL TREE
            </p>
            <div className="flex flex-wrap gap-2">
              {domain.skills.map((skill) => (
                <span
                  key={skill}
                  className={`text-[10px] px-2.5 py-1 rounded-full ${bgClass} ${accentClass}/70 border ${isCyan ? "border-cyan/15" : "border-magenta/15"}`}
                >
                  {skill}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-foreground/30 font-[family-name:var(--font-geist-mono)]">
              <span className={accentClass}>▸</span>
              <span className="group-hover:text-foreground/50 transition-colors">Enter training grounds →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px">
        <div
          className={`h-full transition-all duration-500 ${isExpanded ? "w-full" : "w-0 group-hover:w-full"} ${isCyan ? "bg-gradient-to-r from-transparent via-cyan/30 to-transparent" : "bg-gradient-to-r from-transparent via-magenta/30 to-transparent"}`}
        />
      </div>
    </div>
  );
}

/* Background glow with parallax */
function DomainsBg() {
  const ref = useParallax<HTMLDivElement>({ speed: -0.35 });
  return (
    <div
      ref={ref}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-magenta/3 rounded-full blur-[80px]"
    />
  );
}

export default function Domains() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.7, ease: "power2.out",
        scrollTrigger: { trigger: headerRef.current, start: "top 85%", toggleActions: "play none none none" },
      });
      const cards = gridRef.current?.querySelectorAll(".holo-card");
      if (cards) {
        gsap.fromTo(cards, { opacity: 0, y: 25, scale: 0.95 }, {
          opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.07, ease: "power2.out",
          scrollTrigger: { trigger: gridRef.current, start: "top 85%", toggleActions: "play none none none" },
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="domains" className="relative min-h-[100svh] flex items-center overflow-hidden py-20 sm:py-24 bg-cyber-grid">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-lines opacity-20" />
      <DomainsBg />

      <div className="stage-16x9 relative z-10 px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-14 opacity-0">
          <p className="text-magenta text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">
            03 / 05
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold" style={{ fontFamily: "'Kenfolg', 'Centrion', var(--font-space-grotesk)" }}>
            <span className="glow-magenta">The Training Grounds</span>
          </h2>
          <p className="mt-4 text-foreground/50 max-w-xl mx-auto" style={{ fontFamily: "var(--font-creme), 'Creme', serif" }}>
            Choose your domain — each is a guild with its own path, tools, and challenges.
          </p>
          <div className="cyber-divider mt-6" />
        </div>

        {/* Floating Platforms Grid */}
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {domains.map((domain, i) => (
            <div key={domain.name} style={{ animationDelay: `${i * 0.5}s` }} className="animate-float-slow">
              <MagneticCard
                glowColor={domain.color === "cyan" ? "#00f0ff" : "#ff00aa"}
                maxTilt={8}
              >
                <PlatformCard
                  domain={domain}
                  isExpanded={expandedIndex === i}
                  onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
                />
              </MagneticCard>
            </div>
          ))}
        </div>

        {/* Instruction hint */}
        <div className="text-center mt-10">
          <p className="text-[10px] tracking-[0.3em] text-foreground/25 uppercase font-[family-name:var(--font-geist-mono)]">
            Click a platform to inspect its skill tree
          </p>
        </div>
      </div>
    </section>
  );
}
