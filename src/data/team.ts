export type TeamRole = "president" | "head" | "deputy";
export type TeamColor = "cyan" | "magenta";
export type TeamStatus = "online" | "busy" | "away";

export interface TeamMember {
  name: string;
  role: string;
  domain: string;
  social: { github?: string; linkedin?: string; twitter?: string };
  initials: string;
  color: TeamColor;
  status: TeamStatus;
  roleLevel: TeamRole;
}

/* ============================================================
   TEAM — THE COMMAND CENTER

   Presidents  (2)  → 3-col grid, large cards
   Heads       (6)  → 3-col grid, medium cards
   Deputies   (14)  → 4-col grid, compact cards
   ============================================================ */

export const presidents: TeamMember[] = [
  {
    name: "Arun Kumar",
    role: "President",
    domain: "AI / ML",
    social: { github: "#", linkedin: "#", twitter: "#" },
    initials: "AK",
    color: "cyan",
    status: "online",
    roleLevel: "president",
  },
  {
    name: "Priya Sharma",
    role: "Vice President",
    domain: "Web Dev",
    social: { github: "#", linkedin: "#", twitter: "#" },
    initials: "PS",
    color: "magenta",
    status: "online",
    roleLevel: "president",
  },
];

export const heads: TeamMember[] = [
  {
    name: "Rajesh Patel",
    role: "Technical Lead",
    domain: "Cloud & DevOps",
    social: { github: "#", linkedin: "#", twitter: "#" },
    initials: "RP",
    color: "cyan",
    status: "online",
    roleLevel: "head",
  },
  {
    name: "Sneha Reddy",
    role: "AI Lead",
    domain: "AI / ML",
    social: { github: "#", linkedin: "#", twitter: "#" },
    initials: "SR",
    color: "magenta",
    status: "busy",
    roleLevel: "head",
  },
  {
    name: "Vikram Singh",
    role: "Web Dev Lead",
    domain: "Web Dev",
    social: { github: "#", linkedin: "#", twitter: "#" },
    initials: "VS",
    color: "cyan",
    status: "online",
    roleLevel: "head",
  },
  {
    name: "Ananya Nair",
    role: "Design Lead",
    domain: "UI / UX",
    social: { github: "#", linkedin: "#", twitter: "#" },
    initials: "AN",
    color: "magenta",
    status: "online",
    roleLevel: "head",
  },
  {
    name: "Karthik Iyer",
    role: "CP Lead",
    domain: "Coding & CP",
    social: { github: "#", linkedin: "#", twitter: "#" },
    initials: "KI",
    color: "cyan",
    status: "away",
    roleLevel: "head",
  },
  {
    name: "Deepa Krishnan",
    role: "Security Lead",
    domain: "Cybersecurity",
    social: { github: "#", linkedin: "#", twitter: "#" },
    initials: "DK",
    color: "magenta",
    status: "online",
    roleLevel: "head",
  },
];

export const deputies: TeamMember[] = [
  {
    name: "Aisha Verma",
    role: "ML Deputy",
    domain: "AI / ML",
    social: { github: "#", linkedin: "#" },
    initials: "AV",
    color: "cyan",
    status: "online",
    roleLevel: "deputy",
  },
  {
    name: "Bharat Menon",
    role: "Frontend Deputy",
    domain: "Web Dev",
    social: { github: "#", linkedin: "#" },
    initials: "BM",
    color: "magenta",
    status: "online",
    roleLevel: "deputy",
  },
  {
    name: "Chitra Das",
    role: "Backend Deputy",
    domain: "Web Dev",
    social: { github: "#", linkedin: "#" },
    initials: "CD",
    color: "cyan",
    status: "online",
    roleLevel: "deputy",
  },
  {
    name: "Dev Arjun",
    role: "Cloud Deputy",
    domain: "Cloud & DevOps",
    social: { github: "#", linkedin: "#" },
    initials: "DA",
    color: "magenta",
    status: "away",
    roleLevel: "deputy",
  },
  {
    name: "Esha Kapoor",
    role: "Design Deputy",
    domain: "UI / UX",
    social: { linkedin: "#" },
    initials: "EK",
    color: "cyan",
    status: "online",
    roleLevel: "deputy",
  },
  {
    name: "Farhan Ali",
    role: "CP Deputy",
    domain: "Coding & CP",
    social: { github: "#" },
    initials: "FA",
    color: "magenta",
    status: "online",
    roleLevel: "deputy",
  },
  {
    name: "Gauri Prasad",
    role: "Security Deputy",
    domain: "Cybersecurity",
    social: { github: "#", linkedin: "#" },
    initials: "GP",
    color: "cyan",
    status: "busy",
    roleLevel: "deputy",
  },
  {
    name: "Hiten Shah",
    role: "ML Deputy",
    domain: "AI / ML",
    social: { github: "#" },
    initials: "HS",
    color: "magenta",
    status: "online",
    roleLevel: "deputy",
  },
  {
    name: "Ira Joshi",
    role: "Frontend Deputy",
    domain: "Web Dev",
    social: { github: "#", linkedin: "#" },
    initials: "IJ",
    color: "cyan",
    status: "online",
    roleLevel: "deputy",
  },
  {
    name: "Jayant Rao",
    role: "DevOps Deputy",
    domain: "Cloud & DevOps",
    social: { github: "#" },
    initials: "JR",
    color: "magenta",
    status: "online",
    roleLevel: "deputy",
  },
  {
    name: "Kavya Suresh",
    role: "UI Deputy",
    domain: "UI / UX",
    social: { linkedin: "#" },
    initials: "KS",
    color: "cyan",
    status: "away",
    roleLevel: "deputy",
  },
  {
    name: "Lakshmi Narayan",
    role: "CP Deputy",
    domain: "Coding & CP",
    social: { github: "#" },
    initials: "LN",
    color: "magenta",
    status: "online",
    roleLevel: "deputy",
  },
  {
    name: "Meera Chandran",
    role: "Data Deputy",
    domain: "AI / ML",
    social: { github: "#", linkedin: "#" },
    initials: "MC",
    color: "cyan",
    status: "online",
    roleLevel: "deputy",
  },
  {
    name: "Nikhil Gupta",
    role: "Security Deputy",
    domain: "Cybersecurity",
    social: { github: "#" },
    initials: "NG",
    color: "magenta",
    status: "online",
    roleLevel: "deputy",
  },
];
