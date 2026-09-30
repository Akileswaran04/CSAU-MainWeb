"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { isExternal } from "@/data/events";
import EventPoster from "./EventPoster";

/* ============================================================
   EVENTS PREVIEW - the home-page "Events & Initiatives" section.

   A short intro, a compact strip of what is coming up - topped
   up with the most recent events - and one orange
   EXPLORE button through to the dedicated /events page. The
   items and the total are the real event data, passed in by
   the home page (see src/lib/events.ts). It
   reveals on scroll with a small stagger and respects reduced
   motion (handled in CSS). It reuses the same poster + token
   language as the events page so the two feel like one system.
   ============================================================ */

export interface PreviewEvent {
  id: string;
  name: string;
  tag: string;
  date: string;
  status: string;
  href: string;
  poster?: string;
}

export default function EventsPreview({ items, total }: { items: PreviewEvent[]; total: number }) {
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
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      data-section="events-preview"
      aria-labelledby="events-preview-title"
      className={`evp ${shown ? "is-in" : ""}`}
    >
      <div className="evp-in">
        <div className="evp-head">
          <div className="eyebrow">{"// EVENTS & INITIATIVES"}</div>
          <h2 id="events-preview-title" className="evp-title">
            What we run
          </h2>
          <p className="evp-lede">
            Hackathons, workshops, talks and weekly coding rounds - the things that turn curiosity
            into working code. {total} events and counting, with more on the way.
          </p>
          <Link href="/events" data-route-load className="btn btn-signal evp-explore">
            EXPLORE →
          </Link>
        </div>

        <ul className="evp-strip" aria-label="Upcoming and recent events">
          {items.map((ev, i) => {
            const body = (
              <>
                <EventPoster name={ev.name} tag={ev.tag} poster={ev.poster} />
                <div className="evp-card-body">
                  <span className="evp-card-status">{ev.status}</span>
                  <span className="evp-card-name">{ev.name}</span>
                  <span className="evp-card-date">{ev.date}</span>
                </div>
              </>
            );
            return (
              <li key={ev.id} className="evp-item" style={{ ["--i" as string]: i }}>
                {isExternal(ev.href) ? (
                  <a href={ev.href} target="_blank" rel="noopener noreferrer" className="evp-card">
                    {body}
                  </a>
                ) : (
                  <Link href={ev.href} data-route-load className="evp-card">
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
