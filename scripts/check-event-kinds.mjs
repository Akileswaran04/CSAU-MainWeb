/* Checks that kindOf (src/data/events.ts) sorts the club's events into the right kinds.
   Run: node scripts/check-event-kinds.mjs */
import assert from "node:assert/strict";
import { kindOf } from "../src/data/events.ts";

const cases = {
  hackathon: ["Code Cycle", "Kavach Hackathon - CEG's Internal Ideathon"],
  workshop: ["Vibe Coding Workshop: From Idea to AI", "Gen AI Masterclass", "Git Set Go - 2", "DSA Express 2.0", "MERN Session 5: Intro to MongoDB", "Blockchain 101", "Cascading into UI/UX and Figma"],
  contest: ["TOUR de CODE", "Codexcelerate", "Jokers Gamble", "The SQL Sleuth", "The Solvers' Showdown", "Abacus Web Design", "Code Royale: Battle of Coders"],
  talk: ["Intern and Insights ", "Profile Boost", "Career Vitals", "Resume Rewind", "Webinar on Global Tech Development", "Intern Mentor - III"],
  games: ["hit bull's eye", "Quizzers", "Tech Charades", "Murderous Beats", "Escape Room", "Know Your Roll No", "Fruit Ninja - Slice and Solve"],
};
for (const [kind, names] of Object.entries(cases)) for (const n of names) assert.equal(kindOf(n), kind, n);
assert.equal(kindOf("Hacker Instinct - A venture into Cyberspace", "CSAU organized a Cybersecurity Seminar"), "talk");
console.log("event kinds ok");
