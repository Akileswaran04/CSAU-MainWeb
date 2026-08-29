"use client";

import { useRef, useEffect, useState } from "react";
import TeamCard from "@/components/TeamCard";

/* ============================================================
   TEAM PAGE — Premium Editorial / Luxury Studio

   No header. No footer. No hero. No extra sections.
   Just the3-column grid with large white negative space,
   dark embossed cards, and cinematic scroll animations.
   ============================================================ */

const TEAM = [
  { name: "Aarav Sharma", role: "Backend Engineer", photo: "https://i.pravatar.cc/400?img=13" },
  { name: "Meera Iyer", role: "Product Design", photo: "https://i.pravatar.cc/400?img=32" },
  { name: "Karthik Raj", role: "Frontend Engineer", photo: "https://i.pravatar.cc/400?img=15" },
  { name: "Sanjana Nair", role: "ML Research", photo: "https://i.pravatar.cc/400?img=48" },
  { name: "Rohan Patel", role: "DevOps Lead", photo: "https://i.pravatar.cc/400?img=53" },
  { name: "Meera Rajan", role: "Outreach Lead", photo: "https://i.pravatar.cc/400?img=44" },
];

export default function TeamPage() {
  const [visible, setVisible] = useState<boolean[]>(new Array(TEAM.length).fill(false));
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-idx"));
            // Stagger within the row: cards in the same row get sequential delays
            const row = Math.floor(idx / 3);
            const col = idx % 3;
            const baseDelay = row * 80; // row stagger
            const colDelay = col * 120; // column stagger within row

            setTimeout(() => {
              setVisible((prev) => {
                const next = [...prev];
                next[idx] = true;
                return next;
              });
            }, baseDelay + colDelay);

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    refs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--background)",
        paddingTop: "14vh",
        paddingBottom: "14vh",
      }}
    >
      <div
        className="mx-auto px-6 sm:px-10 lg:px-16"
        style={{ maxWidth: 1100 }}
      >
        <div
          className="grid gap-y-20 gap-x-10"
          style={{
            gridTemplateColumns: "repeat(3, 1fr)",
          }}
        >
          {TEAM.map((member, i) => {
            const isVisible = visible[i];
            return (
              <div
                key={member.name}
                ref={(el) => { refs.current[i] = el; }}
                data-idx={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(32px)",
                  transition: "opacity 0.9s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
              >
                {/* Card appears first */}
                <div
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(20px)",
                    transition: "opacity 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s, transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s",
                    width: "100%",
                  }}
                >
                  <TeamCard
                    name={member.name}
                    role={member.role}
                    photo={member.photo}
                    index={i + 1}
                  />
                </div>

                {/* Name and role appear slightly later */}
                <div
                  style={{
                    textAlign: "center",
                    marginTop: 20,
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(12px)",
                    transition: "opacity 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.35s, transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.35s",
                    width: "100%",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'CremeEspana', cursive",
                      color: "var(--on-surface, #1a1b22)",
                      fontSize: 22,
                      fontWeight: 400,
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {member.name}
                  </p>
                  <p
                    style={{
                      color: "var(--outline, #77767b)",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      margin: "6px 0 0",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {member.role}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
