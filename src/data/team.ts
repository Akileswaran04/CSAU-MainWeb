/* ============================================================================
   TEAM DATA — the people of the realm.
   Photos are pending from the organization; components render graceful
   monogram placeholders when `photo` is null. Social hrefs are mocks.
   ========================================================================== */

export type Accent = "cyan" | "magenta";

export interface TeamMember {
  name: string;
  role: string;
  domain: string;
  initials: string;
  accent: Accent;
  photo: string | null;
  social: { github?: string; linkedin?: string };
}

export const teamMembers: TeamMember[] = [
  { name: "Arun Kumar", role: "President", domain: "AI / ML", initials: "AK", accent: "cyan", photo: null, social: {} },
  { name: "Priya Sharma", role: "Vice President", domain: "Web Dev", initials: "PS", accent: "magenta", photo: null, social: {} },
  { name: "Rajesh Patel", role: "Technical Lead", domain: "Cloud & DevOps", initials: "RP", accent: "cyan", photo: null, social: {} },
  { name: "Sneha Reddy", role: "AI Lead", domain: "AI / ML", initials: "SR", accent: "magenta", photo: null, social: {} },
  { name: "Vikram Singh", role: "Web Dev Lead", domain: "Web Dev", initials: "VS", accent: "cyan", photo: null, social: {} },
  { name: "Ananya Nair", role: "Design Lead", domain: "UI / UX", initials: "AN", accent: "magenta", photo: null, social: {} },
  { name: "Karthik Iyer", role: "CP Lead", domain: "Coding & CP", initials: "KI", accent: "cyan", photo: null, social: {} },
  { name: "Deepa Krishnan", role: "Security Lead", domain: "Cybersecurity", initials: "DK", accent: "magenta", photo: null, social: {} },
];
