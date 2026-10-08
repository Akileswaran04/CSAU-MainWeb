"use client";

import { useMemo, useState } from "react";
import type { BlogPost } from "@/lib/blog";
import { collectCategories } from "@/lib/blog";
import { Cover, Meta } from "./parts";
import BlogFlight from "./BlogFlight";

/* ============================================================
   BLOG LIST (client) - the flight and the signal log.

     • the flight (BlogFlight): the home story's ship visits one
       post per scroll stop; the page header and the band selector
       (ALL + every Medium tag) are its first stop
     • below it, the signal log: one ruled row per transmission,
       channel numbers in the same order as the flight's stops
     • both follow the band filter
   Posts arrive already sorted newest-first from the server.
   ============================================================ */

const pad = (n: number) => String(n).padStart(2, "0");

export default function BlogList({ posts, header }: { posts: BlogPost[]; header?: React.ReactNode }) {
  const categories = useMemo(() => ["ALL", ...collectCategories(posts)], [posts]);
  const [active, setActive] = useState<string>("ALL");

  const shown = useMemo(
    () => (active === "ALL" ? posts : posts.filter((p) => p.categories.includes(active))),
    [posts, active],
  );

  const intro = (
    <>
      {header}
      <nav aria-label="Filter posts by topic" className="bl-band">
        <span className="bl-band-label" aria-hidden>
          Band
        </span>
        <div className="bl-band-chips">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className="bl-band-chip"
              onClick={() => setActive(cat)}
              aria-pressed={active === cat}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="bl-count tabular" aria-live="polite">
          {shown.length} {shown.length === 1 ? "post" : "posts"}
        </span>
      </nav>
    </>
  );

  return (
    <>
      {shown.length > 0 ? (
        <BlogFlight posts={shown} intro={intro} />
      ) : (
        <div className="bl-rx">
          <div className="bl-scope">
            <div className="bl-rx-over">{intro}</div>
          </div>
        </div>
      )}

      <section className="bl-log pg-in" aria-labelledby="bl-log-h">
        <div className="bl-log-head">
          <h2 id="bl-log-h" className="eyebrow">
            Signal log
          </h2>
          <span className="eyebrow tabular" aria-hidden>
            CH 01-{pad(shown.length)}
          </span>
        </div>

        {shown.length === 0 ? (
          <p className="bl-empty-body" role="status" style={{ marginTop: 32 }}>
            No posts tagged “{active}”. Try another topic.
          </p>
        ) : (
          <ol className="bl-log-list" key={active}>
            {shown.map((post, i) => (
              <li key={post.id} className="bl-log-row bl-enter" style={{ ["--i" as string]: Math.min(i, 8) }}>
                <a
                  className="bl-log-link"
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Read “${post.title}” on Medium (opens in a new tab)`}
                  data-latest={i === 0 || undefined}
                >
                  <span className="bl-log-ch tabular">{pad(i + 1)}</span>
                  <div className="bl-log-thumb">
                    <Cover post={post} />
                  </div>
                  <div className="bl-log-body">
                    <Meta post={post} />
                    <h3 className="bl-log-title">{post.title}</h3>
                    <p className="bl-blurb">{post.excerpt}</p>
                  </div>
                  <div className="bl-log-foot">
                    <span className="bl-author">{post.author}</span>
                    <span className="bl-readmore" aria-hidden>
                      {i === 0 ? "Read on Medium →" : "Read →"}
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
