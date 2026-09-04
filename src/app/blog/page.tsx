"use client";

import { useState } from "react";
import Link from "next/link";

/* ============================================================
   BLOG — Blogs, Articles & Posts
   Route: /blog
   ============================================================ */

interface Post {
  kind: "BLOG" | "ARTICLE" | "POST";
  title: string;
  author: string;
  date: string;
  read: string;
  blurb: string;
}

const POSTS: Post[] = [
  {
    kind: "BLOG",
    title: "Life inside CSAU: a week of builds",
    author: "Aarav Sharma",
    date: "28 AUG 2026",
    read: "6 MIN",
    blurb:
      "From the Wednesday code-battle to a surprise design sprint — what a normal week looks like for the society.",
  },
  {
    kind: "ARTICLE",
    title: "Binary search, explained without the maths",
    author: "Meera Iyer",
    date: "21 AUG 2026",
    read: "8 MIN",
    blurb:
      "Halve, compare, repeat. A practical walkthrough of binary search with real interview twists and edge cases.",
  },
  {
    kind: "POST",
    title: "Quick Code Week 12 results are live ⚡",
    author: "CSAU Core",
    date: "19 AUG 2026",
    read: "1 MIN",
    blurb:
      "Arjun takes the crown with a perfect 500 in 02:18. Full leaderboard and question review on the Quick Code hub.",
  },
  {
    kind: "BLOG",
    title: "What HackCEG 6.0 taught our organising team",
    author: "Rohan Patel",
    date: "12 AUG 2026",
    read: "7 MIN",
    blurb:
      "Sleep is overrated, backups are not — lessons from shipping a 36-hour hackathon for 400+ hackers.",
  },
  {
    kind: "ARTICLE",
    title: "Your first shader: a gentle WebGL intro",
    author: "Sanjana Nair",
    date: "05 AUG 2026",
    read: "10 MIN",
    blurb:
      "GLSL for beginners — vertex and fragment stages, uniforms, and how the laser fields on this site actually work.",
  },
  {
    kind: "POST",
    title: "CRACKIT Round 24 · Binary Blast results",
    author: "CSAU Core",
    date: "01 AUG 2026",
    read: "1 MIN",
    blurb:
      "Akil tops the board with a clean 500. The question archive is updated — go sharpen yourself for Round 25.",
  },
  {
    kind: "ARTICLE",
    title: "Queues are everywhere",
    author: "Priya Verma",
    date: "26 JUL 2026",
    read: "6 MIN",
    blurb:
      "Printers, message brokers, CPU scheduling — once you learn to spot FIFO, you never unsee it.",
  },
  {
    kind: "BLOG",
    title: "Designing for a campus of coders",
    author: "Karthik Raj",
    date: "18 JUL 2026",
    read: "5 MIN",
    blurb:
      "Why we moved the site to a clay, sculptural theme — and the typography system behind every page you're reading.",
  },
];

const kindColor: Record<Post["kind"], string> = {
  BLOG: "var(--on-surface)",
  ARTICLE: "var(--primary)",
  POST: "var(--secondary)",
};

export default function BlogPage() {
  const [selectedKind, setSelectedKind] = useState<"ALL" | "BLOG" | "ARTICLE" | "POST">("ALL");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const filtered = selectedKind === "ALL"
    ? POSTS
    : POSTS.filter((p) => p.kind === selectedKind);

  const kindTabs: ("ALL" | "BLOG" | "ARTICLE" | "POST")[] = ["ALL", "BLOG", "ARTICLE", "POST"];

  return (
    <main style={{ background: "var(--background)", minHeight: "100vh", padding: "18vh 6% 10vh" }}>
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
          {"// THOUGHTS FROM THE SOCIETY"}
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
          BLOG
        </h1>
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(14px, 1.6vw, 18px)",
            color: "var(--on-surface-variant)",
            lineHeight: 1.8,
            maxWidth: 600,
            margin: "20px 0 0",
          }}
        >
          Long-form blogs, technical articles and quick posts — written by
          the members, for everyone who codes.
        </p>

        {/* Article nav — kind tabs */}
        <nav
          aria-label="Article kinds"
          style={{
            display: "flex",
            gap: 8,
            marginTop: 34,
            marginBottom: 26,
          }}
        >
          {kindTabs.map((k) => (
            <button
              key={k}
              onClick={() => setSelectedKind(k)}
              aria-pressed={selectedKind === k}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: ".2em",
                textTransform: "uppercase",
                border: "1px solid",
                borderColor: selectedKind === k ? "var(--primary-container)" : "var(--outline-variant)",
                color: selectedKind === k ? "var(--on-surface)" : "var(--outline)",
                background: selectedKind === k ? "var(--surface-container-lowest)" : "transparent",
                padding: "8px 16px",
                borderRadius: 999,
                cursor: "pointer",
                transition: "border-color .25s, color .25s, background .25s",
                boxShadow: selectedKind === k
                  ? "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)"
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (selectedKind !== k) {
                  e.currentTarget.style.borderColor = "var(--outline)";
                  e.currentTarget.style.color = "var(--on-surface)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedKind !== k) {
                  e.currentTarget.style.borderColor = "var(--outline-variant)";
                  e.currentTarget.style.color = "var(--outline)";
                }
              }}
            >
              {k}
            </button>
          ))}
        </nav>

        {/* Counts */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: ".2em",
            color: "var(--outline)",
            textTransform: "uppercase",
            marginBottom: 26,
          }}
        >
          {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
        </div>

        {/* Posts */}
        <div style={{ display: "grid", gap: 16 }}>
          {filtered.map((post, idx) => (
            <article
              key={post.title}
              className="clay-card"
              style={{
                padding: "24px 28px",
                display: "flex",
                flexWrap: "wrap",
                gap: "10px 24px",
                alignItems: "baseline",
                opacity: hoveredIdx === idx ? 1 : 0.85,
                transform: hoveredIdx === idx ? "translateY(-2px)" : "translateY(0)",
                transition: "opacity .3s ease, transform .3s ease, box-shadow .3s ease",
                boxShadow: hoveredIdx === idx ? "var(--clay-shadow-xl)" : "var(--clay-shadow-md)",
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: ".2em",
                  fontWeight: 600,
                  color: kindColor[post.kind],
                  minWidth: 62,
                  textTransform: "uppercase",
                }}
              >
                {post.kind}
              </span>

              <div style={{ flex: "1 1 380px" }}>
                <h2
                  style={{
                    fontFamily: "'Kenfolg', 'Syne', sans-serif",
                    fontWeight: 400,
                    fontSize: "clamp(21px, 2.4vw, 29px)",
                    color: "var(--on-surface)",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {post.title}
                </h2>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 13.5,
                    lineHeight: 1.7,
                    color: "var(--on-surface-variant)",
                    margin: "8px 0 0",
                    maxWidth: 640,
                  }}
                >
                  {post.blurb}
                </p>
              </div>

              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9.5,
                  letterSpacing: ".12em",
                  color: "var(--outline)",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  marginLeft: "auto",
                }}
              >
                <div>{post.author}</div>
                <div style={{ marginTop: 4 }}>
                  {post.date} · {post.read} READ
                </div>
              </div>
            </article>
          ))}
        </div>

        <div style={{ marginTop: 52, textAlign: "center" }}>
          <Link
            href="/crackit"
            data-route-load
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
            JOIN A CODING ROUND →
          </Link>
        </div>
      </div>
    </main>
  );
}
