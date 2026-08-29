"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ============================================================
   TEAM SHOWCASE — Premium Editorial Team Wall (Sculptural Tactility)

   Scroll-driven pair showcase: two members enter together at
   each scroll stage. Previous members remain as a desaturated
   background collage. Full-viewport pinned section with GSAP
   ScrollTrigger. Claymorphism aesthetic.
   ============================================================ */

interface Member {
  name: string;
  role: string;
  image?: string;
}

const teamData: Record<string, Member[]> = {
  presidents: [
    { name: "Mohamed Yassine Cherif", role: "President", image: "/images/presidents/mohamed-yassine-cherif.png" },
    { name: "Yassine Joundi", role: "Vice President", image: "/images/presidents/yassine-joundi.png" },
  ],
  heads: [
    { name: "Azer Bhiri", role: "Head of Organization & Communication", image: "/images/heads/Azer Bhiri.png" },
    { name: "Raghd Gharbi", role: "Head of Cybersecurity", image: "/images/heads/Raghd Gharbi.png" },
    { name: "Ahmed Tlili", role: "Head of Development", image: "/images/heads/Ahmed Tlili.png" },
    { name: "Ghaya Guembri", role: "Head of AI", image: "/images/heads/Ghaya Guembri.png" },
    { name: "Youssef Ben Salem", role: "Head of Cloud & Infra", image: "/images/heads/Youssef Ben Salem.png" },
    { name: "Mouhib Bouajila", role: "Head of Finance", image: "/images/heads/Mouhib Bouajila.png" },
  ],
  deputies: [
    { name: "Nour Hadded", role: "Deputy Head of Organization & Communication", image: "/images/deputyheads/Nour Hadded.png" },
    { name: "Ahmed Amine Mallouli", role: "Deputy Head of Cybersecurity", image: "/images/deputyheads/Ahmed Amine Mallouli.png" },
    { name: "Rim Ouerghemi", role: "Deputy Head of Organization & Communication", image: "/images/deputyheads/Rim Ouerghemi.png" },
    { name: "Mohamed Amin Bouazizi", role: "Deputy Head of Development", image: "/images/deputyheads/Mohamed Amin Bouazizi.png" },
    { name: "Abdelbasset Bouagina", role: "Deputy Head of Finance", image: "/images/deputyheads/Abdelbasset Bouagina.png" },
    { name: "Ahlem Kallel", role: "Deputy Head of AI", image: "/images/deputyheads/Ahlem Kallel.png" },
    { name: "Ahmed Tlili", role: "Deputy Head of Development", image: "/images/deputyheads/Ahmed Tlili.png" },
    { name: "Oussema Ben Fraj", role: "Deputy Head of Development", image: "/images/deputyheads/Oussema Ben Fraj.png" },
    { name: "Rahma Bounaaja", role: "Deputy Head of AI", image: "/images/deputyheads/Rahma Bounaaja.png" },
    { name: "Rim Khiari", role: "Deputy Head of Cybersecurity", image: "/images/deputyheads/Rim Khiari.png" },
    { name: "Youssef Ben Othman", role: "Deputy Head of AI", image: "/images/deputyheads/Youssef Ben Othman.png" },
  ],
};

/* ── Pair member figure (editorial cutout, claymorphism) ── */
function MemberFigure({
  member,
  side,
  isActive,
}: {
  member: Member;
  side: "left" | "right";
  isActive: boolean;
}) {
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div
      className="relative flex flex-col"
      style={{
        width: "clamp(140px, 22vw, 300px)",
        alignItems: side === "left" ? "flex-end" : "flex-start",
      }}
    >
      {/* Portrait — clay card frame */}
      <div
        className="relative overflow-hidden"
        style={{
          width: "100%",
          aspectRatio: "3/4",
          borderRadius: "1.5rem",
          background: "var(--surface-container-low)",
          boxShadow: isActive
            ? "0 4px 16px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)"
            : "0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03)",
          border: isActive ? "1px solid var(--outline-variant)" : "1px solid rgba(199,198,203,0.5)",
          transition: "box-shadow 0.5s ease, border-color 0.5s ease",
        }}
      >
        {member.image ? (
          <img
            src={member.image}
            alt={member.name}
            className="w-full h-full object-cover object-top"
            style={{
              maskImage:
                "linear-gradient(to bottom, black 55%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 55%, transparent 100%)",
              borderRadius: "1.5rem",
            }}
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--surface-container), var(--surface-container-high))",
            }}
          >
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 80,
                height: 80,
                background: "var(--surface-container-lowest)",
                boxShadow: "var(--clay-shadow-sm)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--primary)",
                }}
              >
                {initials}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Name & role */}
      <div
        className="mt-4"
        style={{
          textAlign: side === "left" ? "right" : "left",
          paddingRight: side === "left" ? 4 : 0,
          paddingLeft: side === "right" ? 4 : 0,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(12px, 1.2vw, 16px)",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: isActive ? "var(--on-surface)" : "var(--on-surface-variant)",
            textTransform: "uppercase",
            lineHeight: 1.3,
            transition: "color 0.4s ease",
          }}
        >
          {member.name}
        </div>
        <div
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(9px, 0.75vw, 11px)",
            fontWeight: 500,
            letterSpacing: "0.05em",
            color: isActive ? "var(--on-surface-variant)" : "var(--outline)",
            marginTop: 4,
            textTransform: "uppercase",
            transition: "color 0.4s ease",
          }}
        >
          {member.role}
        </div>
      </div>
    </div>
  );
}

