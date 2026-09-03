import Link from "next/link";

/* ============================================================
   EVENTS — Archive of past events
   Route: /events
   ============================================================ */

const PAST_EVENTS = [
  {
    year: "2026",
    name: "HackCEG 6.0",
    tag: "HACKATHON",
    date: "21–22 FEB 2026",
    blurb:
      "36-hour build sprint across AI, web and systems — 400+ hackers, 60 teams shipped working products.",
    stat: "412 HACKERS",
  },
  {
    year: "2026",
    name: "Byte Me",
    tag: "CODING",
    date: "14 JAN 2026",
    blurb:
      "Speed programming contest spanning DSA, competitive math and debugging under a ticking clock.",
    stat: "286 REGISTERED",
  },
  {
    year: "2025",
    name: "Firmware Fridays",
    tag: "WORKSHOP",
    date: "OCT–DEC 2025",
    blurb:
      "Six-week embedded series — students went from blinking an LED to driving a full sensor mesh.",
    stat: "150 SEATS",
  },
  {
    year: "2025",
    name: "DevCon CEG",
    tag: "CONFERENCE",
    date: "06 SEP 2025",
    blurb:
      "Community conference on modern web and AI with speakers from Bengaluru, Chennai and remote.",
    stat: "320 ATTENDEES",
  },
  {
    year: "2025",
    name: "Socket Wars",
    tag: "COMPETITION",
    date: "23 AUG 2025",
    blurb:
      "Real-time multiplayer coding duel — the arena throws two coders into one shared socket.",
    stat: "128 PLAYERS",
  },
  {
    year: "2025",
    name: "CSAU Design Lab",
    tag: "WORKSHOP",
    date: "18 JUL 2025",
    blurb:
      "Hands-on product-design and motion workshop covering Figma, GSAP and shader fundamentals.",
    stat: "96 SEATS",
  },
  {
    year: "2024",
    name: "HackCEG 5.0",
    tag: "HACKATHON",
    date: "16–17 NOV 2024",
    blurb:
      "Flagship 36-hour hackathon — 350 participants built for healthcare, civic and climate themes.",
    stat: "350 HACKERS",
  },
  {
    year: "2024",
    name: "Intro to Compilers",
    tag: "TALK",
    date: "09 NOV 2024",
    blurb:
      "A walk through lexers, parsers and codegen — ending with everyone compiling a tiny language.",
    stat: "210 SEATS",
  },
];

export default function EventsPage() {
  return (
    <main style={{ background: "var(--background)", minHeight: "100vh", padding: "14vh 6% 10vh" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: ".34em",
            color: "var(--outline)",
            textTransform: "uppercase",
          }}
        >
          {"// WHAT WE RUN"}
        </div>
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
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(14px, 1.6vw, 18px)",
            color: "var(--on-surface-variant)",
            lineHeight: 1.8,
            maxWidth: 560,
            margin: "20px 0 0",
          }}
        >
          Hackathons, workshops, talks and competitions — every event we
          have run, archived here.
        </p>

        <div
          style={{
            width: 48,
            height: 1,
            background: "var(--outline-variant)",
            margin: "34px 0 46px",
          }}
        />

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: 22 }}>
          {PAST_EVENTS.map((ev) => (
            <article key={ev.name} className="clay-card" style={{ padding: "26px 26px 24px", display: "flex", flexDirection: "column", minHeight: 250 }}>
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
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 9,
                    letterSpacing: ".2em",
                    fontWeight: 600,
                    color: "var(--on-surface-variant)",
                    border: "1px solid var(--outline-variant)",
                    padding: "4px 10px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
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
                  color: "var(--primary)",
                  marginTop: 20,
                }}
              >
                {ev.stat}
              </div>
            </article>
          ))}
        </div>

        <div style={{ marginTop: 56, textAlign: "center" }}>
          <Link
            href="/crackit"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 11,
              letterSpacing: ".2em",
              fontWeight: 600,
              color: "var(--on-primary)",
              background: "var(--primary)",
              borderRadius: 999,
              padding: "13px 28px",
              textDecoration: "none",
              textTransform: "uppercase",
              display: "inline-block",
            }}
          >
            CURRENT CODING EVENT →
          </Link>
        </div>
      </div>
    </main>
  );
}
