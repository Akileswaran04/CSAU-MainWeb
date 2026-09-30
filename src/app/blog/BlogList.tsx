"use client";

import { useMemo, useState } from "react";
import type { BlogPost } from "@/lib/blog";
import { collectCategories } from "@/lib/blog";

/* ============================================================
   BLOG LIST (client) - the interactive layer over the real posts.

     • a category rail (ALL + every Medium tag) filters the grid
     • the newest post leads as a wide feature; the rest are cards
     • entrance is a staggered fade/rise (skipped for reduced motion,
       handled in CSS); hover lifts the border to ink and nudges
       the title, matching the events/nav language
     • cover images degrade to a lettered plate if Medium 404s
   Posts arrive already sorted newest-first from the server.
   ============================================================ */

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(raw: string): string {
  const d = new Date(raw.replace(" ", "T") + (raw.includes("T") ? "" : "Z"));
  if (Number.isNaN(d.getTime())) return raw;
  return DATE_FMT.format(d).toUpperCase();
}

function initialsFromTitle(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function Cover({ post }: { post: BlogPost }) {
  const [failed, setFailed] = useState(false);
  if (!post.image || failed) {
    return (
      <div className="bl-cover bl-cover-fallback" aria-hidden>
        <span>{initialsFromTitle(post.title)}</span>
      </div>
    );
  }
  return (
    <div className="bl-cover">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.image}
        alt=""
        loading="lazy"
        decoding="async"
        className="bl-cover-img"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function Meta({ post }: { post: BlogPost }) {
  return (
    <div className="bl-meta">
      {post.categories[0] && (
        <span className="bl-kind" data-kind="ARTICLE">
          {post.categories[0]}
        </span>
      )}
      <span>{formatDate(post.date)}</span>
      <span>{post.readingMinutes} min read</span>
    </div>
  );
}

export default function BlogList({ posts }: { posts: BlogPost[] }) {
  const categories = useMemo(() => ["ALL", ...collectCategories(posts)], [posts]);
  const [active, setActive] = useState<string>("ALL");

  const shown = useMemo(
    () => (active === "ALL" ? posts : posts.filter((p) => p.categories.includes(active))),
    [posts, active],
  );

  const [lead, ...rest] = shown;

  return (
    <>
      <nav aria-label="Filter posts by topic" className="bl-tabs">
        {categories.map((cat) => {
          const pressed = active === cat;
          return (
            <button
              key={cat}
              type="button"
              className="bl-tab"
              onClick={() => setActive(cat)}
              aria-pressed={pressed}
            >
              {cat}
            </button>
          );
        })}
        <span className="bl-count tabular" aria-live="polite">
          {shown.length} {shown.length === 1 ? "post" : "posts"}
        </span>
      </nav>

      {shown.length === 0 ? (
        <p className="bl-empty-body" role="status" style={{ marginTop: 32 }}>
          No posts tagged “{active}”. Try another topic.
        </p>
      ) : (
        <div className="bl-grid" key={active}>
          {lead && (
            <article className="bl-card bl-card-lead bl-enter" style={{ ["--i" as string]: 0 }}>
              <a
                className="bl-card-link"
                href={lead.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Read “${lead.title}” on Medium (opens in a new tab)`}
              >
                <Cover post={lead} />
                <div className="bl-card-body">
                  <Meta post={lead} />
                  <h2 className="bl-card-title bl-lead-title">{lead.title}</h2>
                  <p className="bl-blurb">{lead.excerpt}</p>
                  <div className="bl-card-foot">
                    <span className="bl-author">{lead.author}</span>
                    <span className="bl-readmore" aria-hidden>
                      Read on Medium →
                    </span>
                  </div>
                </div>
              </a>
            </article>
          )}

          {rest.map((post, idx) => (
            <article
              key={post.id}
              className="bl-card bl-enter"
              style={{ ["--i" as string]: idx + 1 }}
            >
              <a
                className="bl-card-link"
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Read “${post.title}” on Medium (opens in a new tab)`}
              >
                <Cover post={post} />
                <div className="bl-card-body">
                  <Meta post={post} />
                  <h2 className="bl-card-title">{post.title}</h2>
                  <p className="bl-blurb">{post.excerpt}</p>
                  <div className="bl-card-foot">
                    <span className="bl-author">{post.author}</span>
                    <span className="bl-readmore" aria-hidden>
                      Read →
                    </span>
                  </div>
                </div>
              </a>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
