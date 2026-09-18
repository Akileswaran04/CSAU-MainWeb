/* ============================================================
   EVENTS DATA — single source for the /events archive and the
   home-page koi story (which swims to every event in turn).
   ============================================================ */

export interface PastEvent {
  year: string;
  name: string;
  tag: string;
  date: string;
  blurb: string;
  stat: string;
}

export interface UpcomingEvent {
  name: string;
  tag: string;
  date: string;
  status: string;
  blurb: string;
  href: string;
  cta: string;
}

export const PAST_EVENTS: PastEvent[] = [
  {
    year: "2026",
    name: "HackCEG 6.0",
    tag: "HACKATHON",
    date: "21–22 FEB 2026",
    blurb:
      "36-hour build sprint across AI, web and systems — 400+ hackers, 60 teams shipped working products.",
    stat: "412 HACKERS",
  },
  {
    year: "2026",
    name: "Byte Me",
    tag: "CODING",
    date: "14 JAN 2026",
    blurb:
      "Speed programming contest spanning DSA, competitive math and debugging under a ticking clock.",
    stat: "286 REGISTERED",
  },
  {
    year: "2025",
    name: "Firmware Fridays",
    tag: "WORKSHOP",
    date: "OCT–DEC 2025",
    blurb:
      "Six-week embedded series — students went from blinking an LED to driving a full sensor mesh.",
    stat: "150 SEATS",
  },
  {
    year: "2025",
    name: "DevCon CEG",
    tag: "CONFERENCE",
    date: "06 SEP 2025",
    blurb:
      "Community conference on modern web and AI with speakers from Bengaluru, Chennai and remote.",
    stat: "320 ATTENDEES",
  },
  {
    year: "2025",
    name: "Socket Wars",
    tag: "COMPETITION",
    date: "23 AUG 2025",
    blurb:
      "Real-time multiplayer coding duel — the arena throws two coders into one shared socket.",
    stat: "128 PLAYERS",
  },
  {
    year: "2025",
    name: "CSAU Design Lab",
    tag: "WORKSHOP",
    date: "18 JUL 2025",
    blurb:
      "Hands-on product-design and motion workshop covering Figma, GSAP and shader fundamentals.",
    stat: "96 SEATS",
  },
  {
    year: "2024",
    name: "HackCEG 5.0",
    tag: "HACKATHON",
    date: "16–17 NOV 2024",
    blurb:
      "Flagship 36-hour hackathon — 350 participants built for healthcare, civic and climate themes.",
    stat: "350 HACKERS",
  },
  {
    year: "2024",
    name: "Intro to Compilers",
    tag: "TALK",
    date: "09 NOV 2024",
    blurb:
      "A walk through lexers, parsers and codegen — ending with everyone compiling a tiny language.",
    stat: "210 SEATS",
  },
];

/* Logic Lift-Off and Quick Code are live pages on this site.
   HackCEG 7.0 is a PLACEHOLDER (no dates announced yet) — replace
   or remove it once the real details are confirmed. */
export const UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    name: "Logic Lift-Off",
    tag: "CODING",
    date: "SEP 2026",
    status: "LIVE NOW",
    blurb:
      "Five questions, forty-five minutes. Sit the online assessment and see where you land on the leaderboard.",
    href: "/crackit",
    cta: "TAKE THE ROUND",
  },
  {
    name: "Quick Code",
    tag: "WEEKLY",
    date: "EVERY WEEK",
    status: "OPEN",
    blurb:
      "5 questions. 5 minutes. One chance. A new round every week and a fresh leaderboard to climb.",
    href: "/quick-code",
    cta: "PLAY THIS WEEK",
  },
  {
    name: "HackCEG 7.0",
    tag: "HACKATHON",
    date: "DATES TO BE ANNOUNCED",
    status: "SOON",
    blurb:
      "The flagship build sprint returns. Start finding your team — the theme drops with the dates.",
    href: "/events",
    cta: "SEE PAST EDITIONS",
  },
];
