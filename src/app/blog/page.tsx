import type { Metadata } from "next";
import { getBlogPosts } from "@/lib/blog";
import BlogList from "./BlogList";
import "./blog-page.css";

/* ============================================================
   BLOG - the club's writing, pulled live from the CSAU Medium
   feed (@cegcsau) via the same Sanity + rss2json path the main
   csau.in site uses (src/lib/blog.ts): the title, then the
   list (BlogList); each post opens /blog/[slug]. Fetched on the server (revalidated hourly);
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

  return (
    <main id="content" className="pg bl-page">
      <div className="bl-wrap">
        <header className="bl-head">
          <h1 className="pg-title">Blogs</h1>
          {state === "fallback" && (
            <p className="bl-notice" role="status">
              <span className="bl-notice-dot" aria-hidden />
              Showing the latest cached posts.{notice ? ` ${notice}` : ""}
            </p>
          )}
        </header>

        {posts.length === 0 ? (
          <div className="bl-empty" aria-live="polite">
            <p className="bl-empty-title">No posts yet</p>
            <a href="https://medium.com/@cegcsau" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Follow on Medium →
            </a>
          </div>
        ) : (
          <BlogList posts={posts.map((post) => ({ ...post, html: undefined }))} />
        )}
      </div>
    </main>
  );
}
