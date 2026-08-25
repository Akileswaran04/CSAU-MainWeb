"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

/* ---------- Animated Counter ---------- */
function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return (
    <span ref={ref} className="font-[family-name:var(--font-space-grotesk)]">
      {count}{suffix}
    </span>
  );
}

/* ---------- Timeline Step ---------- */
function TimelineStep({ label, index, isLast }: { label: string; index: number; isLast: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="flex items-start gap-4"
    >
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-cyan shadow-[0_0_10px_rgba(84,217,232,0.6)]" />
        {!isLast && <div className="w-px h-12 bg-cyan/30" />}
      </div>
      <p className="text-foreground/70 text-sm pt-0.5">{label}</p>
    </motion.div>
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
  return (
    <section id="origin" className="relative min-h-[100svh] flex items-center overflow-hidden py-20 sm:py-24">
      {/* Background elements */}
      <div className="absolute inset-0 bg-grid-lines opacity-50" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-magenta/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan/5 rounded-full blur-3xl" />

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
            02
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-[family-name:var(--font-space-grotesk)]">
            The Origin
          </h2>
          <div className="section-divider mt-6" />
        </motion.div>

        {/* Split Layout */}
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left — Story */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
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
          </motion.div>

          {/* Right — Stats */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="grid grid-cols-2 gap-6"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                className="holo-card rounded-xl p-6 text-center"
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-cyan glow-cyan">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="mt-2 text-sm text-foreground/50 tracking-wider uppercase">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
