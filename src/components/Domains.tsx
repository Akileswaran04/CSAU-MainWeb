"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const domains = [
  {
    name: "AI / ML",
    description: "Artificial Intelligence & Machine Learning — Building intelligent systems that learn and adapt.",
    icon: "🧠",
    color: "cyan" as const,
  },
  {
    name: "Web Dev",
    description: "Full-stack development — From frontend frameworks to backend architectures.",
    icon: "🌐",
    color: "magenta" as const,
  },
  {
    name: "Data Science",
    description: "Data Analytics & Visualization — Turning raw data into actionable insights.",
    icon: "📊",
    color: "cyan" as const,
  },
  {
    name: "Coding & CP",
    description: "Competitive Programming — Sharpening algorithmic thinking and problem-solving.",
    icon: "⚡",
    color: "magenta" as const,
  },
  {
    name: "Cybersecurity",
    description: "Ethical Hacking & Security — Protecting the digital frontier.",
    icon: "🔐",
    color: "cyan" as const,
  },
  {
    name: "Cloud & DevOps",
    description: "Infrastructure & Automation — Scaling systems to millions.",
    icon: "☁️",
    color: "magenta" as const,
  },
  {
    name: "UI / UX",
    description: "Design & Experience — Crafting interfaces that delight and inspire.",
    icon: "🎨",
    color: "cyan" as const,
  },
  {
    name: "Open Source",
    description: "Community & Collaboration — Contributing to the global ecosystem.",
    icon: "💻",
    color: "magenta" as const,
  },
];

function DomainCard({
  domain,
}: {
  domain: (typeof domains)[number];
}) {
  const borderColor = domain.color === "cyan" ? "border-cyan/20 hover:border-cyan/50" : "border-magenta/20 hover:border-magenta/50";
  const glowColor = domain.color === "cyan"
    ? "hover:shadow-[0_0_30px_rgba(84,217,232,0.15)]"
    : "hover:shadow-[0_0_30px_rgba(215,124,203,0.15)]";
  const iconColor = domain.color === "cyan" ? "text-cyan" : "text-magenta";

  return (
    <div
      className={`group holo-card rounded-xl p-6 border ${borderColor} ${glowColor} cursor-pointer`}
    >
      {/* Icon + Name */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl" role="img" aria-label={domain.name}>
          {domain.icon}
        </span>
        <h3
          className={`text-lg font-semibold font-[family-name:var(--font-space-grotesk)] ${iconColor} group-hover:glow-cyan`}
        >
          {domain.name}
        </h3>
      </div>

      {/* Description */}
      <p className="text-sm text-foreground/50 leading-relaxed sm:group-hover:text-foreground/70 transition-colors duration-300">
        {domain.description}
      </p>

      {/* Decorative bottom glow line */}
      <div
        className={`mt-4 h-px w-0 group-hover:w-full transition-all duration-500 ${
          domain.color === "cyan"
            ? "bg-gradient-to-r from-transparent via-cyan/40 to-transparent"
            : "bg-gradient-to-r from-transparent via-magenta/40 to-transparent"
        }`}
      />
    </div>
  );
}

export default function Domains() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header reveal
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

      // Cards — stagger wave from bottom
      const cards = gridRef.current?.querySelectorAll(".holo-card");
      if (cards) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 50, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: {
              each: 0.08,
              from: "start",
            },
            ease: "back.out(1.2)",
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Section divider line draw
      const divider = sectionRef.current?.querySelector(".section-divider");
      if (divider) {
        gsap.fromTo(
          divider,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: divider,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Background glow parallax
      gsap.to(".domains-glow", {
        y: -50,
        scale: 1.1,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="domains" className="relative min-h-[100svh] flex items-center overflow-hidden py-20 sm:py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-lines opacity-30" />
      <div className="domains-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan/3 rounded-full blur-3xl" />

      <div className="stage-16x9 relative z-10 px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-16 opacity-0">
          <p className="text-cyan text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">
            03
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-[family-name:var(--font-space-grotesk)]">
            The Domains
          </h2>
          <p className="mt-4 text-foreground/50 max-w-xl mx-auto">
            Our technical domains — interconnected realms of innovation and expertise.
          </p>
          <div className="section-divider mt-6" />
        </div>

        {/* Grid */}
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {domains.map((domain) => (
            <DomainCard key={domain.name} domain={domain} />
          ))}
        </div>
      </div>
    </section>
  );
}
