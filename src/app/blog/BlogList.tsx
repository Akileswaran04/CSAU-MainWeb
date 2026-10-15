"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { BlogPost } from "@/lib/blog";
import { Cover, Meta } from "./parts";

/* ============================================================
   BLOG LIST - every post as one ruled row (poster, date and
   reading time, title, excerpt, author) opening its reading
   page; pages below. Posts arrive sorted newest-first from the
   server. Turning a page runs in a view transition so rows glide
   to their new places.
   ============================================================ */

const PER_PAGE = 6;

/** Apply a page turn inside a view transition where the browser has one. */
function glide(apply: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
  doc.startViewTransition(() => flushSync(apply));
}

export default function BlogList({ posts }: { posts: BlogPost[] }) {
  const [page, setPage] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const pages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const slice = posts.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const turn = (to: number) => {
    glide(() => setPage(to));
    listRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  return (
    <div ref={listRef} className="bl-index">
      <ol className="bl-log-list">
        {slice.map((post) => (
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
              </div>
            </Link>
          </li>
        ))}
      </ol>

      {pages > 1 && (
        <nav className="bl-pages bl-foot" aria-label="Pages">
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
      )}
    </div>
  );
}
