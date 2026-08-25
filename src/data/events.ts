/* ============================================================================
   ARCHIVE DATA — events as archive entries / mission logs.
   NOTE: mock dataset — swap in real CSAU events (or a CMS/API later) without
   touching components. `highlights` are structural placeholders until real
   post-event reports are supplied by the organization.
   ========================================================================== */

export interface ArchiveEvent {
  slug: string;
  entryNo: string;
  year: string;
  category: "Workshop" | "Hackathon" | "Bootcamp" | "Competition";
  title: string;
  description: string;
  highlights: string[];
}

export const events: ArchiveEvent[] = [
  {
    slug: "hacksphere-2025",
    entryNo: "004",
    year: "2025",
    category: "Hackathon",
    title: "HackSphere 2025",
    description:
      "48-hour hackathon with 200+ teams competing to build innovative solutions for real-world problems.",
    highlights: ["48-hour build window", "Team-based format", "Real-world problem tracks"],
  },
  {
    slug: "ai-foundations-bootcamp",
    entryNo: "003",
    year: "2025",
    category: "Workshop",
    title: "AI Foundations Bootcamp",
    description:
      "A 2-week intensive workshop covering neural networks, NLP, and computer vision fundamentals.",
    highlights: ["Neural network fundamentals", "NLP basics", "Computer vision intro"],
  },
  {
    slug: "full-stack-web-dev",
    entryNo: "002",
    year: "2024",
    category: "Bootcamp",
    title: "Full-Stack Web Dev",
    description:
      "12-week bootcamp taking students from HTML basics to deploying full-stack Next.js applications.",
    highlights: ["12-week structured track", "Frontend to backend", "Deployment practice"],
  },
  {
    slug: "codeclash-x",
    entryNo: "001",
    year: "2024",
    category: "Competition",
    title: "CodeClash X",
    description:
      "Annual competitive programming showdown — 300+ participants, 50 problems, 3 hours.",
    highlights: ["Timed contest format", "Algorithmic problem sets", "Open to all departments"],
  },
  {
    slug: "cybersecurity-101",
    entryNo: "000",
    year: "2024",
    category: "Workshop",
    title: "Cybersecurity 101",
    description:
      "Hands-on workshop on ethical hacking, network security, and penetration testing.",
    highlights: ["Hands-on labs", "Network security basics", "Ethical hacking intro"],
  },
  {
    slug: "hacksphere-sustainability",
    entryNo: "005",
    year: "2023",
    category: "Hackathon",
    title: "HackSphere Sustainability",
    description:
      "36-hour hackathon focused on sustainability tech, attracting teams from 15+ colleges.",
    highlights: ["Sustainability theme", "Inter-college teams", "36-hour format"],
  },
  {
    slug: "cloud-computing-aws",
    entryNo: "006",
    year: "2023",
    category: "Workshop",
    title: "Cloud Computing with AWS",
    description:
      "Introduction to cloud infrastructure, serverless computing, and deployment pipelines.",
    highlights: ["Cloud fundamentals", "Serverless concepts", "CI/CD pipelines"],
  },
  {
    slug: "data-science-foundations",
    entryNo: "007",
    year: "2023",
    category: "Bootcamp",
    title: "Data Science Foundations",
    description:
      "8-week program covering Python, statistics, pandas, and real-world data analysis projects.",
    highlights: ["Python + pandas", "Statistics core", "Project-based learning"],
  },
];

export function getEvent(slug: string): ArchiveEvent | undefined {
  return events.find((e) => e.slug === slug);
}
