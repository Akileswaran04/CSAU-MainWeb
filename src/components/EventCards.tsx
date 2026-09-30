"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PastEvent, UpcomingEvent } from "@/data/events";
import EventPoster from "./EventPoster";

/* ============================================================
   EVENT CARDS - reusable, data-driven pieces for the events page.

     • Reveal: a shared IntersectionObserver wrapper fades/rises
       each item once, respecting reduced motion (handled in CSS).
     • UpcomingCard: poster + a visually prominent date, category,
       description, status and a CTA to the live page.
     • PastCard: poster + date/tag + name + blurb + stat, tuned
       for the year-grouped archive.
   Nothing is hardcoded here - callers pass the event objects.
   ============================================================ */

/** Split a date like "21–22 FEB 2026" into a prominent day/month and a year. */
function splitDate(date: string): { lead: string; year?: string } {
  const m = date.match(/^(.*?)(\b\d{4})\s*$/);
  if (m) return { lead: m[1].trim(), year: m[2] };
  return { lead: date };
}

/** Reveal-on-scroll wrapper. Children fade/rise in with a small stagger. */
export function Reveal({
  children,
  index = 0,
  className = "",
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`ev-reveal ${shown ? "is-in" : ""} ${className}`.trim()}
      style={{ ["--i" as string]: index }}
    >
      {children}
    </div>
  );
}

/** A visually prominent date block, reused by upcoming cards. */
function DateBlock({ date }: { date: string }) {
  const { lead, year } = splitDate(date);
  return (
    <div className="ev-date" aria-hidden>
      <span className="ev-date-lead">{lead}</span>
      {year && <span className="ev-date-year">{year}</span>}
    </div>
  );
}

export function UpcomingCard({ event, index = 0 }: { event: UpcomingEvent; index?: number }) {
  const isLive = /live|open/i.test(event.status);
  return (
    <Reveal index={index}>
      <article className="ev-up-card">
        <EventPoster name={event.name} tag={event.tag} poster={event.poster} variant="feature" />
        <div className="ev-up-body">
          <div className="ev-up-meta">
            <span className={`ev-status ${isLive ? "is-live" : ""}`}>
              <span className="ev-status-dot" aria-hidden />
              {event.status}
            </span>
            <span className="ev-chip">{event.tag}</span>
          </div>

          <h3 className="ev-up-name">{event.name}</h3>

          {/* Prominent date - the most emphasised metadata on the card. */}
          <DateBlock date={event.date} />
          <span className="sr-only">Date: {event.date}</span>

          <p className="ev-up-blurb">{event.blurb}</p>

          <Link href={event.href} data-route-load className="btn btn-signal ev-up-cta">
            {event.cta} →
          </Link>
        </div>
      </article>
    </Reveal>
  );
}

export function PastCard({ event, index = 0 }: { event: PastEvent; index?: number }) {
  return (
    <Reveal index={index}>
      <article className="ev-past-card">
        <EventPoster name={event.name} tag={event.tag} poster={event.poster} />
        <div className="ev-past-body">
          <div className="ev-meta">
            <span>{event.date}</span>
            <span className="ev-tag">{event.tag}</span>
          </div>
          <h3 className="ev-name">{event.name}</h3>
          <p className="ev-blurb">{event.blurb}</p>
          <div className="ev-stat">{event.stat}</div>
        </div>
      </article>
    </Reveal>
  );
}
