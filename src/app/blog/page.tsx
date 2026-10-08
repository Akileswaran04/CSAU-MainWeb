import type { Metadata } from "next";
import { getBlogPosts } from "@/lib/blog";
import BlogList from "./BlogList";
import "./blog-page.css";

/* ============================================================
   BLOG - the club's real writing, pulled live from the CSAU
   Medium feed (@cegcsau) via the same Sanity + rss2json path
   the main csau.in site uses. See src/lib/blog.ts.

   The page is a flight: the home story's ship visits one post per
   scroll stop, with the header as its first stop (BlogFlight,
   inside BlogList), and the posts below are the signal log. With
   no posts the empty receiver band shows instead.
   Server Component: fetched on the server (revalidated hourly);
   `loading.tsx` is the scanning state.
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

  const header = (
    <header className="bl-head bl-rx-head">
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
      {state === "fallback" && (
        <p className="bl-notice" role="status">
          <span className="bl-notice-dot" aria-hidden />
          Showing the latest cached posts.{notice ? ` ${notice}` : ""}
        </p>
      )}
    </header>
  );

  return (
    <main id="content" className="pg bl-page">
      {posts.length === 0 ? (
        <section className="bl-scope" aria-live="polite">
          <div className="bl-rx-over">
            {header}
            <div className="bl-empty">
              <p className="bl-scope-label tabular" aria-hidden>
                00 carriers
              </p>
              <p className="bl-empty-title">No posts in orbit yet</p>
              <p className="bl-empty-body">
                Nothing has been published to the feed so far. Check back soon - or follow the crew
                on Medium for the first drop.
              </p>
              <a
                href="https://medium.com/@cegcsau"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Follow on Medium →
              </a>
            </div>
          </div>
        </section>
      ) : (
        <BlogList posts={posts} header={header} />
      )}
    </main>
  );
}
