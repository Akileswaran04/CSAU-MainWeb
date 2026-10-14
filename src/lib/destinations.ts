/* Each page is a place in the deep space network. The nav menu and the
   travel loader use these: a glyph and a name. */

export type GlyphKind = "earth" | "station" | "comet" | "constellation" | "pulsar" | "rings" | "dish";

export interface Destination {
  href: string;
  label: string;
  /** how the place reads in the nav and the travel loader, mixed case */
  name: string;
  glyph: GlyphKind;
  /** the stop on the way to the Sun: planet, distance, and the gate it boards from (Roman, and its number) */
  planet: string;
  au: string;
  gate: string;
  gateNo: number;
  /** The route works, but it is left out of the nav menu and the travel loader's row of places. */
  hidden?: boolean;
}

export const DESTINATIONS: Destination[] = [
  { href: "/", label: "HOME", name: "Home", glyph: "earth", planet: "Neptune", au: "30.1 AU", gate: "I", gateNo: 1 },
  { href: "/events", label: "EVENTS", name: "Events", glyph: "station", planet: "Saturn", au: "9.5 AU", gate: "II", gateNo: 2 },
  { href: "/blog", label: "BLOG", name: "Blog", glyph: "comet", planet: "Jupiter", au: "5.2 AU", gate: "III", gateNo: 3 },
  // Out of the nav for now: the Saturn idea is kept for somewhere else.
  { href: "/domains", label: "DOMAINS", name: "Domains", glyph: "rings", planet: "Mars", au: "1.52 AU", gate: "IV", gateNo: 4, hidden: true },
  { href: "/team", label: "TEAM", name: "Team", glyph: "constellation", planet: "Venus", au: "0.72 AU", gate: "VI", gateNo: 6 },
  // Out of the nav until a real, CMS-backed round exists; the page still explains the format.
  { href: "/quick-code", label: "QUICK CODE", name: "Quick Code", glyph: "pulsar", planet: "Ceres", au: "2.77 AU", gate: "IX", gateNo: 9, hidden: true },
  { href: "/contact", label: "CONTACT", name: "Contact", glyph: "dish", planet: "Pluto", au: "39.5 AU", gate: "VIII", gateNo: 8 },
];

/** The places listed in the nav menu and in the travel loader's row. */
export const NAV_DESTINATIONS: Destination[] = DESTINATIONS.filter((d) => !d.hidden);

export const destFor = (href: string): Destination =>
  DESTINATIONS.find((d) => (d.href === "/" ? href === "/" : href.startsWith(d.href))) ?? DESTINATIONS[0];
