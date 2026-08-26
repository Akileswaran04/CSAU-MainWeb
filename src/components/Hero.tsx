"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEntered } from "@/hooks/useEntered";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ============================================================
   Particles + Circuit SVG — rendered on the client only
   ============================================================ */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];

    const cvs = canvas;
    const context = ctx;

    function resize() {
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * cvs.width,
        y: Math.random() * cvs.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.1,
        r: Math.random() * 2 + 0.5,
        o: Math.random() * 0.5 + 0.2,
      });
    }

    function draw() {
      context.clearRect(0, 0, cvs.width, cvs.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = cvs.height + 10; p.x = Math.random() * cvs.width; }
        if (p.x < -10) p.x = cvs.width + 10;
        if (p.x > cvs.width + 10) p.x = -10;

        context.beginPath();
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.fillStyle = `rgba(84, 217, 232, ${p.o})`;
        context.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            context.beginPath();
            context.moveTo(particles[i].x, particles[i].y);
            context.lineTo(particles[j].x, particles[j].y);
            context.strokeStyle = `rgba(84, 217, 232, ${0.08 * (1 - dist / 120)})`;
            context.lineWidth = 0.5;
            context.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      aria-hidden
    />
  );
}

/* ============================================================
   Hero Section — THE GATE
   ============================================================ */
export default function Hero() {
  const ready = useEntered();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ready) return;

    const tl = gsap.timeline({ delay: 0.2 });

    tl.fromTo(
      titleRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
    )
      .fromTo(
        subtitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.4"
      )
      .fromTo(
        descRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.5"
      )
      .fromTo(
        ctaRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" },
        "-=0.3"
      )
      .fromTo(
        scrollRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1, ease: "power2.out" },
        "-=0.2"
      );

    // Arrow bounce animation (infinite)
    gsap.to(arrowRef.current, {
      x: 6,
      duration: 0.75,
      ease: "power1.inOut",
      repeat: -1,
      yoyo: true,
    });

    // Scroll indicator bounce
    const scrollLine = scrollRef.current?.querySelector("div");
    if (scrollLine) {
      gsap.to(scrollLine, {
        y: 8,
        duration: 0.75,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true,
      });
    }

    // Parallax on Hero background elements as user scrolls down
    gsap.to(".hero-cyan-glow", {
      y: -120,
      scale: 0.7,
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });
    gsap.to(".hero-magenta-glow", {
      y: -80,
      x: 40,
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });

    // Fade out hero content on scroll
    gsap.to(".hero-content", {
      y: -60,
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "30% top",
        end: "80% top",
        scrub: 1,
      },
    });
  }, [ready]);

  return (
    <section
      ref={sectionRef}
      id="gate"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid-lines"
    >
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#090714] via-transparent to-[#090714] z-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#090714]/50 via-transparent to-[#090714]/50 z-0" />

      {/* Radial glow — parallax targets */}
      <div className="hero-cyan-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan/5 rounded-full blur-3xl z-0" />
      <div className="hero-magenta-glow absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-magenta/5 rounded-full blur-3xl z-0" />

      {/* Particle canvas */}
      <ParticleCanvas />

      {/* Circuit SVG decoration */}
      <svg
        className="absolute bottom-0 left-0 w-full h-48 z-0 opacity-20"
        viewBox="0 0 1440 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 200 L200 200 L250 150 L450 150 L500 100 L700 100 L750 50 L950 50 L1000 0"
          stroke="rgba(84,217,232,0.3)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <path
          d="M1440 200 L1200 200 L1150 140 L950 140 L900 80 L700 80 L650 30 L450 30"
          stroke="rgba(215,124,203,0.2)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <circle cx="250" cy="150" r="4" fill="rgba(84,217,232,0.6)" />
        <circle cx="500" cy="100" r="4" fill="rgba(84,217,232,0.6)" />
        <circle cx="750" cy="50" r="4" fill="rgba(84,217,232,0.6)" />
        <circle cx="1150" cy="140" r="4" fill="rgba(215,124,203,0.5)" />
        <circle cx="900" cy="80" r="4" fill="rgba(215,124,203,0.5)" />
      </svg>

      {/* Content — parallax fade target */}
      <div className="hero-content relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div>
          <h1
            ref={titleRef}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter font-[family-name:var(--font-space-grotesk)] text-foreground glow-cyan"
          >
            CSAU
          </h1>
        </div>

        <div>
          <p
            ref={subtitleRef}
            className="mt-4 text-sm sm:text-base md:text-lg tracking-[0.3em] uppercase text-foreground/60 font-[family-name:var(--font-geist-mono)]"
          >
            Computer Society of Anna University
          </p>
        </div>

        <div>
          <p
            ref={descRef}
            className="mt-6 text-lg sm:text-xl text-foreground/50 max-w-xl mx-auto leading-relaxed"
          >
            Building the future of technology, one line of code at a time.
          </p>
        </div>

        <div ref={ctaRef} className="mt-12">
          <a
            href="#origin"
            className="inline-flex items-center gap-3 px-8 py-4 border border-cyan rounded-lg text-cyan font-medium tracking-wide hover:bg-cyan/10 transition-all duration-300 animate-pulse-cyan group"
          >
            <span>ENTER THE WORLD</span>
            <span ref={arrowRef} className="text-lg inline-block">
              →
            </span>
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        ref={scrollRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <span className="text-xs tracking-widest text-foreground/30 uppercase">
          Scroll
        </span>
        <div className="w-px h-8 bg-gradient-to-b from-cyan/60 to-transparent" />
      </div>
    </section>
  );
}
