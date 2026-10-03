import { getTeam } from "./team";

/* ============================================================
   DOMAINS DATA - CSAU's six working domains.

   The domain names are the club's real data, matching the
   `domain` field of the `team` documents in the Sanity CMS
   (project wzu06sd5 / production). Members are the /team roster
   (src/lib/team.ts) grouped by domain.

   The description / principles / activities describe what each
   real wing actually does - written to match the club, not
   invented facts about people.
   ============================================================ */

export interface DomainMember {
  name: string;
  /** e.g. "Head" | "Deputy Head" */
  designation: string;
  /** short department code, e.g. "CSE", "IT", "EEE" */
  department: string;
  /** e.g. "4th" */
  year: string;
  /** LinkedIn / profile URL, if present */
  url?: string;
  /** the member's photograph (Sanity image URL without transform params, or a local path), if there is one */
  photo?: string;
}

export interface Domain {
  /** stable id / slug */
  id: string;
  /** display name, matching the CMS `domain` value */
  name: string;
  /** the CMS `domain` string this maps to (for member grouping) */
  cmsDomain: string;
  /** one-line identity, shown on hover and as the detail lede */
  blurb: string;
  /** longer description for the focused view */
  description: string;
  /** what the domain optimises for */
  principles: string[];
  /** the concrete things the domain does */
  activities: string[];
  members: DomainMember[];
}

/* ---- the six domains (order = ring order on Saturn) ---- */

/** Static definition: everything except the live member list. */
const DOMAIN_DEFS: Omit<Domain, "members">[] = [
  {
    id: "web-and-app",
    name: "Web & App",
    cmsDomain: "Web and App",
    blurb: "Builds and ships the club's web and mobile products.",
    description:
      "The engineering core of CSAU. This wing designs, builds and maintains the society's websites, portals and apps - from the public site to the internal tools that run events and coding rounds.",
    principles: ["Ship working software", "Own the whole stack", "Keep it maintainable"],
    activities: [
      "Building and maintaining csau.in and internal tools",
      "Full-stack workshops and pair-programming sessions",
      "Powering event registration and coding-round platforms",
    ],
  },
  {
    id: "cp-wing",
    name: "CP Wing",
    cmsDomain: "CP Wing",
    blurb: "The competitive-programming and problem-solving wing.",
    description:
      "The competitive-programming wing. It sets problems, runs the weekly and flagship coding rounds, and coaches members through data structures, algorithms and contest strategy.",
    principles: ["Sharpen problem-solving", "Practice under pressure", "Learn by contest"],
    activities: [
      "Setting and curating contest problem sets",
      "Running CrackIT and practice rounds",
      "DSA and algorithms coaching sessions",
    ],
  },
  {
    id: "design",
    name: "Design",
    cmsDomain: "Design",
    blurb: "Gives everything the club makes its visual identity.",
    description:
      "The visual voice of the society. Design owns branding, posters, social creatives, event identities and the look of the club's products - turning ideas into things people want to look at.",
    principles: ["Clarity before decoration", "One coherent identity", "Design for the audience"],
    activities: [
      "Event branding, posters and social creatives",
      "Product and interface design for club tools",
      "Design workshops and critique sessions",
    ],
  },
  {
    id: "events",
    name: "Events",
    cmsDomain: "Events",
    blurb: "Plans and runs every workshop, talk and hackathon.",
    description:
      "The team that makes things happen on the ground. Events plans, schedules and executes the club's workshops, talks, hackathons and competitions end to end - the logistics behind every gathering.",
    principles: ["Plan for the details", "Deliver on the day", "Make it memorable"],
    activities: [
      "Organising hackathons, workshops and speaker sessions",
      "Scheduling, venue and on-day coordination",
      "Running competitions and flagship events",
    ],
  },
  {
    id: "hr-and-logistics",
    name: "HR & Logistics",
    cmsDomain: "HR and Logistics",
    blurb: "Keeps the crew and the operations running.",
    description:
      "The backbone of the society. HR & Logistics handles recruitment, member coordination, resources and the operational groundwork that keeps every other domain moving smoothly.",
    principles: ["People first", "Stay organised", "Enable everyone else"],
    activities: [
      "Recruitment drives and member onboarding",
      "Resource, inventory and logistics planning",
      "Internal coordination across domains",
    ],
  },
  {
    id: "marketing-and-ir",
    name: "Marketing & IR",
    cmsDomain: "Marketing and IR",
    blurb: "Grows the community and builds industry relations.",
    description:
      "The club's outward voice. Marketing & IR runs outreach and social campaigns, grows the community, and builds the industry and sponsor relationships that back the society's events.",
    principles: ["Tell the story well", "Grow the network", "Build real relationships"],
    activities: [
      "Social media and outreach campaigns",
      "Sponsorship and industry relations",
      "Community growth and partnerships",
    ],
  },
];

/** The list of domains without members - safe to use anywhere (client or server). */
export const DOMAINS_META: Omit<Domain, "members">[] = DOMAIN_DEFS;

export type DomainsState = "ok" | "fallback";

export interface DomainsResult {
  domains: Domain[];
  state: DomainsState;
}

/* ---- members, from the team roster ---- */

function orderMembers(a: DomainMember, b: DomainMember): number {
  const rank = (d: string) => (/^head$/i.test(d) ? 0 : 1);
  const r = rank(a.designation) - rank(b.designation);
  return r !== 0 ? r : a.name.localeCompare(b.name);
}

/**
 * The six domains with their members. Members come from the same roster
 * as /team (the CMS plus the current leadership, with its own fallback),
 * so both pages always list the same people.
 */
export async function getDomains(): Promise<DomainsResult> {
  const { members, state } = await getTeam();
  const domains = DOMAIN_DEFS.map<Domain>((d) => ({
    ...d,
    members: members
      .filter((m) => m.domainId === d.id)
      .map<DomainMember>((m) => ({
        name: m.name,
        designation: m.designation,
        department: m.department,
        year: m.year,
        url: m.link?.url,
        photo: m.photo || undefined,
      }))
      .sort(orderMembers),
  }));
  return { domains, state };
}
