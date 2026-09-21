"use client";

import { useState } from "react";
import Link from "next/link";

/* ============================================================
   BLOG - blogs, articles and posts.
   The newest piece leads as a feature; the rest are ruled rows
   (kind and date, then title and blurb, then author).
   Route: /blog
   ============================================================ */

type Kind = "BLOG" | "ARTICLE" | "POST";

interface Post {
  kind: Kind;
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
    blurb: "From the Wednesday code-battle to a surprise design sprint - what a normal week looks like for the society.",
  },
  {
    kind: "ARTICLE",
    title: "Binary search, explained without the maths",
    author: "Meera Iyer",
    date: "21 AUG 2026",
    read: "8 MIN",
    blurb: "Halve, compare, repeat. A practical walkthrough of binary search with real interview twists and edge cases.",
  },
  {
    kind: "POST",
    title: "Quick Code Week 12 results are live",
    author: "CSAU Core",
    date: "19 AUG 2026",
    read: "1 MIN",
    blurb: "Arjun takes the crown with a perfect 500 in 02:18. Full leaderboard and question review on the Quick Code hub.",
  },
  {
    kind: "BLOG",
    title: "What HackCEG 6.0 taught our organising team",
    author: "Rohan Patel",
    date: "12 AUG 2026",
    read: "7 MIN",
    blurb: "Sleep is overrated, backups are not - lessons from shipping a 36-hour hackathon for 400+ hackers.",
  },
  {
    kind: "ARTICLE",
    title: "Your first shader: a gentle WebGL intro",
    author: "Sanjana Nair",
    date: "05 AUG 2026",
    read: "10 MIN",
    blurb: "GLSL for beginners - vertex and fragment stages, uniforms, and how the laser fields on this site actually work.",
  },
  {
    kind: "POST",
    title: "CRACKIT Round 24 · Binary Blast results",
    author: "CSAU Core",
    date: "01 AUG 2026",
    read: "1 MIN",
    blurb: "Akil tops the board with a clean 500. The question archive is updated - go sharpen yourself for Round 25.",
  },
  {
    kind: "ARTICLE",
    title: "Queues are everywhere",
    author: "Priya Verma",
    date: "26 JUL 2026",
    read: "6 MIN",
    blurb: "Printers, message brokers, CPU scheduling - once you learn to spot FIFO, you never unsee it.",
  },
  {
    kind: "BLOG",
    title: "Designing for a campus of coders",
    author: "Karthik Raj",
    date: "18 JUL 2026",
    read: "5 MIN",
    blurb:
      "Why the site now reads like a printed index - the paper palette, the hairline grid and the type system behind every page.",
  },
];

const TABS: ("ALL" | Kind)[] = ["ALL", "BLOG", "ARTICLE", "POST"];

export default function BlogPage() {
  const [kind, setKind] = useState<"ALL" | Kind>("ALL");
  const shown = kind === "ALL" ? POSTS : POSTS.filter((p) => p.kind === kind);
  const [lead, ...rest] = shown;

  return (
    <main className="pg">
      <div className="pg-in">
        <header>
          <div className="eyebrow">Writing</div>
          <h1 className="pg-title">Blog</h1>
          <p className="pg-lede">Long-form blogs, technical articles and quick posts, written by the members for everyone who codes.</p>
        </header>

        <nav aria-label="Article kinds" className="bl-tabs">
          {TABS.map((k) => (
            <button key={k} type="button" className="bl-tab" onClick={() => setKind(k)} aria-pressed={kind === k}>
              {k}
            </button>
          ))}
          <span className="bl-count tabular" aria-live="polite">
            {shown.length} {shown.length === 1 ? "piece" : "pieces"}
          </span>
        </nav>

        {lead && (
          <article className="bl-lead">
            <div className="bl-meta">
              <span className="bl-kind" data-kind={lead.kind}>
                {lead.kind}
              </span>
              <span>{lead.date}</span>
              <span>{lead.read} read</span>
            </div>
            <h2 className="bl-lead-title">{lead.title}</h2>
            <p className="bl-blurb">{lead.blurb}</p>
            <div className="bl-author">{lead.author}</div>
          </article>
        )}

        <div className="bl-list">
          {rest.map((post) => (
            <article key={post.title} className="bl-row">
              <div className="bl-meta">
                <span className="bl-kind" data-kind={post.kind}>
                  {post.kind}
                </span>
                <span>{post.date}</span>
              </div>
              <div>
                <h2 className="bl-title">{post.title}</h2>
                <p className="bl-blurb">{post.blurb}</p>
              </div>
              <div className="bl-author">
                {post.author}
                <span>{post.read} read</span>
              </div>
            </article>
          ))}
        </div>

        <p className="pg-next">
          <Link href="/crackit" data-route-load className="btn btn-primary">
            Join a coding round →
          </Link>
        </p>
      </div>
    </main>
  );
}
