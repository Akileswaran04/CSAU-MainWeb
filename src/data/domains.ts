/* ============================================================================
   DOMAIN DATA — each domain is a node in the digital ecosystem map.
   Content is intentionally data-driven so CSAU can update it without
   touching components (and later back it with a CMS/API).
   ========================================================================== */

export type Accent = "cyan" | "magenta";

export interface Domain {
  slug: string;
  name: string;
  description: string;
  accent: Accent;
  icon: string;
  /** sub-areas of the domain's micro-world */
  areas: string[];
}

export const domains: Domain[] = [
  {
    slug: "ai",
    name: "AI / ML",
    description:
      "Artificial Intelligence & Machine Learning — building intelligent systems that learn and adapt.",
    accent: "cyan",
    icon: "🧠",
    areas: ["NEURAL PATTERNS", "MODELS", "VISION", "LANGUAGE", "AGENTS"],
  },
  {
    slug: "web",
    name: "Web Dev",
    description:
      "Full-stack development — from frontend frameworks to backend architectures.",
    accent: "magenta",
    icon: "🌐",
    areas: ["INTERFACE", "FRONTEND", "BACKEND", "DEPLOYMENT", "EXPERIENCE"],
  },
  {
    slug: "data",
    name: "Data Science",
    description:
      "Data Analytics & Visualization — turning raw data into actionable insight.",
    accent: "cyan",
    icon: "📊",
    areas: ["COLLECT", "CLEAN", "ANALYZE", "VISUALIZE", "PREDICT"],
  },
  {
    slug: "coding",
    name: "Coding & CP",
    description:
      "Competitive Programming — sharpening algorithmic thinking and problem-solving.",
    accent: "magenta",
    icon: "⚡",
    areas: ["ALGORITHMS", "DATA STRUCTURES", "CONTESTS", "OPTIMIZATION"],
  },
  {
    slug: "cybersecurity",
    name: "Cybersecurity",
    description: "Ethical Hacking & Security — protecting the digital frontier.",
    accent: "cyan",
    icon: "🔐",
    areas: ["NETWORK", "DEFENSE", "IDENTITY", "SYSTEMS", "PROTOCOLS"],
  },
  {
    slug: "cloud",
    name: "Cloud & DevOps",
    description: "Infrastructure & Automation — scaling systems reliably.",
    accent: "magenta",
    icon: "☁️",
    areas: ["CONTAINERS", "PIPELINES", "ORCHESTRATION", "OBSERVABILITY"],
  },
  {
    slug: "design",
    name: "UI / UX",
    description: "Design & Experience — crafting interfaces that delight and inspire.",
    accent: "cyan",
    icon: "🎨",
    areas: ["RESEARCH", "SYSTEMS", "PROTOTYPING", "MOTION"],
  },
  {
    slug: "open-source",
    name: "Open Source",
    description: "Community & Collaboration — contributing to the global ecosystem.",
    accent: "magenta",
    icon: "💻",
    areas: ["GIT", "CONTRIBUTIONS", "COMMUNITIES", "MAINTENANCE"],
  },
];

export function getDomain(slug: string): Domain | undefined {
  return domains.find((d) => d.slug === slug);
}
