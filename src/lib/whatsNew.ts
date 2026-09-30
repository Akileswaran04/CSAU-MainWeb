import { isExternal } from "@/data/events";
import { getBlogPosts } from "./blog";
import { getEvents, type EventsResult } from "./events";

/* ============================================================
   WHAT'S NEW - the short list behind the rocket's flag on the
   home page. Nothing is written here by hand: the list is
   derived from what the site already publishes.

     • upcoming events from the CMS (see src/lib/events.ts)
     • the most recent event in the archive
     • the newest article from the club's Medium feed

   Fetched on the server with the home page (events and the blog
   feed are revalidated hourly and each has its own real fallback).
   ============================================================ */

export interface WhatsNewItem {
  id: string;
  /** short status word shown above the title, e.g. "UPCOMING", "BLOG" */
  kind: string;
  title: string;
  /** one quiet line: category and date */
  meta: string;
  href: string;
  /** opens in a new tab */
  external: boolean;
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(raw: string): string {
  const d = new Date(raw.includes("T") ? raw : raw.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime()) ? "" : DATE_FMT.format(d).toUpperCase();
}

/** How many upcoming events to list. */
const CURRENT_MAX = 3;

/** Pass the events when the caller has already fetched them. */
export async function getWhatsNew(events?: EventsResult): Promise<WhatsNewItem[]> {
  const { current, past } = events ?? (await getEvents());

  const running: WhatsNewItem[] = current.slice(0, CURRENT_MAX).map((e) => ({
    id: `event:${e.id}`,
    kind: e.status,
    title: e.name,
    meta: [e.tag, e.date].filter(Boolean).join(" · "),
    href: e.href ?? "/events",
    external: isExternal(e.href ?? ""),
  }));

  const recent: WhatsNewItem[] = past.slice(0, 1).map((e) => ({
    id: `event:${e.id}`,
    kind: "LATEST EVENT",
    title: e.name,
    meta: [e.tag, e.date].filter(Boolean).join(" · "),
    href: "/events",
    external: false,
  }));

  const { posts } = await getBlogPosts();
  const latest = posts[0];
  const blog: WhatsNewItem[] = latest
    ? [
        {
          id: `blog:${latest.id}`,
          kind: "BLOG",
          title: latest.title,
          meta: ["LATEST ARTICLE", formatDate(latest.date)].filter(Boolean).join(" · "),
          href: latest.link,
          external: true,
        },
      ]
    : [];

  return [...running, ...recent, ...blog];
}
