"use client";

import { useRef, useEffect, useState } from "react";
import TeamCard from "@/components/TeamCard";
import TargetCursor from "@/components/TargetCursor";

/* ============================================================
   TEAM PAGE — Premium Editorial Hierarchy

   President (1) centered at top.
   Heads (6) in a centered row.
   Deputies (14) in a centered grid.
   No header. No footer. No hero.
   ============================================================ */

const PRESIDENT = {
  name: "Aarav Sharma",
  role: "President",
  photo: "https://i.pravatar.cc/400?img=13",
};

const HEADS = [
  { name: "Meera Iyer", role: "Vice President", photo: "https://i.pravatar.cc/400?img=32" },
  { name: "Karthik Raj", role: "Technical Head", photo: "https://i.pravatar.cc/400?img=15" },
  { name: "Sanjana Nair", role: "Design Head", photo: "https://i.pravatar.cc/400?img=48" },
  { name: "Rohan Patel", role: "Operations Head", photo: "https://i.pravatar.cc/400?img=53" },
  { name: "Meera Rajan", role: "Outreach Head", photo: "https://i.pravatar.cc/400?img=44" },
  { name: "Arjun Menon", role: "Content Head", photo: "https://i.pravatar.cc/400?img=59" },
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

function useScrollReveal(count: number) {
  const [visible, setVisible] = useState<boolean[]>(new Array(count).fill(false));
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-idx"));
            setTimeout(() => {
              setVisible((prev) => {
                const next = [...prev];
                next[idx] = true;
                return next;
              });
            }, idx * 100);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );
    refs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [count]);

  return { visible, refs };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "var(--outline, #77767b)",
        textAlign: "center",
        marginBottom: 32,
      }}
    >
      {children}
    </p>
  );
}

export default function TeamPage() {
  const presCount = 1;
  const headCount = HEADS.length;
  const depCount = DEPUTIES.length;

  const presVis = useScrollReveal(presCount);
  const headVis = useScrollReveal(headCount);
  const depVis = useScrollReveal(depCount);

  return (
    <>
      <TargetCursor
        targetSelector=".cursor-target"
        spinDuration={2.5}
        hideDefaultCursor={true}
        parallaxOn={true}
        hoverDuration={0.25}
        cursorColor="#1a1b22"
        cursorColorOnTarget="#1a1b22"
      />
      <div
        className="min-h-screen"
        style={{
          background: "var(--background)",
          paddingTop: "12vh",
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
              marginBottom: 80,
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
              marginBottom: 80,
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
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
