import Link from "next/link";
import { PAST_EVENTS } from "@/data/events";

/* ============================================================
   EVENTS - the archive of past events, grouped by year.
   A year label sits beside its events on wide screens and above
   them on narrow ones; entries are separated by hairlines, not
   boxed into identical cards.
   Route: /events
   ============================================================ */

export default function EventsPage() {
  const years = Array.from(new Set(PAST_EVENTS.map((e) => e.year)));

  return (
    <main className="pg">
      <div className="pg-in">
        <header>
          <div className="eyebrow">What we run</div>
          <h1 className="pg-title">Events</h1>
          <p className="pg-lede">
            Hackathons, workshops, talks and competitions. Every event we have run, archived by year.
          </p>
        </header>

        <div className="ev-archive">
          {years.map((year) => (
            <section key={year} className="ev-group" aria-labelledby={`ev-${year}`}>
              <h2 id={`ev-${year}`} className="ev-year">
                {year}
              </h2>
              <div className="ev-list">
                {PAST_EVENTS.filter((e) => e.year === year).map((ev) => (
                  <article key={ev.name} className="ev-row">
                    <div className="ev-meta">
                      <span>{ev.date}</span>
                      <span className="ev-tag">{ev.tag}</span>
                    </div>
                    <h3 className="ev-name">{ev.name}</h3>
                    <p className="ev-blurb">{ev.blurb}</p>
                    <div className="ev-stat">{ev.stat}</div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="pg-next">
          <Link href="/crackit" data-route-load className="btn btn-primary">
            Current coding event →
          </Link>
        </p>
      </div>
    </main>
  );
}
