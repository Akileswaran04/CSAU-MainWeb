import type { Metadata } from "next";
import Link from "next/link";
import { getBlogPosts } from "@/lib/blog";
import BlogList from "./BlogList";

/* ============================================================
   BLOG - the club's real writing, pulled live from the CSAU
   Medium feed (@cegcsau) via the same Sanity + rss2json path
   the main csau.in site uses. See src/lib/blog.ts.

   This is a Server Component: the feed is fetched on the server
   (revalidated hourly) and streamed in. `loading.tsx` provides
   the loading state; the empty and error/notice states are
   handled inline below.
   Route: /blog
   ============================================================ */

export const metadata: Metadata = {
  title: "Blog // CSAU - Computer Society of Anna University",
  description:
    "Technical articles and writing from the Computer Society of Anna University, CEG - published on Medium by the members.",
};

// Let the page re-fetch on the server at most once an hour.
export const revalidate = 3600;

export default async function BlogPage() {
  const { posts, state, notice } = await getBlogPosts();

  return (
    <main id="content" className="pg">
      <div className="pg-in">
        <header className="bl-head">
          <div className="eyebrow">Writing</div>
          <h1 className="pg-title">Blog</h1>
          <p className="pg-lede">
            Technical articles and deep-dives written by the members and published on{" "}
            <a
              className="bl-lede-link"
              href="https://medium.com/@cegcsau"
              target="_blank"
              rel="noopener noreferrer"
            >
              Medium
            </a>
            . Signals from across the network, straight from the crew.
          </p>
        </header>

        {state === "fallback" && (
          <p className="bl-notice" role="status">
            <span className="bl-notice-dot" aria-hidden />
            Showing the latest cached posts.{notice ? ` ${notice}` : ""}
          </p>
        )}

        {posts.length === 0 ? (
          <section className="bl-empty" aria-live="polite">
            <p className="bl-empty-title">No posts in orbit yet</p>
            <p className="bl-empty-body">
              Nothing has been published to the feed so far. Check back soon - or follow the crew on
              Medium for the first drop.
            </p>
            <a
              href="https://medium.com/@cegcsau"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Follow on Medium →
            </a>
          </section>
        ) : (
          <BlogList posts={posts} />
        )}

        <p className="pg-next">
          <Link href="/crackit" data-route-load className="btn btn-primary">
            Join a coding round →
          </Link>
        </p>
      </div>
    </main>
  );
}
