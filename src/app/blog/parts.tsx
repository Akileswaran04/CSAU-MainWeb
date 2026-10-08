"use client";

import { useState } from "react";
import type { BlogPost } from "@/lib/blog";

/* Shared pieces of a post: the cover plate and the meta line.
   Used by the signal log (BlogList) and the receiver (SignalDecoder). */

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
