"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useParallax } from "@/hooks/useParallax";

/* ============================================================
   HORIZONTAL GALLERY — Award-winning horizontal scroll showcase.
   
   A pinned section that scrolls horizontally as the user
   scrolls vertically, showcasing highlights with parallax
   depth, cinematic transitions, and holographic cards.
   ============================================================ */

const highlights = [
  {
    id: "hacksphere",
    title: "HackSphere 2025",
    category: "HACKATHON",
    description: "48 hours of building, debugging, and pushing boundaries. 200+ teams, one winner.",
    stats: "200+ Teams · 48h · 150+ Projects",
    color: "cyan" as const,
    accent: "#00f0ff",
    number: "01",
  },
  {
    id: "ai-bootcamp",
    title: "AI Foundations",
    category: "BOOTCAMP",
    description: "From neural networks to computer vision — 2 weeks of intensive AI learning.",
    stats: "80+ Students · 14 Days · 30+ Models",
    color: "magenta" as const,
    accent: "#ff00aa",
    number: "02",
  },
  {
    id: "codeclash",
    title: "CodeClash X",
    category: "COMPETITION",
    description: "Annual competitive programming showdown. 300+ coders, 50 problems, 3 hours.",
    stats: "300+ Coders · 50 Problems · 3h Sprint",
    color: "cyan" as const,
    accent: "#00f0ff",
    number: "03",
  },
  {
    id: "cybersec",
    title: "Cybersecurity 101",
    category: "WORKSHOP",
    description: "Ethical hacking, network security, and penetration testing — hands-on.",
    stats: "45+ Hackers · 3 Days · Live CTF",
    color: "magenta" as const,
    accent: "#ff00aa",
    number: "04",
  },
  {
    id: "fullstack",
    title: "Full-Stack Mastery",
    category: "BOOTCAMP",
    description: "12 weeks from HTML basics to deploying full-stack Next.js applications.",
    stats: "60+ Devs · 12 Weeks · 45+ Deployments",
    color: "cyan" as const,
    accent: "#00f0ff",
    number: "05",
  },
  {
    id: "cloud-aws",
    title: "Cloud Computing",
    category: "WORKSHOP",
    description: "AWS infrastructure, serverless computing, and deployment pipelines.",
    stats: "55+ Engineers · 5 Days · 25+ Architectures",
    color: "magenta" as const,
    accent: "#ff00aa",
    number: "06",
  },
];

