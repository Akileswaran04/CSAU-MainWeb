/* ============================================================================
   SITE DATA — navigation + socials.
   NOTE: social hrefs are mock placeholders ("#") until the organization
   supplies real profiles. Swap the `href` values when real URLs exist.
   ========================================================================== */

export interface NavItem {
  index: string;
  label: string;
  href: string;
  /** home-section anchor this route mirrors (for the progress rail) */
  anchor: string;
}

export const realmSections: NavItem[] = [
  { index: "01", label: "GATE", href: "/#gate", anchor: "gate" },
  { index: "02", label: "ORIGIN", href: "/about", anchor: "origin" },
  { index: "03", label: "DOMAINS", href: "/#domains", anchor: "domains" },
  { index: "04", label: "ARCHIVE", href: "/events", anchor: "archive" },
  { index: "05", label: "JOURNEY", href: "/journey", anchor: "journey" },
  { index: "06", label: "PEOPLE", href: "/team", anchor: "people" },
  { index: "07", label: "PORTAL", href: "/join", anchor: "portal" },
];

export interface SocialLink {
  name: string;
  href: string;
  icon: "instagram" | "linkedin" | "github" | "youtube" | "email";
}

export const socialLinks: SocialLink[] = [
  { name: "Instagram", href: "#", icon: "instagram" },
  { name: "LinkedIn", href: "#", icon: "linkedin" },
  { name: "GitHub", href: "#", icon: "github" },
  { name: "Email", href: "mailto:csau@cs.annauniv.edu", icon: "email" },
];

export const loadingLabels: Record<string, string> = {
  "/": "ENTERING REALM",
  "/about": "LOADING ORIGIN",
  "/events": "OPENING ARCHIVE",
  "/journey": "SYNCING JOURNEY",
  "/team": "CONNECTING PEOPLE",
  "/join": "OPENING PORTAL",
};
