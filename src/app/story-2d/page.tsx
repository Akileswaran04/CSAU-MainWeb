import type { Metadata } from "next";
import SignalRoute from "@/components/story2d/SignalRoute";
import { buildStops, STORY_EVENTS } from "@/components/story/stops";
import { getEvents, pickStoryEvents } from "@/lib/events";

/* TEMPORARY preview of the 2D home story, unlinked and not indexed. Delete this route once the home page
   mounts SignalRoute in place of story/StorySection (one import in HomeClient.tsx), or the 3D story is kept. */

export const metadata: Metadata = {
  title: "Story preview // CSAU",
  robots: { index: false, follow: false },
};

export const revalidate = 3600;

export default async function StoryPreview() {
  const events = await getEvents();
  const stops = buildStops(pickStoryEvents(events.past, STORY_EVENTS), events.current);
  return (
    <main>
      <SignalRoute stops={stops} />
    </main>
  );
}
