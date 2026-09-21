/* Each page is a place in the deep space network. The nav menu and the
   travel loader use these: a glyph, a name and a one-line sector call. */

export type GlyphKind = "earth" | "station" | "comet" | "hole" | "constellation" | "pulsar";

export interface Destination {
  href: string;
  label: string;
  glyph: GlyphKind;
  sector: string;
}

export const DESTINATIONS: Destination[] = [
  { href: "/", label: "HOME", glyph: "earth", sector: "Home orbit" },
  { href: "/events", label: "EVENTS", glyph: "station", sector: "Docking ring" },
  { href: "/blog", label: "BLOG", glyph: "comet", sector: "Comet trail" },
  { href: "/crackit", label: "CRACKIT", glyph: "hole", sector: "Event horizon" },
  { href: "/team", label: "TEAM", glyph: "constellation", sector: "Crew constellation" },
  { href: "/quick-code", label: "QUICK CODE", glyph: "pulsar", sector: "Pulsar beam" },
];

export const destFor = (href: string): Destination =>
  DESTINATIONS.find((d) => (d.href === "/" ? href === "/" : href.startsWith(d.href))) ?? DESTINATIONS[0];
