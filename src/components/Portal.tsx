"use client";

import { useState, useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import anime from "animejs";
import clsx from "clsx";

/* ---------- Social links data ---------- */
const socials = [
  { name: "Instagram", href: "#", icon: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )},
  { name: "LinkedIn", href: "#", icon: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )},
  { name: "GitHub", href: "#", icon: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )},
  { name: "YouTube", href: "#", icon: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )},
];

const interestOptions = [
  "AI / ML", "Web Dev", "Data Science", "Coding & CP",
  "Cybersecurity", "Cloud & DevOps", "UI / UX", "Open Source",
];

export default function Portal() {
  const [form, setForm] = useState({ name: "", email: "", dept: "", interests: [] as string[] });
  const [submitted, setSubmitted] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const ring3Ref = useRef<HTMLDivElement>(null);

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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

      // Portal visual — slide in from left + scale
      gsap.fromTo(
        visualRef.current,
        { opacity: 0, x: -60, scale: 0.9 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: visualRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );

      // Form — slide in from right
      gsap.fromTo(
        formRef.current,
        { opacity: 0, x: 60 },
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: formRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );

      // Portal rings — speed up on scroll through section
      const rings = [ring1Ref.current, ring2Ref.current, ring3Ref.current].filter(Boolean);
      if (rings.length) {
        gsap.to(rings, {
          rotation: "+=360",
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 2,
          },
        });
      }

      // Background glow pulse on scroll
      gsap.to(".portal-glow-cyan", {
        scale: 1.3,
        opacity: 0.08,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "center center",
          scrub: 1,
        },
      });
      gsap.to(".portal-glow-magenta", {
        scale: 1.5,
        opacity: 0.06,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "center center",
          scrub: 1,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Portal ring animations using anime.js (continuous spin)
  useEffect(() => {
    if (!ring1Ref.current || !ring2Ref.current || !ring3Ref.current) return;

    anime({
      targets: ring1Ref.current,
      rotate: "1turn",
      duration: 20000,
      loop: true,
      easing: "linear",
    });

    anime({
      targets: ring2Ref.current,
      rotate: "-1turn",
      duration: 30000,
      loop: true,
      easing: "linear",
    });

    anime({
      targets: ring3Ref.current,
      rotate: "1turn",
      duration: 15000,
      loop: true,
      easing: "linear",
    });
  }, []);

  return (
    <>
      <section ref={sectionRef} id="portal" className="relative min-h-[100svh] flex items-center overflow-hidden py-20 sm:py-24">
        {/* Background */}
        <div className="absolute inset-0 bg-grid-lines opacity-20" />

        {/* Portal glow */}
        <div className="portal-glow-cyan absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan/5 rounded-full blur-3xl" />
        <div className="portal-glow-magenta absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-magenta/5 rounded-full blur-2xl" />

        <div className="stage-16x9 relative z-10 px-5 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div ref={headerRef} className="text-center mb-16 opacity-0">
            <p className="text-cyan text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">
              07
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-[family-name:var(--font-space-grotesk)]">
              The Portal
            </h2>
            <p className="mt-4 text-foreground/50 max-w-xl mx-auto">
              Ready to enter the digital realm? Join 500+ members and start your journey.
            </p>
            <div className="section-divider mt-6" />
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left — Portal Visual */}
            <div ref={visualRef} className="flex flex-col items-center justify-center opacity-0">
              {/* Animated portal ring */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80">
                <div
                  ref={ring1Ref}
                  className="absolute inset-0 rounded-full border border-cyan/30"
                />
                <div
                  ref={ring2Ref}
                  className="absolute inset-4 rounded-full border border-magenta/20"
                />
                <div
                  ref={ring3Ref}
                  className="absolute inset-8 rounded-full border border-cyan/20"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-cyan/20 to-magenta/20 flex items-center justify-center">
                    <span className="text-4xl sm:text-5xl">🚀</span>
                  </div>
                </div>
              </div>

              <p className="mt-8 text-foreground/40 text-sm text-center max-w-xs">
                Become part of something bigger. Collaborate, learn, and build the future with CSAU.
              </p>
            </div>

            {/* Right — Form */}
            <div ref={formRef} className="opacity-0">
              {submitted ? (
                <div className="holo-card rounded-xl p-8 text-center">
                  <div className="text-5xl mb-4">✨</div>
                  <h3 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-cyan mb-2">
                    Welcome to the Realm
                  </h3>
                  <p className="text-foreground/60">
                    Your application has been received. We&apos;ll be in touch soon!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="holo-card rounded-xl p-8 space-y-6">
                  <h3 className="text-xl font-semibold font-[family-name:var(--font-space-grotesk)] text-foreground/90">
                    Join CSAU
                  </h3>

                  {/* Name */}
                  <div>
                    <label className="block text-sm text-foreground/50 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground/90 placeholder:text-foreground/30 focus:border-cyan/50 focus:outline-none focus:ring-1 focus:ring-cyan/30 transition-all"
                      placeholder="Your full name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm text-foreground/50 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground/90 placeholder:text-foreground/30 focus:border-cyan/50 focus:outline-none focus:ring-1 focus:ring-cyan/30 transition-all"
                      placeholder="your@email.com"
                    />
                  </div>

                  {/* Department / Year */}
                  <div>
                    <label className="block text-sm text-foreground/50 mb-1">Department / Year</label>
                    <input
                      type="text"
                      value={form.dept}
                      onChange={(e) => setForm({ ...form, dept: e.target.value })}
                      className="w-full px-4 py-3 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground/90 placeholder:text-foreground/30 focus:border-cyan/50 focus:outline-none focus:ring-1 focus:ring-cyan/30 transition-all"
                      placeholder="e.g. CSE, 3rd Year"
                    />
                  </div>

                  {/* Interests */}
                  <div>
                    <label className="block text-sm text-foreground/50 mb-2">Areas of Interest</label>
                    <div className="flex flex-wrap gap-2">
                      {interestOptions.map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={clsx(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
                            form.interests.includes(interest)
                              ? "bg-cyan/20 text-cyan border-cyan/40"
                              : "text-foreground/40 border-foreground/10 hover:border-foreground/30"
                          )}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full py-3 bg-cyan/10 border border-cyan/40 text-cyan rounded-lg font-medium hover:bg-cyan/20 transition-all duration-300 animate-pulse-cyan"
                  >
                    Submit Application →
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="relative border-t border-foreground/5 py-12">
        <div className="w-full px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="text-center md:text-left">
              <span className="text-xl font-bold text-cyan font-[family-name:var(--font-space-grotesk)]">
                CSAU
              </span>
              <p className="text-xs text-foreground/30 mt-1">The Digital Realm</p>
            </div>

            {/* Social */}
            <div className="flex items-center gap-4">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className="text-foreground/30 hover:text-cyan transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-xs text-foreground/30">
              © {new Date().getFullYear()} CSAU — Computer Society of Anna University
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
