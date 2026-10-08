import type { PastEvent, UpcomingEvent } from "@/data/events";
import { FALLBACK_EVENT_ROWS } from "./events.fallback";

/* ============================================================
   EVENTS DATA - the club's real events.

   Every event is an `event` document in the club's Sanity CMS
   (project wzu06sd5 / production) - the same records csau.in
   shows. They are fetched on the server (revalidated hourly)
   and mapped onto the shapes the event UI already renders, with
   a baked-in real snapshot as the fallback if the CMS is
   unreachable.

   CMS field      -> UI
     title        -> name
     date         -> date ("31 OCT 2025", IST) and year (archive grouping)
     description  -> blurb (plain text, emoji removed, short excerpt)
                     and log (the same text in full, for the flight log)
     mainImage    -> poster (resized by the Sanity CDN)
     eventPics    -> the card's photo strip (the photos taken at that event)
     location     -> stat line, and the tag (ON CAMPUS / ONLINE / HYBRID)
     registerLink -> the upcoming card's Register button
   The CMS has no category or attendance fields, so none are shown.
   An event is upcoming while its date is today or later (IST);
   everything else is archive.
   ============================================================ */

/** One CMS event, as queried (the fallback snapshot uses the same shape). */
export interface SanityEventRow {
  title?: string;
  slug?: string;
  /** ISO datetime */
  date?: string;
  location?: string;
  /** poster: full Sanity URL, or the asset file name in the snapshot */
  image?: string;
  upcoming?: boolean;
  registerLink?: string;
  /** description as plain text */
  text?: string;
  /** photos taken at the event: full Sanity URLs, or asset file names in the snapshot */
  photos?: string[];
}

export type EventsState = "ok" | "fallback";

export interface EventsResult {
  /** upcoming CMS events, soonest first */
  current: UpcomingEvent[];
  /** the archive, newest first */
  past: PastEvent[];
  state: EventsState;
}

const SANITY_PROJECT_ID = "wzu06sd5";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "v2021-10-21";
const SANITY_IMAGE_BASE = `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/`;

/* ---- mapping helpers ---- */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** The calendar day in IST, read through the UTC getters of a shifted date. */
const inIst = (ms: number) => new Date(ms + IST_OFFSET_MS);

function formatDate(ms: number): { date: string; year: string } {
  const d = inIst(ms);
  const year = String(d.getUTCFullYear());
  return { date: `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${year}`, year };
}

