"use client";

import Link from "next/link";
import { ProbeMark, NodeMark } from "@/components/SpaceOrnaments";
import { ARENA_CSS, QUICK_CODE_CSS } from "../arena-css";

/* ============================================================
   QUICK CODE - 5 Questions. 5 Minutes. One Chance.

   The hero is a lightweight radar treatment (slow range rings) laid
   over the shared SpaceBackdrop, so the page needs no second WebGL
   context.

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
    <>
      <style>{ARENA_CSS + QUICK_CODE_CSS}</style>

      {/* ── HERO: radar rings over the star field ── */}
      <section
        data-qc-hero
        style={{
          position: "relative",
          minHeight: "100dvh",
          width: "100%",
          overflow: "hidden",
          background: "transparent",
        }}
      >
        <div className="qc-field" aria-hidden>
          <svg className="qc-rings" viewBox="0 0 1100 260" fill="none" stroke="var(--dim-300)" strokeWidth="1.2">
            <ellipse cx="550" cy="130" rx="520" ry="120" />
            <ellipse cx="550" cy="130" rx="520" ry="120" />
            <ellipse cx="550" cy="130" rx="520" ry="120" />
          </svg>
        </div>

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            textAlign: "left",
            padding: "clamp(96px, 16vh, 160px) var(--pg-x) 64px",
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 22 }}>
            Competitive arena
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(32px, 8vw, 112px)",
              letterSpacing: ".01em",
              lineHeight: 1,
              color: "var(--on-surface)",
              margin: 0,
              overflowWrap: "anywhere",
            }}
          >
            QUICK CODE
          </h1>

          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(20px, 3vw, 38px)",
              fontWeight: 400,
              color: "var(--on-surface)",
              marginTop: 22,
              lineHeight: 1.2,
            }}
          >
            5 Questions. 5 Minutes. One Chance.
          </div>

          <p
            className="measure"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(16px, 1.5vw, 18px)",
              lineHeight: 1.7,
              color: "var(--on-surface-variant)",
              margin: "22px 0 0",
            }}
          >
            Logic meets speed. Concepts meet challenges. A recurring
            5-minute competitive assessment - scored instantly, archived forever.
          </p>

          {/* CTA row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 42, justifyContent: "flex-start" }}>
            <Link href="#current-challenge" className="pa-btn pa-btn-primary" style={{ padding: "14px 26px" }}>
              START THIS WEEK →
            </Link>
            <Link href="#leaderboard" className="pa-btn" style={{ padding: "14px 26px" }}>
              VIEW LEADERBOARD
            </Link>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px 44px",
              justifyContent: "flex-start",
              marginTop: 54,
            }}
          >
            {STATS.map((s) => (
              <div key={s.label} style={{ textAlign: "left" }}>
                <div
                  className="tabular"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "clamp(18px, 2.4vw, 26px)",
                    fontWeight: 500,
                    color: "var(--lit)",
                    letterSpacing: ".04em",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: ".2em",
                    color: "var(--on-surface-variant)",
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
          background: "transparent",
          padding: "10vh 6%",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(28px, 4.6vw, 54px)",
              color: "var(--on-surface)",
              margin: "14px 0 34px",
              lineHeight: 1.1,
            }}
          >
            THIS WEEK&apos;S CHALLENGE
          </h2>

          <div className="pa-panel" style={{ padding: "clamp(22px, 4vw, 52px)" }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: 26,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      letterSpacing: ".3em",
                      color: "var(--outline)",
                    }}
                  >
                    WEEK 12
                  </span>
                  <ProbeMark size={34} />
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
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
                    fontFamily: "var(--font-mono)",
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: "var(--on-surface-variant)",
                    maxWidth: "var(--measure)",
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
                          fontFamily: "var(--font-mono)",
                          fontSize: 15,
                          fontWeight: 500,
                          color: "var(--on-surface)",
                        }}
                      >
                        {top}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          letterSpacing: ".14em",
                          color: "var(--outline)",
                          textTransform: "uppercase",
                        }}
                      >
                        {sub}
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" className="pa-btn pa-btn-primary" style={{ marginTop: 26 }}>
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
          background: "transparent",
          padding: "9vh 6%",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(28px, 4.6vw, 54px)",
              color: "var(--on-surface)",
              margin: "14px 0 10px",
              lineHeight: 1.1,
            }}
          >
            TOP QUICKCODERS
          </h2>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              color: "var(--on-surface-variant)",
              margin: "0 0 34px",
            }}
          >
            Who&apos;s the fastest quickcoder this week?
          </p>

          {/* A real table so the columns announce themselves. The
              ranking is fixed, so the sort order is declared rather
              than left implicit. */}
          <div className="pa-table-wrap" tabIndex={0} role="region" aria-label="Leaderboard">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Quickcoder</th>
                  <th scope="col" className="num" aria-sort="descending">Score</th>
                  <th scope="col" className="num">Time</th>
                </tr>
              </thead>
              <tbody>
                {LEADERS.map((row) => (
                  <tr key={row.rank} data-current={row.rank <= 3 ? "true" : undefined}>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 14,
                        color: row.rank === 1 ? "var(--lit)" : row.rank <= 3 ? "var(--on-surface)" : "var(--outline)",
                      }}
                    >
                      #{row.rank}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 14, color: "var(--on-surface)" }}>
                      {row.name}
                    </td>
                    <td className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--on-surface)" }}>
                      {row.score} pts
                    </td>
                    <td className="num" style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                      {row.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── PREVIOUS CHALLENGES ── */}
      <section style={{ background: "transparent", padding: "9vh 6% 12vh" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(28px, 4.6vw, 54px)",
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
                className="pa-panel"
                style={{ padding: "22px clamp(18px, 3vw, 30px)", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <span style={{ paddingTop: 5 }}><NodeMark size={18} /></span>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        letterSpacing: ".26em",
                        color: "var(--outline)",
                      }}
                    >
                      {ch.week}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
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
                        fontFamily: "var(--font-mono)",
                        fontSize: 12.5,
                        color: "var(--on-surface-variant)",
                        marginTop: 4,
                      }}
                    >
                      {ch.meta}
                    </div>
                  </div>
                </div>
                <button type="button" className="pa-btn">
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
