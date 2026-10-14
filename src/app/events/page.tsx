import type { Metadata } from "next";
import { getEvents } from "@/lib/events";
import EventsBoard from "./EventsBoard";
import "./events-page.css";

/* ============================================================
   EVENTS - the title with Upcoming & Current beside it, then
   the archive as one wall of posters, a block per year
   (EventsBoard.tsx), with a bar of kinds and years.

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
    <main id="content" className="pg evc-page">
      <EventsBoard
        past={past}
        current={current}
        head={
          <header className="ev-head">
            <h1 className="pg-title">Events &amp; Initiatives</h1>
            {state === "fallback" && (
              <p className="dm-notice" role="status">
                <span className="dm-notice-dot" aria-hidden />
                Showing the latest saved archive.
              </p>
            )}
          </header>
        }
      />
    </main>
  );
}
