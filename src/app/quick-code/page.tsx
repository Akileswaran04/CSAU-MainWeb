import type { Metadata } from "next";
import Link from "next/link";
import { ARENA_CSS, QUICK_CODE_CSS } from "../arena-css";
import { QC_ABOUT, QC_WEEKS } from "@/data/quickCode";
import QuickCodeArchive from "./QuickCodeArchive";

/* ============================================================
   QUICK CODE - 5 Questions. 5 Minutes. One Chance.

   The hero is a lightweight radar treatment (slow range rings) laid
   over the shared SpaceBackdrop, so the page needs no second WebGL
   context. Below it: the five-week archive, played week by week in
   QuickCodeArchive, then the About doc + poster. All copy is from
   src/data/quickCode.ts (the archive's own documents).

   Route: /quick-code
   ============================================================ */

export const metadata: Metadata = {
  title: "Quick Code // CSAU - Computer Society of Anna University",
  description: QC_ABOUT.paragraphs[0],
};

/* from the poster: 5 MINUTES | 5 MCQ'S | 5 WEEKS */
const STATS = [
  { value: "05", label: "MINUTES" },
  { value: "05", label: "MCQ'S" },
  { value: "05", label: "WEEKS" },
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
            Weekly MCQ Challenge Series
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
            Think fast • Choose smart • Master the fundamentals
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 42, justifyContent: "flex-start" }}>
            <Link href="#archive" className="pa-btn pa-btn-primary" style={{ padding: "14px 26px" }}>
              ARCHIVE →
            </Link>
            <Link href="#about" className="pa-btn" style={{ padding: "14px 26px" }}>
              ABOUT
            </Link>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 44px", justifyContent: "flex-start", marginTop: 54 }}>
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

      {/* ── ARCHIVE: the five weeks as a console ── */}
      <section id="archive" className="qc-sec">
        <QuickCodeArchive weeks={QC_WEEKS} />
      </section>

      {/* ── ABOUT: the About doc, verbatim, beside the poster ── */}
      <section id="about" className="qc-sec">
        <div className="qc-wrap">
          <h2 className="qc-h2">ABOUT</h2>
          <div className="qc-about">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="qc-img"
              src={QC_ABOUT.poster.src}
              width={QC_ABOUT.poster.width}
              height={QC_ABOUT.poster.height}
              alt="Quick Code poster"
              loading="lazy"
              decoding="async"
            />
            <div className="qc-text">
              <span className="qc-k">{QC_ABOUT.title}</span>
              {QC_ABOUT.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