/* ── Background decorative elements ── */
function BackgroundElements() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Soft radial gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, var(--surface-container-low) 0%, var(--background) 60%)",
        }}
      />

      {/* Faint grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--outline-variant) 1px, transparent 1px), linear-gradient(90deg, var(--outline-variant) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          opacity: 0.15,
          maskImage: "radial-gradient(ellipse at 50% 50%, black 0%, transparent 65%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 0%, transparent 65%)",
        }}
      />

      {/* Constellation lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.4 }}
      >
        <g stroke="var(--outline-variant)" strokeWidth="0.8" opacity="0.5">
          <line x1="100" y1="100" x2="300" y2="200" />
          <line x1="300" y1="200" x2="250" y2="400" />
          <line x1="300" y1="200" x2="600" y2="150" />
          <line x1="600" y1="150" x2="900" y2="300" />
          <line x1="250" y1="400" x2="500" y2="500" />
          <line x1="500" y1="500" x2="800" y2="450" />
          <line x1="800" y1="450" x2="1050" y2="550" />
          <line x1="100" y1="600" x2="350" y2="550" />
          <line x1="350" y1="550" x2="600" y2="650" />
        </g>
        <g fill="var(--outline-variant)" opacity="0.4">
          <circle cx="100" cy="100" r="2.5" />
          <circle cx="300" cy="200" r="2.5" />
          <circle cx="250" cy="400" r="2.5" />
          <circle cx="600" cy="150" r="2.5" />
          <circle cx="900" cy="300" r="2.5" />
          <circle cx="500" cy="500" r="2.5" />
          <circle cx="800" cy="450" r="2.5" />
          <circle cx="1050" cy="550" r="2.5" />
        </g>
      </svg>

      {/* Faint code fragments */}
      <div
        className="absolute"
        style={{
          top: "15%",
          right: "8%",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: "var(--outline-variant)",
          opacity: 0.3,
          lineHeight: 2.2,
          whiteSpace: "pre",
          transform: "rotate(-3deg)",
        }}
      >
        {"const team = [\n  { role: 'president' },\n  { role: 'head' },\n  { role: 'deputy' },\n];"}
      </div>

      <div
        className="absolute"
        style={{
          bottom: "20%",
          left: "6%",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: "var(--outline-variant)",
          opacity: 0.25,
          lineHeight: 2.2,
          whiteSpace: "pre",
          transform: "rotate(2deg)",
        }}
      >
        {"export default function Team() {\n  return <Showcase />;\n}"}
      </div>

      {/* Thin horizontal rules */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: "30%",
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--outline-variant), transparent)",
          opacity: 0.2,
        }}
      />
      <div
        className="absolute left-0 right-0"
        style={{
          top: "70%",
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--outline-variant), transparent)",
          opacity: 0.15,
        }}
      />
    </div>
  );
}

