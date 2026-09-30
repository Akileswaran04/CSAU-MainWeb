import type { Metadata } from "next";
import Link from "next/link";
import {
  PAST_EVENTS,
  UPCOMING_EVENTS,
  archiveYears,
  eventsInYear,
} from "@/data/events";
import { UpcomingCard, PastCard } from "@/components/EventCards";

/* ============================================================
   EVENTS - the club's events and initiatives.

     • UPCOMING / CURRENT: prominent cards with a poster, a big
       date, category, description, status and a CTA.
     • ARCHIVE: past events grouped by year, with a year rail on
       wide screens and posters on every card.

   Data is driven entirely from src/data/events.ts (no event is
   hardcoded into this JSX). Cards, posters and reveal animations
   are the reusable pieces in EventCards / EventPoster.
   Route: /events
   ============================================================ */

export const metadata: Metadata = {
  title: "Events // CSAU - Computer Society of Anna University",
  description:
    "Hackathons, workshops, talks and coding rounds from the Computer Society of Anna University, CEG - what's coming up and the full archive.",
};

export default function EventsPage() {
  const years = archiveYears(PAST_EVENTS);
  const hasUpcoming = UPCOMING_EVENTS.length > 0;
  const hasArchive = PAST_EVENTS.length > 0;

  return (
    <main id="content" className="pg">
      <div className="pg-in">
        <header className="ev-head">
          <div className="eyebrow">What we run</div>
          <h1 className="pg-title">Events &amp; Initiatives</h1>
          <p className="pg-lede">
            Hackathons, workshops, talks and competitions. Here&apos;s what&apos;s coming up next,
            and every event we&apos;ve run - archived by year.
          </p>
        </header>

        {/* ── UPCOMING / CURRENT ── */}
        <section className="ev-upcoming" aria-labelledby="ev-upcoming-h">
          <div className="ev-section-head">
            <h2 id="ev-upcoming-h" className="ev-section-title">
              Upcoming &amp; Current
            </h2>
            <span className="ev-section-count tabular">
              {UPCOMING_EVENTS.length} live
            </span>
          </div>

          {hasUpcoming ? (
            <div className="ev-up-grid">
              {UPCOMING_EVENTS.map((ev, i) => (
                <UpcomingCard key={ev.name} event={ev} index={i} />
              ))}
            </div>
          ) : (
            <div className="ev-empty">
              <p className="ev-empty-title">Nothing on the launchpad right now</p>
              <p className="ev-empty-body">
                There are no upcoming events scheduled at the moment. Check the archive below for
                what we&apos;ve run, or follow along for the next drop.
              </p>
            </div>
          )}
        </section>

        {/* ── ARCHIVE ── */}
        {hasArchive && (
          <section className="ev-archive" aria-labelledby="ev-archive-h">
            <div className="ev-section-head">
              <h2 id="ev-archive-h" className="ev-section-title">
                Archive
              </h2>
              <nav className="ev-year-rail" aria-label="Jump to a year">
                {years.map((year) => (
                  <a key={year} href={`#ev-${year}`} className="ev-year-chip">
                    {year}
                  </a>
                ))}
              </nav>
            </div>

            {years.map((year) => (
              <section key={year} className="ev-group" aria-labelledby={`ev-${year}`}>
                <h3 id={`ev-${year}`} className="ev-year">
                  {year}
                </h3>
                <div className="ev-past-grid">
                  {eventsInYear(year, PAST_EVENTS).map((ev, i) => (
                    <PastCard key={ev.name} event={ev} index={i} />
                  ))}
                </div>
              </section>
            ))}
          </section>
        )}

        <p className="pg-next">
          <Link href="/crackit" data-route-load className="btn btn-primary">
            Current coding event →
          </Link>
        </p>
      </div>
    </main>
  );
}
