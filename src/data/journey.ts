/* ============================================================================
   JOURNEY DATA — 100 Days of Code checkpoints.
   Progress values are illustrative placeholders; replace with live cohort
   data when available (API/CMS).
   ========================================================================== */

export interface Milestone {
  day: number;
  label: string;
  description: string;
}

export const milestones: Milestone[] = [
  { day: 1, label: "Getting Started", description: "Set up your environment, pick a language, write your first line of code." },
  { day: 10, label: "First Steps", description: "Variables, loops, and conditionals. You're speaking the machine's language." },
  { day: 25, label: "Building Momentum", description: "Functions, data structures, and solving your first real problems." },
  { day: 50, label: "Halfway Hero", description: "APIs, databases, and building complete mini-projects." },
  { day: 75, label: "Advanced Terrain", description: "Algorithms, system design, and open-source contributions." },
  { day: 100, label: "Digital Realm Master", description: "You've completed the journey. A new developer is born." },
];

/** current cohort progress (placeholder — wire to live data later) */
export const journeyProgress = {
  daysCompleted: 72,
  participants: "120+",
  linesOfCode: "500K+",
};
