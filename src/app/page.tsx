import HomeClient from "@/components/HomeClient";
import type { PreviewEvent } from "@/components/EventsPreview";
import { STORY_EVENTS } from "@/components/story/stops";
import { getEvents, pickStoryEvents } from "@/lib/events";
import { getWhatsNew } from "@/lib/whatsNew";

// Events and the newest article come from the CMS; re-check at most once an hour.
export const revalidate = 3600;

const PREVIEW_COUNT = 3;

export default async function Home() {
  const events = await getEvents();
  const whatsNew = await getWhatsNew(events);

  /* the preview strip: what is coming up, topped up with the latest events */
  const preview: PreviewEvent[] = [
    ...events.current.map((e) => ({ ...e, href: e.href ?? "/events" })),
    ...events.past.map((e) => ({ ...e, status: "RECENT", href: "/events" })),
  ]
    .slice(0, PREVIEW_COUNT)
    .map(({ id, name, tag, date, status, href, poster }) => ({ id, name, tag, date, status, href, poster }));

  return (
    <HomeClient
      whatsNew={whatsNew}
      preview={preview}
      eventCount={events.past.length + events.current.length}
      storyPast={pickStoryEvents(events.past, STORY_EVENTS)}
      storyUpcoming={events.current}
    />
  );
}