/** Midnight (IST) of the current day, as a UTC timestamp. */
function startOfTodayIst(now: number): number {
  const d = inIst(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - IST_OFFSET_MS;
}

// Built with the constructor so the unicode property escapes do not depend on the TS target.
const PICTOGRAPHS = new RegExp("\\p{Extended_Pictographic}|[\\uFE0F\\u200D\\uFEFF]", "gu");
const BREAK = "\u0001";
/* an emoji or line break used as a bullet between two phrases: "... workshop 🔹 Hands-on ..." */
const BULLET_BREAK = new RegExp(`([\\p{L}\\p{N})])\\s*${BREAK}[\\s${BREAK}]*(?=\\p{Lu})`, "gu");
const ANY_BREAK = new RegExp(`${BREAK}`, "g");

/** Plain, single-spaced text without emoji (the interface uses none). The
 *  descriptions use emoji and line breaks as bullets; those become full stops
 *  so the phrases they separated do not run together. */
function clean(text: string): string {
  return text
    .replace(PICTOGRAPHS, BREAK)
    .replace(/\n+/g, BREAK)
    .replace(BULLET_BREAK, "$1. ")
    .replace(ANY_BREAK, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([!?])\./g, "$1")
    .trim();
}

/** A short excerpt: whole sentences when they fit, otherwise cut at a word. */
function excerpt(text: string, max = 190): string {
  if (text.length <= max) return text;
  const head = text.slice(0, max + 1);
  const sentenceEnd = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "));
  if (sentenceEnd >= 80) return head.slice(0, sentenceEnd + 1);
  return head.slice(0, max).replace(/\s+\S*$/, "").replace(/[,;:\s]+$/, "") + "…";
}

/** How the event ran, read from where it was held. */
function modeOf(location: string): string {
  if (/hybrid/i.test(location)) return "HYBRID";
  if (/online|teams|google meet|unstop|website/i.test(location)) return "ONLINE";
  return "ON CAMPUS";
}

/** Full Sanity URL for an asset given as a URL or as a bare file name. */
function assetUrl(image?: string | null): string | undefined {
  const value = image?.trim();
  if (!value) return undefined;
  return value.startsWith("http") ? value : SANITY_IMAGE_BASE + value;
}

function posterUrl(image?: string): string | undefined {
  const base = assetUrl(image);
  return base ? `${base}?w=720&fit=max&auto=format&q=75` : undefined;
}

function httpsLink(raw?: string): string | undefined {
  const value = raw?.trim();
  return value && /^https?:\/\//i.test(value) ? value : undefined;
}

interface MappedEvent {
  ms: number;
  past: PastEvent;
  registerLink?: string;
}

function mapRow(r: SanityEventRow): MappedEvent | null {
  const name = r.title?.trim();
  const ms = r.date ? Date.parse(r.date) : NaN;
  if (!name || Number.isNaN(ms)) return null;
  const location = clean(r.location ?? "");
  const { date, year } = formatDate(ms);
  return {
    ms,
    registerLink: httpsLink(r.registerLink),
    past: {
      id: r.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      year,
      name,
      tag: location ? modeOf(location) : "",
      date,
      blurb: excerpt(clean(r.text ?? "")),
      log: clean(r.text ?? ""),
      stat: location,
      poster: posterUrl(r.image),
      photos: (r.photos ?? []).map(assetUrl).filter((u): u is string => Boolean(u)),
    },
  };
}

function toUpcoming(e: MappedEvent): UpcomingEvent {
  const { id, name, tag, date, blurb, poster } = e.past;
  return {
    id,
    name,
    tag,
    date,
    status: "UPCOMING",
    blurb,
    poster,
    ...(e.registerLink ? { href: e.registerLink, cta: "REGISTER" } : {}),
  };
}

/** CrackIT is no longer on the site (2026-10-05): its events are left out wherever they come from */
const DROPPED = /crack\s*-?\s*it/i;

function build(rows: SanityEventRow[], now: number): { current: UpcomingEvent[]; past: PastEvent[] } {
  const seen = new Set<string>();
  const mapped: MappedEvent[] = [];
  for (const r of rows) {
    if (DROPPED.test(r.title ?? "") || DROPPED.test(r.slug ?? "")) continue;
    const m = mapRow(r);
    if (!m || seen.has(m.past.id)) continue;
    seen.add(m.past.id);
    mapped.push(m);
  }
  const today = startOfTodayIst(now);
  const upcoming = mapped.filter((e) => e.ms >= today).sort((a, b) => a.ms - b.ms);
  const past = mapped.filter((e) => e.ms < today).sort((a, b) => b.ms - a.ms);
  return {
    current: upcoming.map(toUpcoming),
    past: past.map((e) => e.past),
  };
}

/* ---- live fetch from Sanity ---- */

async function fetchRows(signal?: AbortSignal): Promise<SanityEventRow[] | null> {
  const query = `*[_type == "event"]{title, "slug": slug.current, date, location, upcoming, registerLink, "image": mainImage.asset->url, "photos": eventPics[].asset->url, "text": pt::text(description)}`;
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(
    query,
  )}`;

  try {
    const res = await fetch(url, { signal, next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: SanityEventRow[] };
    const rows = data.result ?? [];
    return rows.length ? rows : null;
  } catch {
    return null;
  }
}

/**
 * The club's events, split into what is upcoming and the archive.
 * Revalidated hourly. Falls back to the baked-in real snapshot if Sanity is
 * unreachable.
 */
export async function getEvents(): Promise<EventsResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const now = Date.now();
  try {
    const rows = await fetchRows(controller.signal);
    const live = rows ? build(rows, now) : null;
    if (!live || live.past.length + live.current.length === 0) {
      return { ...build(FALLBACK_EVENT_ROWS, now), state: "fallback" };
    }
    return { ...live, state: "ok" };
  } catch {
    return { ...build(FALLBACK_EVENT_ROWS, now), state: "fallback" };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Exactly `count` past events, newest first, for the home story (its scene is
 * laid out for a fixed number of stops). If the CMS ever returns fewer, the
 * rest come from the real snapshot.
 */
export function pickStoryEvents(past: PastEvent[], count: number): PastEvent[] {
  if (past.length >= count) return past.slice(0, count);
  const ids = new Set(past.map((e) => e.id));
  const spare = build(FALLBACK_EVENT_ROWS, Date.now()).past.filter((e) => !ids.has(e.id));
  return [...past, ...spare].slice(0, count);
}
