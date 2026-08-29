"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TeamCard from "@/components/TeamCard";
import TargetCursor from "@/components/TargetCursor";

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   TEAM PAGE — Premium Editorial Hierarchy

   2 Presidents featured at top.
   Heads in centered row.
   Deputies in centered grid.
   GSAP ScrollTrigger drives progressive card opening.
   Hover-inversion toggle.
   Massive section labels.
   ============================================================ */

const PRESIDENTS = [
  { name: "Aarav Sharma", role: "President", photo: "https://i.pravatar.cc/400?img=13" },
  { name: "Meera Iyer", role: "Co-President", photo: "https://i.pravatar.cc/400?img=32" },
];

const HEADS = [
  { name: "Karthik Raj", role: "Technical Head", photo: "https://i.pravatar.cc/400?img=15" },
  { name: "Sanjana Nair", role: "Design Head", photo: "https://i.pravatar.cc/400?img=48" },
  { name: "Rohan Patel", role: "Operations Head", photo: "https://i.pravatar.cc/400?img=53" },
  { name: "Meera Rajan", role: "Outreach Head", photo: "https://i.pravatar.cc/400?img=44" },
  { name: "Arjun Menon", role: "Content Head", photo: "https://i.pravatar.cc/400?img=59" },
  { name: "Nisha Gupta", role: "Logistics Head", photo: "https://i.pravatar.cc/400?img=28" },
];

