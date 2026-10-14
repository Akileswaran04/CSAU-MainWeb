import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPosts, readArticle } from "@/lib/blog";
import { Cover, Meta } from "../parts";
import "../blog-page.css";

/* ============================================================
   BLOG ARTICLE - one post's reading page: poster, date and
   reading time, title, author, a table of contents from its
   headings, and the full article from the Medium feed (cut down
   to safe markup by readArticle). The fallback snapshot has no
   article text, so it shows the excerpt and the Medium link.
   Route: /blog/[slug]
   ============================================================ */

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

async function findPost(slug: string) {
  const { posts } = await getBlogPosts();
  return posts.find((p) => p.id === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await findPost((await params).slug);
  return post ? { title: `${post.title} // CSAU Blog`, description: post.excerpt } : {};
}

export default async function BlogArticle({ params }: Props) {
  const post = await findPost((await params).slug);
  if (!post) notFound();
  const { html, toc } = readArticle(post.html ?? "", post.image);
  const nested = toc.some((t) => t.level === 2);

  return (
    <main id="content" className="pg bl-page">
      <article className="bl-read">
        <Link href="/blog" className="bl-back bl-ul">
          ← Blogs
        </Link>
        <header className="bl-read-head">
          <div className="bl-read-poster">
            <Cover post={post} />
          </div>
          <Meta post={post} />
          <h1 className="bl-read-title">{post.title}</h1>
          <p className="bl-author">{post.author}</p>
        </header>

        <div className={toc.length ? "bl-read-grid" : "bl-read-grid bl-read-solo"}>
          {toc.length > 0 && (
            <nav className="bl-toc" aria-label="Table of contents">
              <p className="bl-toc-label">Contents</p>
              <ol>
                {toc.map((t) => (
                  <li key={t.id} data-sub={nested && t.level === 3 ? "" : undefined}>
                    <a href={`#${t.id}`} className="bl-ul">
                      {t.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div className="bl-prose">
            {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : <p>{post.excerpt}</p>}
            <p className="bl-read-out">
              <a href={post.link} target="_blank" rel="noopener noreferrer" className="bl-ul">
                Read on Medium ↗
              </a>
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}
