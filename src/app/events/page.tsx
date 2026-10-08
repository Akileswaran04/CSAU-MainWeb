import type { Metadata } from "next";
import Link from "next/link";
import { getEvents } from "@/lib/events";
import EventsOrbit from "./EventsOrbit";
import "./events-page.css";

/* ============================================================
   EVENTS - the archive on an orbit (EventsOrbit.tsx).

     • HERO: the title, Upcoming & Current under it (or the empty
       launchpad), and the way to get in touch.
     • ARCHIVE: as it scrolls in, rings round a dark planet expand
       and the planet grows; then one ring of the chosen year's
       events spreads out along two huge arcs over it. The year
       pills sit in the planet's middle.

   Every event is the CMS record (src/lib/events.ts); none is
   written here. Route: /events
   ============================================================ */

export const metadata: Metadata = {
  title: "Events // CSAU - Computer Society of Anna University",
  description:
    "Hackathons, workshops, talks and coding rounds from the Computer Society of Anna University, CEG - what's coming up and the full archive.",
};

export const revalidate = 3600;

export default async function EventsPage() {
  const { current, past, state } = await getEvents();

  return (
    <main id="content" className="evo">
      <EventsOrbit
        past={past}
        current={current}
        head={
          <header className="ev-head">
            <div className="eyebrow">What we run</div>
            <h1 className="pg-title">Events &amp; Initiatives</h1>
            <p className="pg-lede">
              Hackathons, workshops, talks and competitions. Here&apos;s what&apos;s coming up next,
              and every event we&apos;ve run - archived by year.
            </p>
            {state === "fallback" && (
              <p className="dm-notice" role="status">
                <span className="dm-notice-dot" aria-hidden />
                Showing the latest saved archive.
              </p>
            )}
          </header>
        }
      >
        <p className="pg-next">
          <Link href="/contact" data-route-load className="btn btn-primary">
            Get in touch →
          </Link>
        </p>
      </EventsOrbit>
    </main>
  );
}
