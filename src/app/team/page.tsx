"use client";

import TeamCarousel from "@/components/TeamCarousel";
import { FEATURED, DEPUTIES, initials } from "./members";

/* ============================================================
   TEAM PAGE - Full-circle carousel + deputy grid

   • Pinned Three.js stage: the featured members (Presidents +
     Heads) spin around a full circle - role on the left,
     name / dept / links on the right, vertical CSAU wordmark
     standing at the centre of the ring.
   • Below the carousel: the deputies in a clean editorial grid.
   ============================================================ */

export default function TeamPage() {
  return (
    <div style={{ background: "transparent" }}>
      {/* ── Full-circle member carousel ── */}
      <TeamCarousel members={FEATURED} />

      {/* ── Deputies grid ── */}
      <section style={{ padding: "10vh 6% 12vh" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="eyebrow">SUPPORT CREW</div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
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
              fontFamily: "var(--font-mono)",
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
              <article
                key={m.name}
                className="clay-card card-photo"
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
                    aspectRatio: "4 / 5",
                    background: "var(--surface-container-high)",
                    borderBottom: "1px solid var(--outline-variant)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.photo}
                    alt={m.name}
                    loading="lazy"
                    className="photo-mono"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      left: 10,
                      top: 10,
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: ".16em",
                      color: "var(--background)",
                      background: "var(--signal)",
                      borderRadius: 2,
                      padding: "3px 7px",
                    }}
                  >
                    {initials(m.name)}
                  </span>
                </div>
                <div style={{ padding: "16px 18px 18px" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 22,
                      color: "var(--on-surface)",
                      lineHeight: 1.15,
                    }}
                  >
                    {m.name}
                  </div>
                  <div
                    style={{
                      width: 28,
                      height: 2,
                      background: "var(--signal)",
                      margin: "10px 0 8px",
                    }}
                  />
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: ".14em",
                      textTransform: "uppercase",
                      color: "var(--on-surface)",
                    }}
                  >
                    {m.role}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11.5,
                      color: "var(--on-surface-variant)",
                      marginTop: 4,
                    }}
                  >
                    {m.dept}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}