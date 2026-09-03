"use client";

import Link from "next/link";
import { LaserCollection } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

/* ============================================================
   QUICK CODE — 5 Questions. 5 Minutes. One Chance.

   The LaserCollection "matrix-field" (Matrix Junction) scene
   fills the hero as a pointer-reactive laser field. The nav
   bar floats above it — hovering a nav item grows the line
   under the text while the junction's particles / lightning
   reach toward the cursor.

   Route: /quick-code
   ============================================================ */

const STATS = [
  { value: "05", label: "QUESTIONS" },
  { value: "05:00", label: "ON THE CLOCK" },
  { value: "500", label: "MAX POINTS" },
];

const LEADERS = [
  { rank: 1, name: "Arjun", score: 500, time: "02:18" },
  { rank: 2, name: "Akil", score: 500, time: "02:31" },
  { rank: 3, name: "Rahul", score: 400, time: "02:04" },
];

const PAST = [
  { week: "WEEK 11", name: "CODE TRAP", meta: "5 Questions · 5 Minutes · 982 Participants" },
  { week: "WEEK 10", name: "LOOP WAR", meta: "5 Questions · 5 Minutes · 1,104 Participants" },
  { week: "WEEK 09", name: "BINARY", meta: "5 Questions · 5 Minutes · 1,240 Participants" },
];