function GalleryCard({
  item,
  index,
}: {
  item: (typeof highlights)[number];
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    // Card entrance animation within horizontal scroll
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 60, rotateY: -8, scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          rotateY: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "left 90%",
            end: "left 40%",
            horizontal: true,
            scrub: 1,
            containerAnimation: undefined,
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const isCyan = item.color === "cyan";

  return (
    <div
      ref={cardRef}
      className="flex-shrink-0 w-[min(380px,80vw)] group"
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative h-[480px] rounded-2xl overflow-hidden border transition-all duration-500 hover:scale-[1.02]"
        style={{
          borderColor: isCyan ? "rgba(0,240,255,0.15)" : "rgba(255,0,170,0.15)",
          background: `linear-gradient(180deg, rgba(10,10,25,0.9) 0%, rgba(9,7,20,0.95) 100%)`,
        }}
      >
        {/* Top glow bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${item.accent}60, transparent)`,
            boxShadow: `0 0 20px ${item.accent}30`,
          }}
        />

        {/* Number background */}
        <div
          className="absolute top-8 right-8 text-[120px] font-bold leading-none opacity-5 select-none"
          style={{
            fontFamily: "'Kenfolg', 'Centrion', var(--font-space-grotesk)",
            color: item.accent,
          }}
        >
          {item.number}
        </div>

        {/* Content */}
        <div className="relative z-10 p-8 h-full flex flex-col">
          {/* Category badge */}
          <span
            className="inline-flex self-start px-3 py-1 rounded-full text-[10px] tracking-[0.2em] uppercase font-[family-name:var(--font-geist-mono)] mb-6"
            style={{
              background: `${item.accent}15`,
              color: item.accent,
              border: `1px solid ${item.accent}30`,
            }}
          >
            {item.category}
          </span>

          {/* Title */}
          <h3
            className="text-2xl sm:text-3xl font-bold mb-4 transition-colors duration-300"
            style={{
              fontFamily: "'Kenfolg', 'Centrion', var(--font-space-grotesk)",
              color: isCyan ? "#F4F0E8" : "#F4F0E8",
            }}
          >
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-foreground/50 leading-relaxed mb-6 flex-1">
            {item.description}
          </p>

          {/* Stats bar */}
          <div
            className="pt-4 border-t"
            style={{ borderColor: `${item.accent}15` }}
          >
            <p
              className="text-xs font-[family-name:var(--font-geist-mono)] tracking-wider"
              style={{ color: `${item.accent}80` }}
            >
              {item.stats}
            </p>
          </div>

          {/* Decorative corner elements */}
          <div
            className="absolute top-4 left-4 w-6 h-6 border-t border-l rounded-tl-md"
            style={{ borderColor: `${item.accent}25` }}
          />
          <div
            className="absolute bottom-4 right-4 w-6 h-6 border-b border-r rounded-br-md"
            style={{ borderColor: `${item.accent}25` }}
          />
        </div>

        {/* Bottom glow on hover */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(90deg, transparent, ${item.accent}40, transparent)`,
            boxShadow: `0 0 20px ${item.accent}20`,
          }}
        />

        {/* Holographic shimmer */}
        <div className="absolute inset-0 holo-shimmer opacity-30 pointer-events-none" />
      </div>
    </div>
  );
}

/* Background parallax glow */
function GalleryBg() {
  const ref = useParallax<HTMLDivElement>({ speed: -0.3 });
  return (
    <div
      ref={ref}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan/3 rounded-full blur-[120px]"
    />
  );
}

export default function HorizontalGallery() {
  const containerRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollContainerRef.current || !containerRef.current) return;

    const cards = scrollContainerRef.current;
    const totalScroll = cards.scrollWidth - cards.clientWidth;

    const ctx = gsap.context(() => {
      // Header animation
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
        }
      );

      // Horizontal scroll — pin and translate
      const scrollTween = gsap.to(cards, {
        x: -totalScroll,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: () => `+=${totalScroll}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Card reveal animations within the horizontal scroll
      const cardEls = cards.querySelectorAll("[data-gallery-card]");
      if (cardEls.length === 0) return;

      // We'll use IntersectionObserver for card reveals since ScrollTrigger
      // horizontal container animations need special handling
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              gsap.fromTo(
                entry.target,
                { opacity: 0, y: 40, rotateY: -5, scale: 0.95 },
                {
                  opacity: 1,
                  y: 0,
                  rotateY: 0,
                  scale: 1,
                  duration: 0.8,
                  ease: "power3.out",
                }
              );
              observer.unobserve(entry.target);
            }
          });
        },
        { root: cards, threshold: 0.3 }
      );

      cardEls.forEach((card) => observer.observe(card));
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      id="gallery"
      className="relative overflow-hidden bg-cyber-grid"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-grid-lines opacity-10" />
      <GalleryBg />

      {/* Section header */}
      <div ref={headerRef} className="text-center pt-20 sm:pt-24 pb-8 opacity-0">
        <p className="text-cyan text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">
          HIGHLIGHTS ARCHIVE
        </p>
        <h2
          className="text-4xl sm:text-5xl md:text-6xl font-bold glow-cyan"
          style={{ fontFamily: "'Kenfolg', 'Centrion', var(--font-space-grotesk)" }}
        >
          Mission Log
        </h2>          <p className="mt-4 text-foreground/50 max-w-xl mx-auto" style={{ fontFamily: "var(--font-creme), 'Creme', serif" }}>
            Scroll horizontally to explore our most impactful events and initiatives.
          </p>
        <div className="cyber-divider mt-6" />
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 px-8 sm:px-16 lg:px-24 pb-16 overflow-visible"
        style={{ width: "max-content" }}
      >
        {highlights.map((item, i) => (
          <div key={item.id} data-gallery-card>
            <GalleryCard item={item} index={i} />
          </div>
        ))}

        {/* End cap */}
        <div className="flex-shrink-0 w-[min(200px,40vw)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-foreground/20 text-sm font-[family-name:var(--font-geist-mono)] tracking-widest">
              END OF ARCHIVE
            </p>
            <p className="text-foreground/10 text-xs mt-2">
              More missions incoming...
            </p>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] text-foreground/25 tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)]">
        <span>← Scroll to explore →</span>
      </div>
    </section>
  );
}
