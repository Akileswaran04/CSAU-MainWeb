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
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStarted(true);
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
          start += increment;
          if (start >= target) { el.textContent = String(target) + suffix; clearInterval(timer); }
          else el.textContent = String(Math.floor(start)) + suffix;
        }, 16);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, suffix, duration, started]);

  return <span ref={ref} style={{ fontFamily: "'Centrion', var(--font-space-grotesk)" }}>0{suffix}</span>;
}

/* ---------- Timeline Step ---------- */
function TimelineStep({ label, isLast }: { label: string; index: number; isLast: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { opacity: 0, x: -20 }, {
      opacity: 1, x: 0, duration: 0.5, ease: "power2.out",
      scrollTrigger: { trigger: ref.current, start: "top 85%", toggleActions: "play none none none" },
    });
  }, []);
  return (
    <div ref={ref} className="flex items-start gap-4 opacity-0">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-cyan shadow-[0_0_10px_rgba(0,240,255,0.6)]" />
        {!isLast && <div className="w-px h-10 bg-cyan/20" />}
      </div>
      <p className="text-foreground/60 text-sm pt-0.5">{label}</p>
    </div>
  );
}

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
      gsap.fromTo(headerRef.current, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.7, ease: "power2.out",
        scrollTrigger: { trigger: headerRef.current, start: "top 85%", toggleActions: "play none none none" },
      });
      gsap.fromTo(storyRef.current, { opacity: 0, x: -30 }, {
        opacity: 1, x: 0, duration: 0.7, ease: "power2.out",
        scrollTrigger: { trigger: storyRef.current, start: "top 85%", toggleActions: "play none none none" },
      });
      gsap.fromTo(statsContainerRef.current, { opacity: 0, x: 30 }, {
        opacity: 1, x: 0, duration: 0.7, ease: "power2.out",
        scrollTrigger: { trigger: statsContainerRef.current, start: "top 85%", toggleActions: "play none none none" },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="origin" className="relative min-h-[100svh] flex items-center overflow-hidden py-20 sm:py-24 bg-cyber-grid">
      <div className="absolute inset-0 bg-grid-lines opacity-30" />

      <div className="stage-16x9 relative z-10 px-5 sm:px-8 lg:px-12">
        <div ref={headerRef} className="text-center mb-16 opacity-0">
          <p className="text-cyan text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">02</p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold" style={{ fontFamily: "'Centrion', var(--font-space-grotesk)" }}>
            <span className="glow-cyan">The Origin</span>
          </h2>
          <div className="cyber-divider mt-6" />
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div ref={storyRef} className="opacity-0">
            <h3 className="text-2xl sm:text-3xl font-semibold mb-6 text-foreground/90" style={{ fontFamily: "'Centrion', var(--font-space-grotesk)" }}>
              Where it all began
            </h3>
            <div className="space-y-4 text-foreground/50 leading-relaxed text-sm">
              <p>Born from the corridors of College of Engineering, Guindy — one of India&apos;s oldest and most prestigious engineering institutions — CSAU emerged as a beacon for students passionate about technology and innovation.</p>
              <p>What started as a small group of curious minds evolved into a thriving community of 500+ members, spanning multiple domains from AI to Cybersecurity, all united by the shared belief that technology can shape a better tomorrow.</p>
              <p>Today, CSAU stands as one of the most active technical communities at Anna University, hosting workshops, hackathons, and competitions that bridge the gap between academic learning and real-world engineering.</p>
            </div>
            <div className="mt-8 space-y-0">
              {timeline.map((step, i) => (
                <TimelineStep key={i} label={step} index={i} isLast={i === timeline.length - 1} />
              ))}
            </div>
          </div>

          <div ref={statsContainerRef} className="grid grid-cols-2 gap-6 opacity-0">
            {stats.map((stat) => (
              <div key={stat.label} className="holo-card rounded-xl p-6 text-center">
                <div className="text-3xl sm:text-4xl font-bold text-cyan glow-cyan">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="mt-2 text-xs text-foreground/40 tracking-wider uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
