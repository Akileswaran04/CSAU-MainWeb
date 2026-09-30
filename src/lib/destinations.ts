/* Each page is a place in the deep space network. The nav menu and the
   travel loader use these: a glyph, a name and a one-line sector call. */

export type GlyphKind = "earth" | "station" | "comet" | "hole" | "constellation" | "pulsar" | "rings" | "dish";

export interface Destination {
  href: string;
  label: string;
  glyph: GlyphKind;
  sector: string;
  /** The route works, but it is left out of the nav menu and the travel loader's row of places. */
  hidden?: boolean;
}

export const DESTINATIONS: Destination[] = [
  { href: "/", label: "HOME", glyph: "earth", sector: "Home orbit" },
  { href: "/events", label: "EVENTS", glyph: "station", sector: "Docking ring" },
  { href: "/blog", label: "BLOG", glyph: "comet", sector: "Comet trail" },
  { href: "/domains", label: "DOMAINS", glyph: "rings", sector: "Ringed world" },
  { href: "/crackit", label: "CRACKIT", glyph: "hole", sector: "Event horizon" },
  { href: "/team", label: "TEAM", glyph: "constellation", sector: "Crew constellation" },
  // Out of the nav until a real, CMS-backed round exists; the page still explains the format.
  { href: "/quick-code", label: "QUICK CODE", glyph: "pulsar", sector: "Pulsar beam", hidden: true },
  { href: "/contact", label: "CONTACT", glyph: "dish", sector: "Open channel" },
];

/** The places listed in the nav menu and in the travel loader's row. */
export const NAV_DESTINATIONS: Destination[] = DESTINATIONS.filter((d) => !d.hidden);

export const destFor = (href: string): Destination =>
  DESTINATIONS.find((d) => (d.href === "/" ? href === "/" : href.startsWith(d.href))) ?? DESTINATIONS[0];
