/* ============================================================
   STORY STOPS - every place the ship stops, in order.

   Follow the signal → who we are → what we do → three of our
   events → Quick Code → the crew → contact → once round the Sun,
   and out past it to a constellation of every page (one tap away;
   the page ends there).

   OWNER CONTENT: MOCK below is placeholder copy, only there to show
   the layout. Replace each line with the club's own words (an empty
   string or list is simply not shown).
   ============================================================ */

export type StopKind = "intro" | "who" | "what" | "event" | "quickcode" | "crew" | "contact" | "map";

export interface Cta {
  label: string;
  href: string;
  ghost?: boolean;
}

export interface Stop {
  kind: StopKind;
  lines: string[];
  mark?: string;
  body: string;
  /** a short list under the body */
  items?: string[];
  cta?: Cta[];
  weight: number;
}

/** The opening shot, under the hero: where Earth sits on the screen (its centre, -1 to 1 across and up, and its
    radius in half-heights). The story's 3D opening is framed to it, and the hero paints its 2D Earth there while
    the story loads, so the one hands over to the other in place. */
export const OPENING_EARTH = {
  wide: { at: [-0.5, 0.8], r: 1.45 },
  portrait: { at: [-0.3, 0.72], r: 0.9 }, // as on wide screens: high, the ship below it
};

/** The rail: one tick per section, at its first stop. */
export const SECTIONS: { id: StopKind; label: string }[] = [
  { id: "who", label: "WHO WE ARE" },
  { id: "what", label: "WHAT WE DO" },
  { id: "event", label: "EVENTS" },
  { id: "quickcode", label: "QUICK CODE" },
  { id: "crew", label: "CREW" },
  { id: "contact", label: "CONTACT" },
  { id: "map", label: "ORBIT" },
];

/* the club's own words; a blank line starts a new paragraph */
const WHO =
  "Since 1972, CSAU has been part of CEG’s journey through technology, ideas, and discovery. One of the university’s oldest technical societies, we operate under the Ramanujan Computing Centre, bringing students together through peer learning, technical events, workshops, and industry interactions. We create spaces to explore, share knowledge, and grow, no matter which branch you come from.";
const WHAT =
  "More than a club, a space to explore.\n\nCSAU brings students together to discover interests, exchange ideas, and turn curiosity into something meaningful. From learning alongside peers to connecting with the industry, we create opportunities to grow, collaborate, and put ideas into action. Through initiatives like Eureka and Tour De Code, we make those experiences count.";

const CODECYCLE =
  "An inter-college hackathon where teams turn ideas into working solutions, tackling real-world problems through creativity, coding, and collaboration.";
const EUREKA =
  "An inter-college technical fest featuring challenges in competitive programming, system design, UI/UX, artificial intelligence, machine learning, and emerging technologies.";
const QUICK_CODE =
  "Quick Code is a five-week weekly MCQ challenge series organised by the Computer Society of Anna University (CSAU) to strengthen students' programming knowledge, core computer science fundamentals, and problem-solving abilities through short, time-bound challenges.";
const TOUR_DE_CODE =
  "A team-based DSA showdown combining coding challenges, virtual currency, and puzzle rounds where strategy matters as much as problem-solving.";

/* MOCK - placeholder copy, to be replaced by the club's own text */
const MOCK = {
  contact: "One line inviting people to get in touch.",
};

const EVENTS_CTA: Cta[] = [{ label: "EVENTS →", href: "/events" }];

export const STOPS: Stop[] = [
  { kind: "intro", lines: ["Follow", "the signal."], mark: "signal.", body: "", weight: 1.1 },
  { kind: "who", lines: ["Who are we"], body: WHO, weight: 1.2 },
  { kind: "what", lines: ["What we do"], body: WHAT, weight: 1.2 },
  { kind: "event", lines: ["CodeCycle"], body: CODECYCLE, cta: EVENTS_CTA, weight: 1 },
  { kind: "event", lines: ["Eureka"], body: EUREKA, cta: EVENTS_CTA, weight: 1 },
  { kind: "event", lines: ["Tour De Code"], body: TOUR_DE_CODE, cta: EVENTS_CTA, weight: 1 },
  { kind: "quickcode", lines: ["Quick Code"], body: QUICK_CODE, cta: [{ label: "QUICK CODE →", href: "/quick-code" }], weight: 1 },
  {
    kind: "crew",
    lines: ["The crew"],
    body: "The crew behind them all.",
    cta: [{ label: "MEET THE CREW →", href: "/team" }],
    weight: 1,
  },
  { kind: "contact", lines: ["Contact"], body: MOCK.contact, cta: [{ label: "CONTACT →", href: "/contact" }], weight: 1 },
  // heavy on purpose: half of it is the flight once round the Sun, drawn out slow (raise it to slow the loop more)
  { kind: "map", lines: [], body: "", weight: 5 },
];
