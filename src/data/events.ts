/* ============================================================
   EVENTS - the shapes the event UI renders.

   No event is written here: they are the `event` documents in
   the club's Sanity CMS, fetched and mapped onto these shapes by
   src/lib/events.ts (with a real snapshot as the fallback).
   ============================================================ */

export interface PastEvent {
  /** stable id (the CMS slug) */
  id: string;
  year: string;
  name: string;
  /** how it ran: "ON CAMPUS" | "ONLINE" | "HYBRID" (read from the CMS location) */
  tag: string;
  /** display date, e.g. "31 OCT 2025" */
  date: string;
  blurb: string;
  /** the quiet last line of a card: where it was held */
  stat: string;
  /** Real poster URL. When absent, the UI renders a generated
   *  space-themed plate instead - we never invent a poster. */
  poster?: string;
  /** Photographs taken at this event (Sanity image URLs without transform params). */
  photos?: string[];
}

export interface UpcomingEvent {
  /** stable id (the CMS slug) */
  id: string;
  name: string;
  tag: string;
  date: string;
  status: string;
  blurb: string;
  /** where the call to action goes; absent when there is nothing to link to */
  href?: string;
  cta?: string;
  /** Real poster; see PastEvent.poster. */
  poster?: string;
}

/* ============================================================
   DERIVED HELPERS - keep the UI data-driven and reusable.
   ============================================================ */

/** Distinct years present in the archive, newest first. */
export function archiveYears(events: PastEvent[]): string[] {
  return Array.from(new Set(events.map((e) => e.year))).sort(
    (a, b) => Number(b) - Number(a),
  );
}

/** Past events for one year, in the order they appear in the source. */
export function eventsInYear(year: string, events: PastEvent[]): PastEvent[] {
  return events.filter((e) => e.year === year);
}

/** A Sanity image at the given size; with a height it is cropped to that box around the centre. */
export function sanityImage(url: string, width: number, height?: number): string {
  return height
    ? `${url}?w=${width}&h=${height}&fit=crop&auto=format&q=75`
    : `${url}?w=${width}&fit=max&auto=format&q=80`;
}

/** True for links that leave the site. */
export const isExternal = (href: string): boolean => /^https?:/i.test(href);
