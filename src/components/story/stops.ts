import type { PastEvent, UpcomingEvent } from "@/data/events";

/* ============================================================
   STORY STOPS - every place the signal travels to, in order.

   intro → the most recent events → what is upcoming → what we
   do → the invitation. `weight` is how much scroll a stop gets.

   The scene is laid out for a fixed number of stops
   (STOP_LAYOUT), so the story always visits STORY_EVENTS events:
   up to STORY_UPCOMING upcoming ones, and the most recent past
   events in the remaining slots. Their content is the real event
   data, passed in to buildStops() by the home page.
   ============================================================ */

export type StopKind = "intro" | "past" | "upcoming" | "do" | "invite";

export interface Cta {
  label: string;
  href: string;
  ghost?: boolean;
}

/** A real photograph shown in the scene while its stop is active. */
export interface Still {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/* The two photographs from the old site's About section, kept with the
   content they illustrated there: "Who we are" and "What we do". */
const WHO_WE_ARE: Still = {
  src: "/images/about/who-we-are.jpg",
  alt: "Students with laptops open at a CSAU session in a classroom, a speaker presenting beside a projector screen",
  width: 1280,
  height: 960,
};
const WHAT_WE_DO: Still = {
  src: "/images/about/what-we-do.jpg",
  alt: "An audience at a CSAU talk in a seminar hall, two speakers seated on stage in front of a projector screen",
  width: 1280,
  height: 957,
};

export interface Stop {
  kind: StopKind;
  section: string;
  eyebrow: string;
  count?: string; // "03 / 08"
  lines: string[];
  mark?: string;
  body: string;
  meta?: string[];
  cta?: Cta[];
  still?: Still;
  weight: number;
}

export const SECTIONS: { id: StopKind; label: string }[] = [
  { id: "intro", label: "SIGNAL" },
  { id: "past", label: "ARCHIVE" },
  { id: "upcoming", label: "UPCOMING" },
  { id: "do", label: "WHAT WE DO" },
  { id: "invite", label: "JOIN US" },
];

/** Lines never wrap on screen, so a title line stays within this many characters. */
const LINE_MAX = 15;

/** Split a title over two lines when it is long, so it stays large; longer
 *  titles wrap onto as many lines as they need. */
function splitTitle(name: string): string[] {
  const words = name.split(" ").filter(Boolean);
  if (name.length <= 10 || words.length < 2) return [name];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length;
    const b = words.slice(i).join(" ").length;
    if (Math.abs(a - b) < bestDiff) {
      bestDiff = Math.abs(a - b);
      best = i;
    }
  }
  const two = [words.slice(0, best).join(" "), words.slice(best).join(" ")];
  if (two.every((line) => line.length <= LINE_MAX)) return two;
  const lines: string[] = [];
  for (const word of words) {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= LINE_MAX) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** How many events the story visits, and how many of those may be upcoming ones. */
export const STORY_EVENTS = 10;
export const STORY_UPCOMING = 2;

/** The stops for the given events: always STORY_EVENTS event stops, so pass at
 *  least that many past events. */
export function buildStops(pastEvents: PastEvent[], upcomingEvents: UpcomingEvent[]): Stop[] {
  const upcoming = upcomingEvents.slice(0, STORY_UPCOMING);
  const past = pastEvents.slice(0, STORY_EVENTS - upcoming.length);
  return [
  {
    kind: "intro",
    section: "SIGNAL",
    eyebrow: "CSAU / CEG",
    lines: ["Follow", "the signal."],
    mark: "signal.",
    body: "We are the Computer Society of Anna University, a student-run collective for people who would rather build than wait. Scroll, and the signal will carry you past everything we run.",
    still: WHO_WE_ARE,
    weight: 1.1,
  },
  ...past.map<Stop>((e, i) => ({
    kind: "past",
    section: "ARCHIVE",
    eyebrow: e.tag ? `PAST / ${e.tag}` : "PAST",
    count: `${pad(i + 1)} / ${pad(past.length)}`,
    lines: splitTitle(e.name),
    body: e.blurb,
    meta: [e.date, e.stat].filter(Boolean),
    weight: 1,
  })),
  ...upcoming.map<Stop>((e, i) => ({
    kind: "upcoming",
    section: "UPCOMING",
    eyebrow: `UPCOMING / ${e.status}`,
    count: `${pad(i + 1)} / ${pad(upcoming.length)}`,
    lines: splitTitle(e.name),
    mark: e.name.split(" ").pop(),
    body: e.blurb,
    meta: [e.date, e.tag],
    cta: e.href && e.cta ? [{ label: `${e.cta} →`, href: e.href }] : undefined,
    weight: 1,
  })),
  {
    kind: "do",
    section: "WHAT WE DO",
    eyebrow: "WHAT WE DO / 01",
    lines: ["Learn it by", "building it."],
    mark: "building",
    body: "Hands-on workshops where you leave with something running, not just notes.",
    still: WHAT_WE_DO,
    weight: 1,
  },
  {
    kind: "do",
    section: "WHAT WE DO",
    eyebrow: "WHAT WE DO / 02",
    lines: ["Build it", "in a night."],
    mark: "night.",
    body: "Hackathons put small teams and long hours behind real products.",
    still: WHAT_WE_DO,
    weight: 1,
  },
  {
    kind: "do",
    section: "WHAT WE DO",
    eyebrow: "WHAT WE DO / 03",
    lines: ["Meet people,", "race the clock."],
    mark: "race",
    body: "Speaker sessions and coding contests keep the whole community sharp.",
    still: WHAT_WE_DO,
    weight: 1,
  },
  {
    kind: "invite",
    section: "JOIN US",
    eyebrow: "AN INVITATION",
    lines: ["Join", "the crew."],
    mark: "crew.",
    body: "First-years to final-years, CEG's computer science community writes, breaks and ships together. There is a place on the crew.",
    cta: [
      { label: "MEET THE TEAM →", href: "/team" },
      { label: "ALL EVENTS", href: "/events", ghost: true },
      { label: "GET IN TOUCH", href: "/contact", ghost: true },
    ],
    weight: 2.4,
  },
  ];
}

/* The fixed shape of the story: how many stops there are and how much scroll
   each gets. The scene and the scroll maths read only this, so they do not
   depend on the event data (every event stop weighs the same, whichever kind
   it is). */
export const STOP_LAYOUT: Pick<Stop, "weight">[] = buildStops(
  Array.from({ length: STORY_EVENTS }, (_, i) => ({ id: String(i), year: "", name: "", tag: "", date: "", blurb: "", stat: "" })),
  [],
).map(({ weight }) => ({ weight }));