export default function QuickCodePage() {
  return (
    <>        {/* ── HERO: full-bleed Matrix Junction laser field ── */}
      <section
        data-qc-hero
        style={{
          position: "relative",
          minHeight: "100svh",
          width: "100%",
          overflow: "hidden",
          background: "var(--background)",
        }}
      >
        {/* Registered ThreeUI LaserCollection — Matrix Junction (matrix-field),
            inverted so the dark laser field reads on the white theme */}
        <div
          className="shader-frame"
          style={{
            position: "absolute",
            inset: 0,
            filter: "invert(1) grayscale(1) contrast(1.1) brightness(1.5)",
            opacity: 0.5,
          }}
        >
          <LaserCollection
            variant="matrix-field"
            speed={1.0}
            size={1.0}
            length={1.0}
            density={1.0}
            opacity={1.0}
            hue={0}
            saturation={1.0}
            brightness={1.0}
          />
        </div>

        {/* Soft white floor so content stays legible over the field */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(251,248,255,.0) 0%, rgba(251,248,255,.0) 42%, rgba(251,248,255,.86) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            minHeight: "100svh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "120px 6% 60px",
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: ".34em",
              color: "var(--outline)",
              textTransform: "uppercase",
              marginBottom: 22,
            }}
          >
            CSAU // COMPETITIVE ARENA
          </div>

          <h1
            style={{
              fontFamily: "'Ethnocentric', 'Sector034', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(42px, 8.5vw, 128px)",
              letterSpacing: ".04em",
              lineHeight: 1,
              color: "var(--on-surface)",
              margin: 0,
              textShadow: "0 0 40px rgba(26,27,34,.14)",
            }}
          >
            QUICK CODE
          </h1>

          <div
            style={{
              fontFamily: "'Kenfolg', 'Syne', sans-serif",
              fontSize: "clamp(20px, 3vw, 38px)",
              fontWeight: 400,
              color: "var(--on-surface)",
              marginTop: 26,
              lineHeight: 1.2,
            }}
          >
            5 Questions. 5 Minutes. One Chance.
          </div>

          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "clamp(14px, 1.5vw, 17px)",
              lineHeight: 1.8,
              color: "var(--on-surface-variant)",
              maxWidth: 560,
              margin: "22px auto 0",
            }}
          >
            Logic meets speed. Concepts meet challenges. A recurring
            5-minute competitive assessment — scored instantly, archived forever.
          </p>

          {/* CTA row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 42 }}>
            <Link
              href="#current-challenge"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 11,
                letterSpacing: ".2em",
                fontWeight: 600,
                color: "var(--on-primary)",
                background: "var(--primary-container)",
                padding: "14px 30px",
                borderRadius: 999,
                textDecoration: "none",
                textTransform: "uppercase",
                boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 8px 30px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.12), inset 0 -1px 0 rgba(0,0,0,.08)",
                transition: "box-shadow .3s ease, transform .3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.06), 0 16px 48px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.14), inset 0 -1px 0 rgba(0,0,0,.08)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.04), 0 8px 30px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.12), inset 0 -1px 0 rgba(0,0,0,.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              START THIS WEEK →
            </Link>
            <Link
              href="#leaderboard"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 11,
                letterSpacing: ".2em",
                fontWeight: 600,
                color: "var(--on-surface-variant)",
                background: "var(--surface-container-lowest)",
                border: "1px solid var(--outline-variant)",
                padding: "14px 30px",
                borderRadius: 999,
                textDecoration: "none",
                textTransform: "uppercase",
                boxShadow: "0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.9), inset 0 -1px 0 rgba(0,0,0,.02)",
                transition: "background-color .3s ease, color .3s ease, border-color .3s ease, box-shadow .3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-container-low)";
                e.currentTarget.style.color = "var(--on-surface)";
                e.currentTarget.style.borderColor = "var(--primary-container)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.04), 0 8px 30px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.9), inset 0 -1px 0 rgba(0,0,0,.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface-container-lowest)";
                e.currentTarget.style.color = "var(--on-surface-variant)";
                e.currentTarget.style.borderColor = "var(--outline-variant)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.9), inset 0 -1px 0 rgba(0,0,0,.02)";
              }}
            >
              VIEW LEADERBOARD
            </Link>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px 44px",
              justifyContent: "center",
              marginTop: 54,
            }}
          >
            {STATS.map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "clamp(18px, 2.4vw, 26px)",
                    fontWeight: 500,
                    color: "var(--on-surface)",
                    letterSpacing: ".04em",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 9,
                    letterSpacing: ".24em",
                    color: "var(--outline)",
                    textTransform: "uppercase",
                    marginTop: 6,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CURRENT CHALLENGE ── */}
      <section
        id="current-challenge"
        style={{
          background: "var(--background)",
          padding: "10vh 6%",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: ".32em",
              color: "var(--outline)",
              textTransform: "uppercase",
            }}
          >
            {"// CURRENT CHALLENGE"}
          </div>

          <h2
            style={{
              fontFamily: "'Kenfolg', 'Syne', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(30px, 4.6vw, 54px)",
              color: "var(--on-surface)",
              margin: "14px 0 34px",
              lineHeight: 1.1,
            }}
          >
            THIS WEEK&apos;S CHALLENGE
          </h2>

          <div className="clay-card" style={{ padding: "clamp(26px, 4vw, 52px)" }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: 26,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    letterSpacing: ".3em",
                    color: "var(--outline)",
                  }}
                >
                  WEEK 12
                </div>
                <div
                  style={{
                    fontFamily: "'Kenfolg', 'Syne', sans-serif",
                    fontSize: "clamp(30px, 4vw, 52px)",
                    fontWeight: 400,
                    color: "var(--on-surface)",
                    marginTop: 8,
                    textTransform: "uppercase",
                  }}
                >
                  Logic Rush
                </div>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 15,
                    lineHeight: 1.75,
                    color: "var(--on-surface-variant)",
                    maxWidth: 420,
                    margin: "14px 0 0",
                  }}
                >
                  Test your speed. Test your fundamentals. Five rapid
                  questions on logic, data structures and clean reasoning.
                </p>
              </div>

              <div style={{ minWidth: 200 }}>
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    ["05 QUESTIONS", "5 × 100 pts"],
                    ["05:00 DURATION", "one timed run"],
                    ["1,248", "QUICKCODERS PARTICIPATING"],
                  ].map(([top, sub]) => (
                    <div key={top}>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 15,
                          fontWeight: 500,
                          color: "var(--on-surface)",
                        }}
                      >
                        {top}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: 10,
                          letterSpacing: ".16em",
                          color: "var(--outline)",
                          textTransform: "uppercase",
                        }}
                      >
                        {sub}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 11,
                    letterSpacing: ".2em",
                    fontWeight: 600,
                    color: "var(--on-primary)",
                    background: "var(--primary)",
                    border: "none",
                    borderRadius: 999,
                    padding: "13px 26px",
                    marginTop: 26,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    transition: "box-shadow .3s ease, transform .3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 6px 22px rgba(0,0,0,.18)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  START CHALLENGE →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LEADERBOARD ── */}
      <section
        id="leaderboard"
        style={{
          background: "var(--surface-container-low)",
          padding: "9vh 6%",
          borderTop: "1px solid var(--outline-variant)",
          borderBottom: "1px solid var(--outline-variant)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: ".32em",
              color: "var(--outline)",
              textTransform: "uppercase",
            }}
          >
            {"// THIS WEEK"}
          </div>
          <h2
            style={{
              fontFamily: "'Kenfolg', 'Syne', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(30px, 4.6vw, 54px)",
              color: "var(--on-surface)",
              margin: "14px 0 10px",
              lineHeight: 1.1,
            }}
          >
            TOP QUICKCODERS
          </h2>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14,
              color: "var(--on-surface-variant)",
              margin: "0 0 34px",
            }}
          >
            Who&apos;s the fastest quickcoder this week?
          </p>

          <div
            style={{
              display: "grid",
              gap: 0,
              border: "1px solid var(--outline-variant)",
              borderRadius: "1.25rem",
              overflow: "hidden",
              background: "var(--surface-container-lowest)",
            }}
          >
            {LEADERS.map((row) => (
              <div
                key={row.rank}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr auto auto",
                  alignItems: "center",
                  gap: 18,
                  padding: "16px 22px",
                  borderBottom: "1px solid var(--outline-variant)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    color: row.rank <= 3 ? "var(--primary)" : "var(--outline)",
                  }}
                >
                  #{row.rank}
                </span>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    color: "var(--on-surface)",
                  }}
                >
                  {row.name}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    color: "var(--on-surface)",
                  }}
                >
                  {row.score} pts
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    color: "var(--outline)",
                  }}
                >
                  {row.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREVIOUS CHALLENGES ── */}
      <section style={{ background: "var(--background)", padding: "9vh 6%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: ".32em",
              color: "var(--outline)",
              textTransform: "uppercase",
            }}
          >
            {"// ARCHIVE"}
          </div>
          <h2
            style={{
              fontFamily: "'Kenfolg', 'Syne', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(30px, 4.6vw, 54px)",
              color: "var(--on-surface)",
              margin: "14px 0 34px",
              lineHeight: 1.1,
            }}
          >
            PREVIOUS CHALLENGES
          </h2>

          <div style={{ display: "grid", gap: 18 }}>
            {PAST.map((ch) => (
              <div
                key={ch.week}
                className="clay-card"
                style={{ padding: "26px 30px", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: ".26em",
                      color: "var(--outline)",
                    }}
                  >
                    {ch.week}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Kenfolg', 'Syne', sans-serif",
                      fontSize: "clamp(22px, 2.6vw, 32px)",
                      fontWeight: 400,
                      color: "var(--on-surface)",
                      textTransform: "uppercase",
                    }}
                  >
                    {ch.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 12,
                      color: "var(--on-surface-variant)",
                      marginTop: 4,
                    }}
                  >
                    {ch.meta}
                  </div>
                </div>
                <button
                  type="button"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 10,
                    letterSpacing: ".18em",
                    fontWeight: 600,
                    color: "var(--on-surface-variant)",
                    background: "var(--surface-container-lowest)",
                    border: "1px solid var(--outline-variant)",
                    borderRadius: 999,
                    padding: "10px 22px",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    transition: "color .3s ease, border-color .3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--on-surface)";
                    e.currentTarget.style.borderColor = "var(--primary-container)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--on-surface-variant)";
                    e.currentTarget.style.borderColor = "var(--outline-variant)";
                  }}
                >
                  VIEW →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
