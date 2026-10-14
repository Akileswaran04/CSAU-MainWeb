"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { TOPICS, topicsOf, type BlogPost, type Topic } from "@/lib/blog";
import { Cover, Meta, postDate } from "./parts";

/* ============================================================
   BLOG LIST - topic filter and search above, then every post as
   one ruled row (poster, date and reading time, title, excerpt,
   author) opening its reading page; pages and a year archive
   below. Posts arrive sorted newest-first from the server.
   Switching filters runs in a view transition so rows glide to
   their new places.
   ============================================================ */

const PER_PAGE = 6;

type Filters = { topic: Topic | "All"; year: number | "All"; q: string; page: number };
const NONE: Filters = { topic: "All", year: "All", q: "", page: 0 };

/** Apply a filter change inside a view transition where the browser has one. */
function glide(apply: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
  doc.startViewTransition(() => flushSync(apply));
}

export default function BlogList({ posts }: { posts: BlogPost[] }) {
  const [f, setF] = useState<Filters>(NONE);
  const listRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(
    () => posts.map((post) => ({ post, topics: topicsOf(post.categories), year: postDate(post.date)?.getUTCFullYear() })),
    [posts],
  );
  const years = useMemo(
    () => [...new Set(rows.map((r) => r.year).filter((y): y is number => y !== undefined))].sort((a, b) => b - a),
    [rows],
  );

  const q = f.q.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (f.topic === "All" || r.topics.includes(f.topic)) &&
      (f.year === "All" || r.year === f.year) &&
      (!q || `${r.post.title} ${r.post.excerpt} ${r.post.author}`.toLowerCase().includes(q)),
  );
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
  const page = Math.min(f.page, pages - 1);
  const slice = shown.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const pick = (next: Partial<Filters>) => glide(() => setF((cur) => ({ ...cur, page: 0, ...next })));
  const turn = (to: number) => {
    glide(() => setF((cur) => ({ ...cur, page: to })));
    listRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <div ref={listRef} className="bl-index">
      <div className="bl-bar">
        <div className="bl-topics" role="group" aria-label="Filter by category">
          {(["All", ...TOPICS] as const).map((t) => {
            const empty = t !== "All" && !rows.some((r) => r.topics.includes(t));
            return (
              <button
                key={t}
                type="button"
                className="bl-topic"
                aria-pressed={f.topic === t}
                disabled={empty}
                onClick={() => pick({ topic: t })}
              >
                {t}
              </button>
            );
          })}
        </div>
        <label className="bl-search">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="sr-only">Search posts</span>
          <input type="search" value={f.q} placeholder="Search" onChange={(e) => setF((cur) => ({ ...cur, q: e.target.value, page: 0 }))} />
        </label>
      </div>

      {slice.length === 0 ? (
        <p className="bl-none" role="status">
          No posts match.{" "}
          <button type="button" className="bl-ul" onClick={() => pick(NONE)}>
            Clear filters
          </button>
        </p>
      ) : (
        <ol className="bl-log-list">
          {slice.map(({ post }) => (
            <li key={post.id} className="bl-log-row" style={{ viewTransitionName: `bl-${post.id.replace(/[^a-zA-Z0-9-]/g, "")}` }}>
              <Link className="bl-log-link" href={`/blog/${post.id}`}>
                <div className="bl-log-thumb">
                  <Cover post={post} />
                </div>
                <div className="bl-log-body">
                  <Meta post={post} />
                  <h2 className="bl-log-title">
                    <span className="bl-ul">{post.title}</span>
                  </h2>
                  <p className="bl-blurb">{post.excerpt}</p>
                </div>
                <div className="bl-log-foot">
                  <span className="bl-author">{post.author}</span>
                  <span className="bl-readmore bl-ul" aria-hidden>
                    Read article →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <div className="bl-foot">
        {pages > 1 ? (
          <nav className="bl-pages" aria-label="Pages">
            <button type="button" className="bl-page-btn" disabled={page === 0} onClick={() => turn(page - 1)} aria-label="Previous page">
              ←
            </button>
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} type="button" className="bl-page-btn" aria-current={i === page ? "page" : undefined} onClick={() => turn(i)}>
                {String(i + 1).padStart(2, "0")}
              </button>
            ))}
            <button type="button" className="bl-page-btn" disabled={page === pages - 1} onClick={() => turn(page + 1)} aria-label="Next page">
              →
            </button>
          </nav>
        ) : (
          <span />
        )}
        {years.length > 1 && (
          <div className="bl-years" role="group" aria-label="Archive by year">
            <span className="bl-years-label">Archive</span>
            {(["All", ...years] as const).map((y) => (
              <button key={y} type="button" className="bl-year" aria-pressed={f.year === y} onClick={() => pick({ year: y })}>
                {y}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
