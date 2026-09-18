import { PAST_EVENTS, UPCOMING_EVENTS } from "@/data/events";

/* ============================================================
   STORY STOPS — every place the koi swims to, in order.

   intro → each past event → each upcoming event → what we do
   → the invitation. `weight` is how much scroll a stop gets.
   ============================================================ */

export type StopKind = "intro" | "past" | "upcoming" | "do" | "invite";

export interface Cta {
  label: string;
  href: string;
  ghost?: boolean;
}

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
  weight: number;
}

export const SECTIONS: { id: StopKind; label: string }[] = [
  { id: "intro", label: "THE POND" },
  { id: "past", label: "ARCHIVE" },
  { id: "upcoming", label: "UPCOMING" },
  { id: "do", label: "WHAT WE DO" },
  { id: "invite", label: "JOIN US" },
];

/** Split a title over two lines when it is long, so it stays large. */
function splitTitle(name: string): string[] {
  const words = name.split(" ");
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
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

const pad = (n: number) => String(n).padStart(2, "0");

export const STOPS: Stop[] = [
  {
    kind: "intro",
    section: "THE POND",
    eyebrow: "CSAU / CEG",
    lines: ["Follow", "the koi."],
    mark: "koi.",
    body: "We are the Computer Society of Anna University, a student-run collective for people who would rather build than wait. Scroll, and the koi will swim you past everything we run.",
    weight: 1.1,
  },
  ...PAST_EVENTS.map<Stop>((e, i) => ({
    kind: "past",
    section: "ARCHIVE",
    eyebrow: `PAST / ${e.tag}`,
    count: `${pad(i + 1)} / ${pad(PAST_EVENTS.length)}`,
    lines: splitTitle(e.name),
    body: e.blurb,
    meta: [e.date, e.stat],
    weight: 1,
  })),
  ...UPCOMING_EVENTS.map<Stop>((e, i) => ({
    kind: "upcoming",
    section: "UPCOMING",
    eyebrow: `UPCOMING / ${e.status}`,
    count: `${pad(i + 1)} / ${pad(UPCOMING_EVENTS.length)}`,
    lines: splitTitle(e.name),
    mark: e.name.split(" ").pop(),
    body: e.blurb,
    meta: [e.date, e.tag],
    cta: [{ label: `${e.cta} →`, href: e.href }],
    weight: 1,
  })),
  {
    kind: "do",
    section: "WHAT WE DO",
    eyebrow: "WHAT WE DO / 01",
    lines: ["Learn it by", "building it."],
    mark: "building",
    body: "Hands-on workshops where you leave with something running, not just notes.",
    weight: 1,
  },
  {
    kind: "do",
    section: "WHAT WE DO",
    eyebrow: "WHAT WE DO / 02",
    lines: ["Build it", "in a night."],
    mark: "night.",
    body: "Hackathons put small teams and long hours behind real products. HackCEG alone has drawn more than four hundred hackers.",
    weight: 1,
  },
  {
    kind: "do",
    section: "WHAT WE DO",
    eyebrow: "WHAT WE DO / 03",
    lines: ["Meet people,", "race the clock."],
    mark: "race",
    body: "Speaker sessions and contests like Byte Me and Socket Wars keep the whole community sharp.",
    weight: 1,
  },
  {
    kind: "invite",
    section: "JOIN US",
    eyebrow: "AN INVITATION",
    lines: ["Come swim", "with us."],
    mark: "swim",
    body: "First-years to final-years, CEG's computer science community writes, breaks and ships together. There is room in the pond.",
    cta: [
      { label: "MEET THE TEAM →", href: "/team" },
      { label: "ALL EVENTS", href: "/events", ghost: true },
      { label: "PLAY QUICK CODE", href: "/quick-code", ghost: true },
    ],
    weight: 2.4,
  },
];
