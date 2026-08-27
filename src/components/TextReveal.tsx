"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/* ============================================================
   TEXT REVEAL — Cinematic scroll-triggered text animations.
   
   Variants:
   - "split"  : Characters animate individually from below
   - "line"   : Lines slide in from left with stagger
   - "fade"   : Word-by-word opacity reveal
   - "clip"   : Text clipped by an expanding box
   - "glitch" : Text appears with glitch effect
   ============================================================ */

type RevealVariant = "split" | "line" | "fade" | "clip" | "glitch";

interface TextRevealProps {
  children: string;
  variant?: RevealVariant;
  className?: string;
  /** Stagger delay between elements (seconds) */
  stagger?: number;
  /** ScrollTrigger start position */
  triggerStart?: string;
}

function SplitReveal({
  text,
  className,
  stagger,
  triggerStart,
}: {
  text: string;
  className?: string;
  stagger?: number;
  triggerStart?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chars = containerRef.current.querySelectorAll(".reveal-char");

    const ctx = gsap.context(() => {
      gsap.fromTo(
        chars,
        {
          opacity: 0,
          y: 40,
          rotationX: -60,
          filter: "blur(4px)",
        },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          filter: "blur(0px)",
          duration: 0.6,
          stagger: stagger ?? 0.03,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: triggerStart ?? "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [stagger, triggerStart]);

  return (
    <div ref={containerRef} className={className} style={{ perspective: "600px" }}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="reveal-char inline-block"
          style={{
            display: char === " " ? "inline" : "inline-block",
            whiteSpace: char === " " ? "pre" : undefined,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  );
}

function FadeWordReveal({
  text,
  className,
  stagger,
  triggerStart,
}: {
  text: string;
  className?: string;
  stagger?: number;
  triggerStart?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const words = containerRef.current.querySelectorAll(".reveal-word");

    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        {
          opacity: 0,
          y: 20,
          filter: "blur(6px)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.5,
          stagger: stagger ?? 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: triggerStart ?? "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [stagger, triggerStart]);

  return (
    <div ref={containerRef} className={className}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="reveal-word inline-block mr-[0.3em]">
          {word}
        </span>
      ))}
    </div>
  );
}

function GlitchReveal({
  text,
  className,
  triggerStart,
}: {
  text: string;
  className?: string;
  triggerStart?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        {
          opacity: 0,
          scale: 1.1,
          filter: "blur(8px)",
        },
        {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: triggerStart ?? "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [triggerStart]);

  return (
    <div
      ref={containerRef}
      className={`${className} glitch`}
      data-text={text}
    >
      {text}
    </div>
  );
}

export default function TextReveal({
  children,
  variant = "split",
  className,
  stagger,
  triggerStart,
}: TextRevealProps) {
  switch (variant) {
    case "split":
      return (
        <SplitReveal
          text={children}
          className={className}
          stagger={stagger}
          triggerStart={triggerStart}
        />
      );
    case "fade":
      return (
        <FadeWordReveal
          text={children}
          className={className}
          stagger={stagger}
          triggerStart={triggerStart}
        />
      );
    case "glitch":
      return (
        <GlitchReveal
          text={children}
          className={className}
          triggerStart={triggerStart}
        />
      );
    case "clip":
    case "line":
    default:
      return (
        <FadeWordReveal
          text={children}
          className={className}
          stagger={stagger}
          triggerStart={triggerStart}
        />
      );
  }
}