/* ── Main Team Showcase ── */
export default function TeamShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const pairElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [activePair, setActivePair] = useState(0);

  const pairs = useMemo(() => {
    const all = [
      ...teamData.presidents,
      ...teamData.heads,
      ...teamData.deputies,
    ];
    const result: [Member, Member?][] = [];
    for (let i = 0; i < all.length; i += 2) {
      result.push([all[i], all[i + 1]]);
    }
    return result;
  }, []);

  const totalPairs = pairs.length;

  const getLayoutStyle = useCallback(
    (pairIndex: number): React.CSSProperties => {
      const isOdd = pairIndex % 2 === 1;
      return {
        paddingTop: isOdd ? "2%" : "0%",
      };
    },
    []
  );

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    if (!section || !pin) return;

    const pairEls = pairElsRef.current.filter(Boolean);
    if (pairEls.length < 2) return;

    ScrollTrigger.getAll().forEach((t) => t.kill());

    pairEls.forEach((el, i) => {
      if (i === 0) {
        gsap.set(el, {
          y: 0,
          scale: 1,
          opacity: 1,
          filter: "grayscale(0%) blur(0px)",
        });
      } else {
        gsap.set(el, {
          y: "40%",
          scale: 0.55,
          opacity: 0,
          filter: "grayscale(100%) blur(8px)",
        });
      }
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.8,
        pin: false,
        onUpdate(self) {
          const pairDuration = 1 / (totalPairs - 1 || 1);
          const idx = Math.min(
            Math.floor(self.progress / pairDuration),
            totalPairs - 1
          );
          setActivePair(idx);
        },
      },
    });

    const transitionDuration = 1 / (totalPairs - 1 || 1);

    for (let i = 0; i < totalPairs - 1; i++) {
      const startTime = i * transitionDuration;

      tl.to(
        pairEls[i],
        {
          y: "-35%",
          scale: 0.45,
          opacity: 0.15,
          filter: "grayscale(100%) blur(4px)",
          ease: "power2.inOut",
          duration: transitionDuration,
        },
        startTime
      );

      tl.to(
        pairEls[i + 1],
        {
          y: "0%",
          scale: 1,
          opacity: 1,
          filter: "grayscale(0%) blur(0px)",
          ease: "power2.inOut",
          duration: transitionDuration,
        },
        startTime
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      tl.kill();
    };
  }, [pairs, totalPairs]);

  return (
    <section
      ref={sectionRef}
      className="relative"
      aria-label="Team Showcase — Editorial Wall"
      style={{
        height: `${totalPairs * 100}vh`,
      }}
    >
      {/* Pinned viewport */}
      <div
        ref={pinRef}
        className="sticky top-0 w-full overflow-hidden"
        style={{
          height: "100vh",
          background: "var(--background)",
        }}
      >
        <BackgroundElements />

        {/* Top HUD bar */}
        <div
          className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between"
          style={{
            padding: "20px clamp(16px, 4vw, 40px)",
            background:
              "linear-gradient(180deg, var(--background) 0%, transparent 100%)",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "0.04em",
                color: "var(--primary)",
              }}
            >
              CSAU
            </div>
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.05em",
                color: "var(--outline)",
              }}
            >
              team / roster.tsx
            </div>
          </div>
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--outline)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: "var(--primary-container)" }}>+</span>
            <span>{totalPairs * 2}</span>
            <span style={{ opacity: 0.5 }}>members</span>
          </div>
        </div>

        {/* Pair layers */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 10 }}
        >
          {pairs.map((pair, i) => (
            <div
              key={i}
              ref={(el) => {
                pairElsRef.current[i] = el;
              }}
              className="absolute flex items-end justify-center"
              style={{
                gap: "clamp(16px, 5vw, 80px)",
                bottom: "clamp(10%, 14vh, 18%)",
                left: "50%",
                transform: "translateX(-50%)",
                width: "min(90vw, 1100px)",
                willChange: "transform, opacity, filter",
                ...getLayoutStyle(i),
              }}
            >
              <MemberFigure
                member={pair[0]}
                side="left"
                isActive={i === activePair}
              />
              {pair[1] && (
                <MemberFigure
                  member={pair[1]}
                  side="right"
                  isActive={i === activePair}
                />
              )}
            </div>
          ))}
        </div>

        {/* Bottom progress bar */}
        <div
          className="absolute bottom-0 left-0 right-0 z-40"
          style={{
            padding: "0 clamp(16px, 4vw, 40px) 24px",
            background:
              "linear-gradient(0deg, var(--background) 0%, transparent 100%)",
          }}
        >
          <div className="flex items-center justify-between" style={{ maxWidth: 1100, margin: "0 auto" }}>
            {/* Pair dots */}
            <div className="flex items-center" style={{ gap: 8 }}>
              {pairs.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === activePair ? 28 : 8,
                    height: 8,
                    borderRadius: 99,
                    background:
                      i === activePair
                        ? "var(--primary)"
                        : "var(--outline-variant)",
                    transition: "all 0.35s ease",
                    boxShadow:
                      i === activePair
                        ? "0 2px 8px rgba(0,0,0,0.12)"
                        : "none",
                  }}
                />
              ))}
            </div>

            {/* Scroll hint */}
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.05em",
                color: "var(--outline)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>scroll to explore</span>
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 14,
                  background: "var(--primary)",
                  borderRadius: 2,
                  animation: "blink 1s steps(1) infinite",
                }}
              />
            </div>
          </div>
        </div>

        {/* Section title — large background typography */}
        <div
          className="absolute pointer-events-none select-none"
          style={{
            top: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(48px, 10vw, 140px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--surface-container-high)",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            zIndex: 1,
          }}
        >
          THE TEAM
        </div>
      </div>
    </section>
  );
}
