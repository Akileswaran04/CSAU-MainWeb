import Link from "next/link";
import { PAST_EVENTS } from "@/data/events";
import { RippleRule, KoiMark, LilyPad, POND_PANEL_CSS } from "@/components/PondOrnaments";

/* ============================================================
   EVENTS — Archive of past events
   Route: /events
   ============================================================ */

export default function EventsPage() {
  return (
    <main style={{ background: "transparent", minHeight: "100vh", padding: "14vh 6% 10vh" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Header */}
        <div className="eyebrow">01 — WHAT WE RUN</div>
        <h1
          style={{
            fontFamily: "'Kenfolg', 'Syne', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(44px, 7.5vw, 96px)",
            color: "var(--on-surface)",
            margin: "12px 0 0",
            lineHeight: 1,
            letterSpacing: "-.02em",
          }}
        >
          EVENTS
        </h1>
        <p
          className="measure"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(14px, 1.6vw, 18px)",
            color: "var(--on-surface-variant)",
            lineHeight: 1.75,
            margin: "20px 0 0",
          }}
        >
          Hackathons, workshops, talks and competitions — every event we
          have run, archived by year.
        </p>

        <div style={{ margin: "30px 0 46px", display: "flex", alignItems: "center", gap: 14 }}>
          <RippleRule />
          <KoiMark size={34} />
        </div>

        <style>{POND_PANEL_CSS}</style>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: 22 }}>
          {PAST_EVENTS.map((ev) => (
            <article key={ev.name} className="pond-panel" style={{ padding: "26px 26px 24px", display: "flex", flexDirection: "column", minHeight: 250 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    letterSpacing: ".24em",
                    color: "var(--outline)",
                  }}
                >
                  {ev.year} · {ev.date}
                </span>
                <span className="chip">
                  <span className="chip-dot" data-state="closed" />
                  {ev.tag}
                </span>
              </div>

              <h2
                style={{
                  fontFamily: "'Kenfolg', 'Syne', sans-serif",
                  fontWeight: 400,
                  fontSize: "clamp(24px, 2.6vw, 34px)",
                  color: "var(--on-surface)",
                  margin: "18px 0 10px",
                  lineHeight: 1.1,
                }}
              >
                {ev.name}
              </h2>

              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 13.5,
                  lineHeight: 1.7,
                  color: "var(--on-surface-variant)",
                  margin: 0,
                  flex: 1,
                }}
              >
                {ev.blurb}
              </p>

              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: ".2em",
                  color: "var(--marker)",
                  marginTop: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <LilyPad />
                {ev.stat}
              </div>
            </article>
          ))}
        </div>

        <div style={{ marginTop: 56, textAlign: "center" }}>
          <Link href="/crackit" data-route-load className="btn btn-primary">
            CURRENT CODING EVENT →
          </Link>
        </div>
      </div>
    </main>
  );
}
