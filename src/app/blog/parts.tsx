"use client";

import { useState } from "react";
import type { BlogPost } from "@/lib/blog";

/* Shared pieces of a post: the cover plate and the meta line.
   Used by BlogList and the article page. */

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** The feed's "YYYY-MM-DD hh:mm:ss" (UTC) as a Date, or null. */
export function postDate(raw: string): Date | null {
  const d = new Date(raw.replace(" ", "T") + (raw.includes("T") ? "" : "Z"));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(raw: string): string {
  const d = postDate(raw);
  return d ? DATE_FMT.format(d).toUpperCase() : raw;
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

export function Cover({ post }: { post: BlogPost }) {
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
        alt={`Cover image of the article: ${post.title}`}
        loading="lazy"
        decoding="async"
        className="bl-cover-img"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function Meta({ post }: { post: BlogPost }) {
  return (
    <div className="bl-meta">
      <time dateTime={postDate(post.date)?.toISOString()}>{formatDate(post.date)}</time>
      <span aria-hidden>·</span>
      <span>{post.readingMinutes} min read</span>
    </div>
  );
}
