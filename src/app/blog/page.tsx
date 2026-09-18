"use client";

import { useState } from "react";
import Link from "next/link";
import { RippleRule, KoiMark, LilyPad, POND_PANEL_CSS } from "@/components/PondOrnaments";

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
    title: "Quick Code Week 12 results are live",
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
      "Why the site now reads like a printed index — the paper palette, the hairline grid and the type system behind every page.",
  },
];

export default function BlogPage() {
  const [selectedKind, setSelectedKind] = useState<"ALL" | "BLOG" | "ARTICLE" | "POST">("ALL");

  const filtered = selectedKind === "ALL"
    ? POSTS
    : POSTS.filter((p) => p.kind === selectedKind);

  const kindTabs: ("ALL" | "BLOG" | "ARTICLE" | "POST")[] = ["ALL", "BLOG", "ARTICLE", "POST"];

  return (
    <main style={{ background: "transparent", minHeight: "100vh", padding: "18vh 6% 10vh" }}>
      <style>{POND_PANEL_CSS}</style>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Header */}
        <div className="eyebrow">02 — WRITING</div>
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
          className="measure"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(14px, 1.6vw, 18px)",
            color: "var(--on-surface-variant)",
            lineHeight: 1.75,
            margin: "20px 0 0",
          }}
        >
          Long-form blogs, technical articles and quick posts — written by
          the members, for everyone who codes.
        </p>

        <div style={{ margin: "30px 0 0", display: "flex", alignItems: "center", gap: 14 }}>
          <RippleRule />
          <KoiMark size={34} flip />
        </div>

        {/* Article nav — kind tabs */}
        <nav
          aria-label="Article kinds"
          className="tabs"
          style={{ marginTop: 22, marginBottom: 22 }}
        >
          {kindTabs.map((k) => (
            <button
              key={k}
              className="tab"
              onClick={() => setSelectedKind(k)}
              aria-pressed={selectedKind === k}
            >
              {k}
            </button>
          ))}
        </nav>

        {/* Counts */}
        <div className="eyebrow tabular" style={{ marginBottom: 22, display: "flex", alignItems: "center", gap: 8 }}>
          <LilyPad />
          {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
        </div>

        {/* Posts */}
        <div style={{ display: "grid", gap: 16 }}>
          {filtered.map((post) => (
            <article
              key={post.title}
              className="pond-panel"
              style={{
                padding: "24px 28px",
                display: "flex",
                flexWrap: "wrap",
                gap: "10px 24px",
                alignItems: "baseline",
              }}
            >
              <span
                className={post.kind === "ARTICLE" ? "chip chip-signal" : "chip"}
                style={{ minWidth: 74, justifyContent: "center" }}
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
                    maxWidth: "var(--measure)",
                  }}
                >
                  {post.blurb}
                </p>
              </div>

              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10.5,
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

        <div style={{ marginTop: 52 }}>
          <Link href="/crackit" data-route-load className="btn btn-primary">
            JOIN A CODING ROUND →
          </Link>
        </div>
      </div>
    </main>
  );
}
