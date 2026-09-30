/* ============================================================
   BLOG DATA - real CSAU writing, pulled from the same sources
   the live csau.in/blogs page uses.

     • Sanity CMS (project wzu06sd5 / production) holds a
       `blogLinks` document listing the club's Medium feed(s).
     • Each Medium feed is turned into JSON through rss2json,
       exactly as the current site does it.

   If the network is unavailable at build/request time we fall
   back to a snapshot of the real posts (never invented ones) so
   the page still renders. Every field below comes from the live
   feed - titles, links, authors, dates, categories and images.
   ============================================================ */

export interface BlogPost {
  /** Stable id (the Medium article slug). */
  id: string;
  title: string;
  /** Canonical article URL on Medium. */
  link: string;
  author: string;
  /** ISO-ish date string from the feed (UTC). */
  date: string;
  /** Up to a few Medium tags, lower-cased as the feed returns them. */
  categories: string[];
  /** Cover image URL (may be empty; the UI degrades gracefully). */
  image: string;
  /** Plain-text excerpt. */
  excerpt: string;
  /** Estimated reading time in minutes. */
  readingMinutes: number;
}

export type BlogFetchState = "ok" | "fallback";

export interface BlogFeed {
  posts: BlogPost[];
  /** "ok" = fetched live; "fallback" = served the baked-in snapshot. */
  state: BlogFetchState;
  /** Human-readable note when we fell back (for the error/notice state). */
  notice?: string;
}

const SANITY_PROJECT_ID = "wzu06sd5";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "v2021-10-21";
const RSS2JSON = "https://api.rss2json.com/v1/api.json";

/** The club's Medium feed, hard-coded as the last-resort source in
 *  case the Sanity lookup is unavailable. This is the real feed. */
const DEFAULT_MEDIUM_FEEDS = ["https://medium.com/feed/@cegcsau"];

/* ---- shapes of the upstream JSON (only the fields we read) ---- */

interface Rss2JsonItem {
  title?: string;
  link?: string;
  author?: string;
  pubDate?: string;
  categories?: string[];
  thumbnail?: string;
  description?: string;
  content?: string;
}

interface Rss2JsonResponse {
  status?: string;
  items?: Rss2JsonItem[];
}

interface SanityBlogLinks {
  result?: {
    mediumLinks?: { url?: string }[];
  };
}

/* ---- helpers ---- */

const WORDS_PER_MINUTE = 220;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function firstImage(html: string): string {
  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  return match ? match[1] : "";
}

function slugFromLink(link: string): string {
  const clean = link.split("?")[0].replace(/\/$/, "");
  const tail = clean.split("/").pop() ?? clean;
  return tail || clean;
}

function makeExcerpt(text: string, max = 180): string {
  const trimmed = text.replace(/^Photo by [^.]+ on Unsplash\s+/i, "");
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).replace(/\s+\S*$/, "") + "\u2026";
}

function readingMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function toPost(item: Rss2JsonItem): BlogPost | null {
  const link = (item.link ?? "").split("?")[0];
  const title = item.title?.trim();
  if (!link || !title) return null;

  const bodyHtml = item.content || item.description || "";
  const text = stripHtml(item.description || item.content || "");

  return {
    id: slugFromLink(link),
    title,
    link,
    author: item.author?.trim() || "Computer Society of Anna University",
    date: item.pubDate ?? "",
    categories: (item.categories ?? []).slice(0, 3).map((c) => c.toLowerCase()),
    image: item.thumbnail?.trim() || firstImage(bodyHtml),
    excerpt: makeExcerpt(text),
    readingMinutes: readingMinutes(text),
  };
}

/* ---- source: Sanity -> Medium feed URLs ---- */

