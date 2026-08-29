"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import TeamCard from "@/components/TeamCard";
import TargetCursor from "@/components/TargetCursor";

/* ============================================================
   TEAM PAGE — Premium Editorial Hierarchy

   President (1) centered at top.
   Heads (6) in a centered row.
   Deputies (14) in a centered grid.
   Toggle button to invert cursor color.
   Cards open flaps on scroll.
   ============================================================ */

const PRESIDENT = {
  name: "Aarav Sharma",
  role: "President",
  photo: "https://i.pravatar.cc/400?img=13",
};

const HEADS = [
  { name: "Meera Iyer", role: "Technical Head", photo: "https://i.pravatar.cc/400?img=32" },
  { name: "Karthik Raj", role: "Design Head", photo: "https://i.pravatar.cc/400?img=15" },
  { name: "Sanjana Nair", role: "Operations Head", photo: "https://i.pravatar.cc/400?img=48" },
  { name: "Rohan Patel", role: "Outreach Head", photo: "https://i.pravatar.cc/400?img=53" },
  { name: "Meera Rajan", role: "Content Head", photo: "https://i.pravatar.cc/400?img=44" },
  { name: "Arjun Menon", role: "Logistics Head", photo: "https://i.pravatar.cc/400?img=59" },
];

const DEPUTIES = [
  { name: "Priya Verma", role: "Technical Deputy", photo: "https://i.pravatar.cc/400?img=23" },
  { name: "Vikram Singh", role: "Design Deputy", photo: "https://i.pravatar.cc/400?img=33" },
  { name: "Ananya Reddy", role: "Outreach Deputy", photo: "https://i.pravatar.cc/400?img=25" },
  { name: "Rahul Krishnan", role: "Operations Deputy", photo: "https://i.pravatar.cc/400?img=51" },
  { name: "Nisha Gupta", role: "Content Deputy", photo: "https://i.pravatar.cc/400?img=28" },
  { name: "Aditya Rao", role: "Technical Deputy", photo: "https://i.pravatar.cc/400?img=60" },
  { name: "Kavya Pillai", role: "Design Deputy", photo: "https://i.pravatar.cc/400?img=36" },
  { name: "Siddharth Nair", role: "Outreach Deputy", photo: "https://i.pravatar.cc/400?img=57" },
  { name: "Tanvi Sharma", role: "Operations Deputy", photo: "https://i.pravatar.cc/400?img=41" },
  { name: "Ravi Kumar", role: "Content Deputy", photo: "https://i.pravatar.cc/400?img=64" },
  { name: "Divya Iyer", role: "Technical Deputy", photo: "https://i.pravatar.cc/400?img=45" },
  { name: "Nikhil Das", role: "Design Deputy", photo: "https://i.pravatar.cc/400?img=68" },
  { name: "Sneha Menon", role: "Outreach Deputy", photo: "https://i.pravatar.cc/400?img=47" },
  { name: "Karthik Iyer", role: "Operations Deputy", photo: "https://i.pravatar.cc/400?img=55" },
];

/* ── Scroll reveal hook: returns visibility + autoOpen state ── */
function useScrollReveal(count: number) {
  const [visible, setVisible] = useState<boolean[]>(new Array(count).fill(false));
  const [autoOpened, setAutoOpened] = useState<boolean[]>(new Array(count).fill(false));
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-idx"));
            const row = Math.floor(idx / 3);
            const col = idx % 3;
            const delay = row * 80 + col * 120;

            // Reveal card
            setTimeout(() => {
              setVisible((prev) => {
                const next = [...prev];
                next[idx] = true;
                return next;
              });
            }, delay);

            // Auto-open flaps after card is revealed
            setTimeout(() => {
              setAutoOpened((prev) => {
                const next = [...prev];
                next[idx] = true;
                return next;
              });
            }, delay + 600);

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    refs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [count]);

  return { visible, autoOpened, refs };
}

/* ── Section Label — big, editorial ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        textAlign: "center",
        marginBottom: 48,
        marginTop: 16,
      }}
    >
      <p
        style={{
          fontFamily: "'Kenfolg', 'Syne', sans-serif",
          fontSize: "clamp(28px, 4vw, 44px)",
          fontWeight: 400,
          letterSpacing: "-0.01em",
          color: "var(--on-surface, #1a1b22)",
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {children}
      </p>
      <div
        style={{
          width: 40,
          height: 1,
          background: "var(--outline-variant, #c7c6cb)",
          margin: "14px auto 0",
        }}
      />
    </div>
  );
}

export default function TeamPage() {
  const [inverted, setInverted] = useState(false);
  const toggleCursor = useCallback(() => setInverted((v) => !v), []);

  const headCount = HEADS.length;
  const depCount = DEPUTIES.length;

  const presVis = useScrollReveal(1);
  const headVis = useScrollReveal(headCount);
  const depVis = useScrollReveal(depCount);

  const cursorColor = inverted ? "#ffffff" : "#1a1b22";

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
        aria-label="Toggle cursor color"
        style={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 200,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: inverted ? "#1a1b22" : "var(--on-surface, #1a1b22)",
          background: inverted ? "rgba(255,255,255,0.9)" : "var(--surface-container-lowest, #fff)",
          border: `1px solid ${inverted ? "rgba(0,0,0,0.15)" : "var(--outline-variant, #c7c6cb)"}`,
          padding: "10px 24px",
          borderRadius: 999,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)",
          transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
          backdropFilter: "blur(12px)",
        }}
      >
        {inverted ? "◉ Light Cursor" : "○ Dark Cursor"}
      </button>

      <div
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
          {/* ── President ── */}
          <SectionLabel>President</SectionLabel>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 100,
            }}
          >
            <div
              ref={(el) => { presVis.refs.current[0] = el; }}
              data-idx={0}
              style={{
                opacity: presVis.visible[0] ? 1 : 0,
                transform: presVis.visible[0] ? "translateY(0)" : "translateY(32px)",
                transition: "opacity 0.9s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)",
                width: 280,
              }}
            >
              <TeamCard
                name={PRESIDENT.name}
                role={PRESIDENT.role}
                photo={PRESIDENT.photo}
                index={1}
                size="large"
                autoOpen={presVis.autoOpened[0]}
              />
            </div>
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
            {HEADS.map((member, i) => (
              <div
                key={member.name}
                ref={(el) => { headVis.refs.current[i] = el; }}
                data-idx={i}
                style={{
                  opacity: headVis.visible[i] ? 1 : 0,
                  transform: headVis.visible[i] ? "translateY(0)" : "translateY(28px)",
                  transition: "opacity 0.85s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.85s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  width: 240,
                }}
              >
                <TeamCard
                  name={member.name}
                  role={member.role}
                  photo={member.photo}
                  index={i + 2}
                  size="medium"
                  autoOpen={headVis.autoOpened[i]}
                />
              </div>
            ))}
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
            {DEPUTIES.map((member, i) => (
              <div
                key={member.name}
                ref={(el) => { depVis.refs.current[i] = el; }}
                data-idx={i}
                style={{
                  opacity: depVis.visible[i] ? 1 : 0,
                  transform: depVis.visible[i] ? "translateY(0)" : "translateY(24px)",
                  transition: "opacity 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  width: "100%",
                  maxWidth: 220,
                }}
              >
                <TeamCard
                  name={member.name}
                  role={member.role}
                  photo={member.photo}
                  index={i + headCount + 2}
                  size="small"
                  autoOpen={depVis.autoOpened[i]}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
