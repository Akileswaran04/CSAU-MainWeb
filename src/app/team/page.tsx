"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Gallery } from "@/components/Gallery";
import TeamCarousel from "@/components/TeamCarousel";
import type { TeamMember } from "@/components/TeamCarousel";

/* ============================================================
   TEAM PAGE — Scroll-Driven Carousel Hierarchy

   Cards slide upward as user scrolls.
   Role on the left, name / dept / links on the right.
   Text fades in sequentially per card.
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

const PRESIDENTS: TeamMember[] = [
  { name: "Aarav Sharma", role: "President", dept: "Computer Science & Engineering", photo: "https://i.pravatar.cc/400?img=13" },
  { name: "Meera Iyer", role: "Co-President", dept: "Information Technology", photo: "https://i.pravatar.cc/400?img=32" },
];

const HEADS: TeamMember[] = [
  { name: "Karthik Raj", role: "Technical Head", dept: "Computer Science & Engineering", photo: "https://i.pravatar.cc/400?img=15" },
  { name: "Sanjana Nair", role: "Design Head", dept: "Electronics & Communication", photo: "https://i.pravatar.cc/400?img=48" },
  { name: "Rohan Patel", role: "Operations Head", dept: "Mechanical Engineering", photo: "https://i.pravatar.cc/400?img=53" },
  { name: "Meera Rajan", role: "Outreach Head", dept: "Electrical Engineering", photo: "https://i.pravatar.cc/400?img=44" },
  { name: "Arjun Menon", role: "Content Head", dept: "Computer Science & Engineering", photo: "https://i.pravatar.cc/400?img=59" },
  { name: "Nisha Gupta", role: "Logistics Head", dept: "Information Technology", photo: "https://i.pravatar.cc/400?img=28" },
];

const DEPUTIES: TeamMember[] = [
  { name: "Priya Verma", role: "Technical Deputy", dept: "Computer Science & Engineering" },
  { name: "Vikram Singh", role: "Design Deputy", dept: "Electronics & Communication" },
  { name: "Ananya Reddy", role: "Outreach Deputy", dept: "Electrical Engineering" },
  { name: "Rahul Krishnan", role: "Operations Deputy", dept: "Mechanical Engineering" },
  { name: "Aditya Rao", role: "Technical Deputy", dept: "Computer Science & Engineering" },
  { name: "Kavya Pillai", role: "Design Deputy", dept: "Electronics & Communication" },
  { name: "Siddharth Nair", role: "Outreach Deputy", dept: "Electrical Engineering" },
  { name: "Tanvi Sharma", role: "Operations Deputy", dept: "Mechanical Engineering" },
  { name: "Ravi Kumar", role: "Content Deputy", dept: "Information Technology" },
  { name: "Divya Iyer", role: "Technical Deputy", dept: "Computer Science & Engineering" },
  { name: "Nikhil Das", role: "Design Deputy", dept: "Electronics & Communication" },
  { name: "Sneha Menon", role: "Outreach Deputy", dept: "Electrical Engineering" },
  { name: "Karthik Iyer", role: "Operations Deputy", dept: "Mechanical Engineering" },
  { name: "Riya Joshi", role: "Content Deputy", dept: "Information Technology" },
];

/* ── Massive Section Label ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 56, marginTop: 24 }}>
      <h2
        style={{
          fontFamily: "'Kenfolg', 'Syne', sans-serif",
          fontSize: "clamp(4rem, 9vw, 9rem)",
          fontWeight: 400,
          letterSpacing: "-0.03em",
          color: "var(--on-surface, #1a1b22)",
          margin: 0,
          lineHeight: 0.9,
        }}
      >
        {children}
      </h2>
      <div
        style={{
          width: 48,
          height: 1,
          background: "var(--outline-variant, #c7c6cb)",
          margin: "20px auto 0",
        }}
      />
    </div>
  );
}

export default function TeamPage() {
  const sectionRefs = useRef<HTMLDivElement[]>([]);

  // Animate section labels on scroll
  useEffect(() => {
    const ctx = gsap.context(() => {
      sectionRefs.current.forEach((el) => {
        if (!el) return;
        gsap.fromTo(el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .tc-section-label { opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      <div
        className="min-h-screen"
        style={{
          background: "var(--background)",
          paddingBottom: "12vh",
        }}
      >
        {/* ── 3D Gallery Hero ── */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "60vh",
            minHeight: 400,
            maxHeight: 600,
            overflow: "hidden",
          }}
        >
          <Gallery
            speed={0.6}
            scale={1.0}
            opacity={0.85}
            hue={0}
            saturation={0.3}
            brightness={1.0}
          />
          {/* Gradient overlay to blend into page */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "40%",
              background: `linear-gradient(to top, var(--background, #fbf8ff), transparent)`,
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
          {/* Title overlay */}
          <div
            style={{
              position: "absolute",
              bottom: "12%",
              left: 0,
              right: 0,
              textAlign: "center",
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            <h1
              style={{
                fontFamily: "'Ethnocentric', 'Sector034', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(2rem, 5vw, 4rem)",
                letterSpacing: ".08em",
                color: "var(--on-surface, #1a1b22)",
                margin: 0,
                textShadow: "0 2px 20px rgba(0,0,0,.08)",
              }}
            >
              OUR TEAM
            </h1>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 12,
                letterSpacing: ".25em",
                color: "var(--outline, #77767b)",
                textTransform: "uppercase",
                margin: "10px 0 0",
              }}
            >
              CODE // BUILD // BREAK
            </p>
          </div>
        </div>

        <div style={{ paddingTop: "14vh" }}>
        {/* ── Presidents ── */}
        <div ref={(el) => { if (el) sectionRefs.current[0] = el; }}>
          <SectionLabel>Presidents</SectionLabel>
        </div>
        <TeamCarousel members={PRESIDENTS} />

        <div style={{ height: 80 }} />

        {/* ── Heads ── */}
        <div ref={(el) => { if (el) sectionRefs.current[1] = el; }}>
          <SectionLabel>Heads</SectionLabel>
        </div>
        <TeamCarousel members={HEADS} />

        <div style={{ height: 80 }} />

        {/* ── Deputies ── */}
        <div ref={(el) => { if (el) sectionRefs.current[2] = el; }}>
          <SectionLabel>Deputies</SectionLabel>
        </div>
        <TeamCarousel members={DEPUTIES} />
        </div>
      </div>
    </>
  );
}
