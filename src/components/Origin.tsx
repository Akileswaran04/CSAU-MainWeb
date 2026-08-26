"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/* ---------- Animated Counter ---------- */
function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current || started) return;
    const el = ref.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          let start = 0;
          const increment = target / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
              el.textContent = String(target) + suffix;
              clearInterval(timer);
            } else {
              el.textContent = String(Math.floor(start)) + suffix;
            }
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, suffix, duration, started]);

  return (
    <span ref={ref} className="font-[family-name:var(--font-space-grotesk)]">
      0{suffix}
    </span>
  );
}

/* ---------- Timeline Step ---------- */
function TimelineStep({ label, index, isLast }: { label: string; index: number; isLast: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.fromTo(
      ref.current,
      { opacity: 0, x: -20 },
      {
        opacity: 1,
        x: 0,
        duration: 0.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  return (
    <div ref={ref} className="flex items-start gap-4 opacity-0">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-cyan shadow-[0_0_10px_rgba(84,217,232,0.6)]" />
        {!isLast && <div className="w-px h-12 bg-cyan/30" />}
      </div>
      <p className="text-foreground/70 text-sm pt-0.5">{label}</p>
    </div>
  );
}

/* ---------- Main Component ---------- */
const stats = [
  { label: "Established", value: 2018, suffix: "" },
  { label: "Members", value: 500, suffix: "+" },
  { label: "Events", value: 50, suffix: "+" },
  { label: "Domains", value: 10, suffix: "+" },
];

const timeline = [
  "CEG Heritage — Anna University's premier engineering college",
  "Student Community — Passionate minds unite around technology",
  "Building Technology — Workshops, hackathons, and projects",
  "Industry Connect — Bridging academia and industry",
  "Shaping Future — Pioneering innovation and leadership",
];

export default function Origin() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const statsContainerRef = useRef<HTMLDivElement>(null);

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

      // Story — slide in from left
      gsap.fromTo(
        storyRef.current,
        { opacity: 0, x: -60 },
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: storyRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );

      // Stats — slide in from right
      gsap.fromTo(
        statsContainerRef.current,
        { opacity: 0, x: 60 },
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: statsContainerRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );

      // Stat cards — stagger in
      const statCards = statsContainerRef.current?.querySelectorAll(".holo-card");
      if (statCards) {
        gsap.fromTo(
          statCards,
          { opacity: 0, y: 30, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger: 0.12,
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: statsContainerRef.current,
              start: "top 75%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Parallax on background blobs
      gsap.to(".origin-magenta-blob", {
        y: -80,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
      gsap.to(".origin-cyan-blob", {
        y: 60,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="origin" className="relative min-h-[100svh] flex items-center overflow-hidden py-20 sm:py-24">
      {/* Background elements */}
      <div className="absolute inset-0 bg-grid-lines opacity-50" />
      <div className="origin-magenta-blob absolute top-0 right-0 w-96 h-96 bg-magenta/5 rounded-full blur-3xl" />
      <div className="origin-cyan-blob absolute bottom-0 left-0 w-96 h-96 bg-cyan/5 rounded-full blur-3xl" />

      <div className="stage-16x9 relative z-10 px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-16 opacity-0">
          <p className="text-cyan text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">
            02
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-[family-name:var(--font-space-grotesk)]">
            The Origin
          </h2>
          <div className="section-divider mt-6" />
        </div>

        {/* Split Layout */}
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left — Story */}
          <div ref={storyRef} className="opacity-0">
            <h3 className="text-2xl sm:text-3xl font-semibold mb-6 text-foreground/90 font-[family-name:var(--font-space-grotesk)]">
              Where it all began
            </h3>
            <div className="space-y-4 text-foreground/60 leading-relaxed">
              <p>
                Born from the corridors of College of Engineering, Guindy — one of
                India&apos;s oldest and most prestigious engineering institutions — CSAU
                emerged as a beacon for students passionate about technology and innovation.
              </p>
              <p>
                What started as a small group of curious minds evolved into a thriving
                community of 500+ members, spanning multiple domains from AI to Cybersecurity,
                all united by the shared belief that technology can shape a better tomorrow.
              </p>
              <p>
                Today, CSAU stands as one of the most active technical communities at Anna
                University, hosting workshops, hackathons, and competitions that bridge the gap
                between academic learning and real-world engineering.
              </p>
            </div>

            {/* Timeline */}
            <div className="mt-10 space-y-0">
              {timeline.map((step, i) => (
                <TimelineStep key={i} label={step} index={i} isLast={i === timeline.length - 1} />
              ))}
            </div>
          </div>

          {/* Right — Stats */}
          <div ref={statsContainerRef} className="grid grid-cols-2 gap-6 opacity-0">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="holo-card rounded-xl p-6 text-center"
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-cyan glow-cyan">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="mt-2 text-sm text-foreground/50 tracking-wider uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
