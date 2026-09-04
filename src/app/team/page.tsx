"use client";

import TeamCarousel from "@/components/TeamCarousel";
import { FEATURED, DEPUTIES, initials } from "./members";

/* ============================================================
   TEAM PAGE — Full-circle carousel + deputy grid

   • Pinned Three.js stage: the featured members (Presidents +
     Heads) spin around a full circle — role on the left,
     name / dept / links on the right, vertical CSAU wordmark
     standing at the centre of the ring.
   • Below the carousel: the deputies in a clean editorial grid.
   ============================================================ */

export default function TeamPage() {
  return (
    <div style={{ background: "var(--background)" }}>
      {/* ── Full-circle member carousel ── */}
      <TeamCarousel members={FEATURED} />

      {/* ── Deputies grid ── */}
      <section style={{ padding: "10vh 6% 12vh" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: ".34em",
              color: "var(--outline)",
              textTransform: "uppercase",
            }}
          >
            {"// SUPPORT CREW"}
          </div>
          <h2
            style={{
              fontFamily: "'Kenfolg', 'Syne', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(30px, 4.6vw, 54px)",
              color: "var(--on-surface)",
              margin: "12px 0 6px",
              lineHeight: 1.1,
            }}
          >
            DEPUTIES
          </h2>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14,
              color: "var(--on-surface-variant)",
              margin: "0 0 40px",
              maxWidth: 560,
            }}
          >
            The crew that keeps every build, event and round running.
          </p>

          <div
            data-deputies-grid
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))",
              gap: 18,
            }}
          >
            {DEPUTIES.map((m) => (
              <div
                key={m.name}
                className="clay-card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "4 / 3",
                    background:
                      "linear-gradient(135deg, var(--surface-container) 0%, var(--surface-container-high) 100%)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.photo}
                    alt={m.name}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "grayscale(.4)",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 12,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: ".2em",
                      color: "var(--on-primary)",
                      background: "var(--primary-container)",
                      borderRadius: 999,
                      padding: "5px 12px",
                      backdropFilter: "blur(6px)",
                      WebkitBackdropFilter: "blur(6px)",
                    }}
                  >
                    {initials(m.name)}
                  </span>
                </div>
                <div style={{ padding: "18px 20px 20px" }}>
                  <div
                    style={{
                      fontFamily: "'CremeEspana', 'Syne', sans-serif",
                      fontSize: 22,
                      color: "var(--on-surface)",
                      lineHeight: 1.15,
                    }}
                  >
                    {m.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: ".16em",
                      textTransform: "uppercase",
                      color: "var(--primary)",
                      marginTop: 6,
                    }}
                  >
                    {m.role}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 11.5,
                      color: "var(--on-surface-variant)",
                      marginTop: 4,
                    }}
                  >
                    {m.dept}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}