const DEPUTIES = [
  { name: "Priya Verma", role: "Technical Deputy", photo: "https://i.pravatar.cc/400?img=23" },
  { name: "Vikram Singh", role: "Design Deputy", photo: "https://i.pravatar.cc/400?img=33" },
  { name: "Ananya Reddy", role: "Outreach Deputy", photo: "https://i.pravatar.cc/400?img=25" },
  { name: "Rahul Krishnan", role: "Operations Deputy", photo: "https://i.pravatar.cc/400?img=51" },
  { name: "Aditya Rao", role: "Technical Deputy", photo: "https://i.pravatar.cc/400?img=60" },
  { name: "Kavya Pillai", role: "Design Deputy", photo: "https://i.pravatar.cc/400?img=36" },
  { name: "Siddharth Nair", role: "Outreach Deputy", photo: "https://i.pravatar.cc/400?img=57" },
  { name: "Tanvi Sharma", role: "Operations Deputy", photo: "https://i.pravatar.cc/400?img=41" },
  { name: "Ravi Kumar", role: "Content Deputy", photo: "https://i.pravatar.cc/400?img=64" },
  { name: "Divya Iyer", role: "Technical Deputy", photo: "https://i.pravatar.cc/400?img=45" },
  { name: "Nikhil Das", role: "Design Deputy", photo: "https://i.pravatar.cc/400?img=68" },
  { name: "Sneha Menon", role: "Outreach Deputy", photo: "https://i.pravatar.cc/400?img=47" },
  { name: "Karthik Iyer", role: "Operations Deputy", photo: "https://i.pravatar.cc/400?img=55" },
  { name: "Riya Joshi", role: "Content Deputy", photo: "https://i.pravatar.cc/400?img=39" },
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
  // Default: hover mode on desktop, scroll mode on mobile
  const [inverted, setInverted] = useState<boolean | null>(null);
  const [scrollProgs, setScrollProgs] = useState<Record<string, number>>({});
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const toggleCursor = useCallback(() => setInverted((v) => !v), []);

  // Detect device on mount and set default mode
  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    setInverted(isMobile); // scroll mode on mobile, hover on desktop
  }, []);

  const cursorColor = inverted === true ? "#ffffff" : "#1a1b22";

  // GSAP ScrollTrigger — progressive card opening tied to scroll
  useEffect(() => {
    const triggers: ScrollTrigger[] = [];

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      cardRefsMap.current.forEach((el, key) => {
        const rect = el.getBoundingClientRect();
        const alreadyInView = rect.top < window.innerHeight && rect.bottom > 0;

        const st = ScrollTrigger.create({
          trigger: el,
          start: "top 350%",
          end: "bottom -200%",
          scrub: 1,
          onUpdate: (self) => {
            setScrollProgs((prev) => ({ ...prev, [key]: self.progress }));
          },
        });

        // If card is already in view on load, set progress based on position
        if (alreadyInView) {
          const viewportCenter = window.innerHeight / 2;
          const cardCenter = rect.top + rect.height / 2;
          const distFromCenter = Math.abs(cardCenter - viewportCenter);
          const maxDist = window.innerHeight;
          const initialProgress = 1;
          setScrollProgs((prev) => ({ ...prev, [key]: initialProgress }));
        }

        triggers.push(st);
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      triggers.forEach((st) => st.kill());
    };
  }, []);

  const setCardRef = useCallback((key: string) => (el: HTMLDivElement | null) => {
    if (el) cardRefsMap.current.set(key, el);
    else cardRefsMap.current.delete(key);
  }, []);

  // Invert mode: compute filter for each card based on hovered state
  const getInvertStyle = (cardIdx: number): React.CSSProperties => {
    if (!inverted || hoveredIdx === null) return {};
    if (cardIdx === hoveredIdx) {
      return { filter: "brightness(0.7) saturate(0.8)", transition: "filter 0.4s ease" };
    }
    return { filter: "brightness(1.05)", transition: "filter 0.4s ease" };
  };

  return (
    <>
      <TargetCursor
        spinDuration={3}
        hideDefaultCursor={true}
        color={cursorColor}
      />

      {/* ── Toggle button — top center ── */}
      <button
        onClick={toggleCursor}
        aria-label="Toggle hover inversion"
        style={{
          position: "fixed",
          top: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 200,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: inverted ? "#fff" : "var(--on-surface, #1a1b22)",
          background: inverted ? "var(--primary, #121315)" : "var(--surface-container-lowest, #fff)",
          border: `1.5px solid ${inverted ? "var(--primary, #121315)" : "var(--outline, #77767b)"}`,
          padding: "12px 28px",
          borderRadius: 999,
          cursor: "pointer",
          boxShadow: inverted
            ? "0 4px 16px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15)"
            : "0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
          transition: "all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: inverted ? "#4ade80" : "var(--outline-variant, #c7c6cb)",
            transition: "background 0.3s ease",
            boxShadow: inverted ? "0 0 6px rgba(74,222,128,0.5)" : "none",
          }}
        />
        {inverted ? "SCROLL MODE" : "HOVER MODE"}
      </button>

      <div
        ref={containerRef}
        className="min-h-screen"
        style={{
          background: "var(--background)",
          paddingTop: "14vh",
          paddingBottom: "12vh",
        }}
      >
        <div
          className="mx-auto px-6 sm:px-10 lg:px-16"
          style={{ maxWidth: 1200 }}
        >
          {/* ── Presidents ── */}
          <SectionLabel>Presidents</SectionLabel>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 40,
              flexWrap: "wrap",
              marginBottom: 100,
            }}
          >
            {PRESIDENTS.map((member, i) => {
              const key = `pres-${i}`;
              return (
              <div
                key={key}
                ref={setCardRef(key)}
                style={{
                  width: 260,
                  ...getInvertStyle(i),
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <TeamCard
                  name={member.name}
                  role={member.role}
                  photo={member.photo}
                  index={i + 1}
                  size="large"
                  scrollProgress={scrollProgs[key] ?? 0}
                  inverted={!!inverted}
                />
              </div>
              );
            })}
          </div>

          {/* ── Heads ── */}
          <SectionLabel>Heads</SectionLabel>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 40,
              marginBottom: 100,
            }}
          >
            {HEADS.map((member, i) => {
              const key = `head-${i}`;
              return (
              <div
                key={key}
                ref={setCardRef(key)}
                style={{
                  width: 240,
                  ...getInvertStyle(i + PRESIDENTS.length),
                }}
                onMouseEnter={() => setHoveredIdx(i + PRESIDENTS.length)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <TeamCard
                  name={member.name}
                  role={member.role}
                  photo={member.photo}
                  index={i + PRESIDENTS.length + 1}
                  size="medium"
                  scrollProgress={scrollProgs[key] ?? 0}
                  inverted={!!inverted}
                />
              </div>
              );
            })}
          </div>

          {/* ── Deputies ── */}
          <SectionLabel>Deputies</SectionLabel>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "48px 32px",
              justifyItems: "center",
            }}
          >
            {DEPUTIES.map((member, i) => {
              const globalIdx = i + PRESIDENTS.length + HEADS.length;
              const key = `dep-${i}`;
              return (
                <div
                  key={key}
                  ref={setCardRef(key)}
                  style={{
                    width: "100%",
                    maxWidth: 220,
                    ...getInvertStyle(globalIdx),
                  }}
                  onMouseEnter={() => setHoveredIdx(globalIdx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <TeamCard
                    name={member.name}
                    role={member.role}
                    photo={member.photo}
                    index={i + PRESIDENTS.length + HEADS.length + 1}
                    size="small"
                    scrollProgress={scrollProgs[key] ?? 0}
                    inverted={!!inverted}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