async function fetchMediumFeedUrls(signal?: AbortSignal): Promise<string[]> {
  const query = `*[_type == "blogLinks"][0]{mediumLinks}`;
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(
    query,
  )}`;

  try {
    const res = await fetch(url, { signal, next: { revalidate: 3600 } });
    if (!res.ok) return DEFAULT_MEDIUM_FEEDS;
    const data = (await res.json()) as SanityBlogLinks;
    const urls = (data.result?.mediumLinks ?? [])
      .map((l) => l.url?.trim())
      .filter((u): u is string => Boolean(u));
    return urls.length ? urls : DEFAULT_MEDIUM_FEEDS;
  } catch {
    return DEFAULT_MEDIUM_FEEDS;
  }
}

/* ---- source: Medium feed -> posts (via rss2json) ---- */

async function fetchFeed(feedUrl: string, signal?: AbortSignal): Promise<BlogPost[]> {
  const url = `${RSS2JSON}?rss_url=${encodeURIComponent(feedUrl)}`;
  const res = await fetch(url, { signal, next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`rss2json ${res.status}`);
  const data = (await res.json()) as Rss2JsonResponse;
  if (data.status !== "ok" || !Array.isArray(data.items)) {
    throw new Error("rss2json returned no items");
  }
  return data.items
    .map(toPost)
    .filter((p): p is BlogPost => p !== null);
}

/**
 * Fetch the real CSAU blog posts. Revalidated hourly by Next's data cache.
 * Falls back to a snapshot of the real feed if the network fails.
 */
export async function getBlogPosts(): Promise<BlogFeed> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const feedUrls = await fetchMediumFeedUrls(controller.signal);
    const results = await Promise.all(
      feedUrls.map((u) =>
        fetchFeed(u, controller.signal).catch(() => [] as BlogPost[]),
      ),
    );

    const merged = new Map<string, BlogPost>();
    for (const post of results.flat()) merged.set(post.id, post);

    const posts = Array.from(merged.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    if (posts.length === 0) {
      return { posts: FALLBACK_POSTS, state: "fallback", notice: "Live feed returned no posts." };
    }
    return { posts, state: "ok" };
  } catch {
    return {
      posts: FALLBACK_POSTS,
      state: "fallback",
      notice: "Medium or our blog service may be temporarily unavailable.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** All distinct categories across a set of posts, sorted. */
export function collectCategories(posts: BlogPost[]): string[] {
  const set = new Set<string>();
  for (const p of posts) p.categories.forEach((c) => set.add(c));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/* ============================================================
   FALLBACK - a snapshot of the REAL @cegcsau Medium feed,
   captured 2024. These are genuine CSAU articles, not invented
   content. Used only when the live feed cannot be reached.
   ============================================================ */
const FALLBACK_POSTS: BlogPost[] = [
  {
    id: "navigating-the-data-science-landscape-150d34fc8a6",
    title: "Navigating the Data Science Landscape",
    link: "https://medium.com/@cegcsau/navigating-the-data-science-landscape-150d34fc8a6",
    author: "Computer Society of Anna University",
    date: "2023-09-12 12:17:13",
    categories: ["ai", "data-science", "data"],
    image: "https://cdn-images-1.medium.com/max/875/0*V7HfKehiJVeIHXYZ.jpeg",
    excerpt:
      "In today\u2019s data-driven world, the role of a data scientist is like that of a modern-day alchemist, transforming raw data into valuable insights. However, the realm of data science\u2026",
    readingMinutes: 5,
  },
  {
    id: "understanding-node-js-6537f92cdb34",
    title: "Understanding Node.js",
    link: "https://medium.com/@cegcsau/understanding-node-js-6537f92cdb34",
    author: "Computer Society of Anna University",
    date: "2023-09-12 12:15:30",
    categories: ["nodejs", "backend-development", "server-side-rendering"],
    image: "https://cdn-images-1.medium.com/max/250/0*zAM0TVA-i-Ti58df",
    excerpt:
      "Node.js is a powerful runtime environment that allows developers to run JavaScript on the server-side. It\u2019s not a programming language itself but rather a JavaScript runtime built\u2026",
    readingMinutes: 4,
  },
  {
    id: "beginners-roadmap-to-js-and-react-72b98322e5c6",
    title: "Beginner\u2019s roadmap to JS and React",
    link: "https://medium.com/@cegcsau/beginners-roadmap-to-js-and-react-72b98322e5c6",
    author: "Computer Society of Anna University",
    date: "2023-09-12 12:08:24",
    categories: ["javascript", "roadmaps", "front-end-development"],
    image: "https://cdn-images-1.medium.com/max/600/0*ie78DKHd1AgZeQ-a.png",
    excerpt:
      "In today\u2019s world, frontend development is one of the major domains of interest for most tech based companies, irrespective of whether they are startups or well established ones.\u2026",
    readingMinutes: 7,
  },
  {
    id: "chatgpt-what-mark-does-this-ai-phenomenon-leave-bf5afe9442bf",
    title: "ChatGPT \u2014What mark does this AI phenomenon leave?",
    link: "https://medium.com/@cegcsau/chatgpt-what-mark-does-this-ai-phenomenon-leave-bf5afe9442bf",
    author: "Computer Society of Anna University",
    date: "2023-03-03 04:06:15",
    categories: ["ai", "technology", "chatbots"],
    image: "https://cdn-images-1.medium.com/max/1024/0*FKk4l-UNE_RdC8U_",
    excerpt:
      "The debate of AI taking over the world has been a very real one the past decade. The notion of such debates have manifested themselves to a great extent in pop culture through\u2026",
    readingMinutes: 8,
  },
];
