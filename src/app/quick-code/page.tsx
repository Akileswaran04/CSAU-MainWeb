"use client";

import Link from "next/link";
import { ProbeMark } from "@/components/SpaceOrnaments";
import { ARENA_CSS, QUICK_CODE_CSS } from "../arena-css";

/* ============================================================
   QUICK CODE - 5 Questions. 5 Minutes. One Chance.

   The hero is a lightweight radar treatment (slow range rings) laid
   over the shared SpaceBackdrop, so the page needs no second WebGL
   context.

   The page describes the format only. There is no round data in
   the CMS yet, so it shows no challenge, participant count or
   leaderboard - nothing here is invented.

   Route: /quick-code
   ============================================================ */

const STATS = [
  { value: "05", label: "QUESTIONS" },
  { value: "05:00", label: "ON THE CLOCK" },
  { value: "500", label: "MAX POINTS" },
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
            Logic meets speed. A five-minute assessment format: five
            questions, one timed run.
          </p>

          {/* CTA row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 42, justifyContent: "flex-start" }}>
            <Link href="/events" data-route-load className="pa-btn pa-btn-primary" style={{ padding: "14px 26px" }}>
              SEE EVENTS →
            </Link>
            <Link href="#current-challenge" className="pa-btn" style={{ padding: "14px 26px" }}>
              ROUND STATUS
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
            ROUND STATUS
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
                    STATUS
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
                  No round open
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
                  There is no Quick Code round running right now. The
                  club&apos;s events are listed on the Events page.
                </p>
              </div>

              <div style={{ minWidth: 200 }}>
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    ["05 QUESTIONS", "5 × 100 pts"],
                    ["05:00 DURATION", "one timed run"],
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

                <Link href="/events" data-route-load className="pa-btn pa-btn-primary" style={{ marginTop: 26 }}>
                  SEE EVENTS →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
