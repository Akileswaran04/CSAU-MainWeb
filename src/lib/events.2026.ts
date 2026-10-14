import type { SanityEventRow } from "./events";
import { QC_ABOUT } from "@/data/quickCode";

/* ============================================================
   EVENTS 2026 - the club's 2026 events that are not in the CMS
   yet, taken from their posters (and, for CodeClash and
   CodeStack, the concept note / event form). `image` is a local
   poster under public/. Added to both the live and the fallback
   rows; any one the CMS later has (same slug or title) is left
   to the CMS. Server-only: import it through src/lib/events.ts.
   ============================================================ */
export const EVENTS_2026_ROWS: SanityEventRow[] = [
  { title: "Into The CyberVerse", slug: "into-the-cyberverse", date: "2026-10-09T11:30:00.000Z", location: "First Floor Lab, RCC", image: "/images/events/2026/into-the-cyberverse.webp", text: "A 101 session on cybersecurity.\nSpeaker: Jaiganesh, Founder & CEO, SecureWorldz.\nHands-on demo." },
  { title: "CodeStack", slug: "codestack", date: "2026-09-25T04:00:00.000Z", location: "R1, DCSE / TFL, DCSE", image: "/images/events/2026/codestack.webp", text: "An interactive full-stack development event that tests participants’ knowledge of web technologies, logical problem-solving, debugging, and practical coding skills through a two-round challenge.\nRound 1: MCQ\nRound 2: Bug Finding" },
  { title: "Unlock The Door", slug: "unlock-the-door", date: "2026-09-17T11:30:00.000Z", location: "IT Dept", image: "/images/events/2026/unlock-the-door.webp", text: "Every door hides a clue. Every clue hides the story.\nSolve all 4 Doors\nCollect the Story Lines\nCrack the Final Arrangement\nIdentify the Movie\nCan You Unlock it?" },
  /* ponytail: the date is Week 02's results date (12-13 Sep, the only date in the archive); swap for the series start when the owner sends it */
  { title: "Quick Code", slug: "quick-code", date: "2026-09-12T11:30:00.000Z", location: "", image: QC_ABOUT.poster.src, text: QC_ABOUT.paragraphs.join("\n"), href: "/quick-code" },
  { title: "CodeClash Hackathon", slug: "codeclash-hackathon", date: "2026-09-12T11:30:00.000Z", location: "Online (Zoom)", image: "/images/events/2026/codeclash-hackathon.webp", text: "CodeClash is an online mini hackathon hosted by the University of South Dakota for students who want to build in artificial intelligence, computer science, analytics and engineering. Across a single evening, participants work in small curated teams on real-world technology challenges drawn from industry -- the kind of open-ended problems organisations actually solve." },
  { title: "Campus to Corporate", slug: "campus-to-corporate", date: "2026-06-14T11:30:00.000Z", location: "Online", image: "/images/events/2026/campus-to-corporate.webp", text: "“Guidance Today, Career Success Tomorrow.”\nHarish, CSE Batch - 2025, Verizon\nAbharna Shree, IT Batch - 2026, Natwest\nDeepan, CSE Batch - 2026, Microsoft" },
];
