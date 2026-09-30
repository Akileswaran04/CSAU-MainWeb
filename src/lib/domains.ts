/* ============================================================
   DOMAINS DATA - CSAU's six working domains.

   The domain names and their members are the club's real data,
   stored in the same Sanity CMS the main site uses (project
   wzu06sd5 / production, `team` documents carry a `domain`
   field). Members are fetched live and grouped by domain, with
   a baked-in real snapshot as a fallback if the CMS is
   unreachable.

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

const SANITY_PROJECT_ID = "wzu06sd5";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "v2021-10-21";

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

/* ---- live member fetch from Sanity ---- */

interface SanityTeamMember {
  name?: string;
  domain?: string;
  designation?: string;
  department?: string;
  year?: string;
  lnurl?: string;
}

function orderMembers(a: DomainMember, b: DomainMember): number {
  const rank = (d: string) => (/^head$/i.test(d) ? 0 : 1);
  const r = rank(a.designation) - rank(b.designation);
  return r !== 0 ? r : a.name.localeCompare(b.name);
}

async function fetchMembersByDomain(
  signal?: AbortSignal,
): Promise<Map<string, DomainMember[]> | null> {
  const query = `*[_type == "team" && defined(domain)]{name, domain, designation, department, year, lnurl}`;
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(
    query,
  )}`;

  try {
    const res = await fetch(url, { signal, next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: SanityTeamMember[] };
    const rows = data.result ?? [];
    if (rows.length === 0) return null;

    const byDomain = new Map<string, DomainMember[]>();
    for (const r of rows) {
      const dom = r.domain?.trim();
      const name = r.name?.trim();
      if (!dom || !name) continue;
      const member: DomainMember = {
        name,
        designation: r.designation?.trim() || "Member",
        department: r.department?.trim() || "",
        year: r.year?.trim() || "",
        url: r.lnurl?.trim() || undefined,
      };
      const list = byDomain.get(dom) ?? [];
      list.push(member);
      byDomain.set(dom, list);
    }
    for (const list of byDomain.values()) list.sort(orderMembers);
    return byDomain;
  } catch {
    return null;
  }
}

/**
 * The six domains with their live member lists. Revalidated hourly.
 * Falls back to the baked-in real snapshot if Sanity is unreachable.
 */
export async function getDomains(): Promise<DomainsResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const byDomain = await fetchMembersByDomain(controller.signal);
    if (!byDomain) {
      return { domains: withFallbackMembers(), state: "fallback" };
    }
    const domains = DOMAIN_DEFS.map<Domain>((d) => ({
      ...d,
      members: byDomain.get(d.cmsDomain) ?? [],
    }));
    // If the CMS returned rows but none matched our six domains, use fallback.
    const anyMembers = domains.some((d) => d.members.length > 0);
    if (!anyMembers) return { domains: withFallbackMembers(), state: "fallback" };
    return { domains, state: "ok" };
  } catch {
    return { domains: withFallbackMembers(), state: "fallback" };
  } finally {
    clearTimeout(timeout);
  }
}

function withFallbackMembers(): Domain[] {
  return DOMAIN_DEFS.map<Domain>((d) => ({
    ...d,
    members: (FALLBACK_MEMBERS[d.cmsDomain] ?? []).slice().sort(orderMembers),
  }));
}

/* ============================================================
   FALLBACK - a real snapshot of the CSAU team by domain,
   captured from Sanity. Used only when the live CMS cannot be
   reached. These are genuine members, not invented ones.
   ============================================================ */
const FALLBACK_MEMBERS: Record<string, DomainMember[]> = {
  "Web and App": [
    { name: "Mohamed Imran", designation: "Head", department: "CSE", year: "4th", url: "https://www.linkedin.com/in/mohamed-imran-rmn-206713253" },
    { name: "Tarun Kumar Elangovan", designation: "Head", department: "CSE", year: "4th", url: "https://www.linkedin.com/in/tarun-kumar-x12" },
    { name: "Abhijith", designation: "Deputy Head", department: "CSE", year: "3rd", url: "https://www.linkedin.com/in/abhijith-m-a3541b278/" },
    { name: "Gnana Keshav", designation: "Deputy Head", department: "CSE", year: "3rd", url: "https://github.com/161-Keshav" },
    { name: "Hiba Al Hasan", designation: "Deputy Head", department: "IT", year: "3rd", url: "https://www.linkedin.com/in/hiba-hasan-5b4b64254/" },
    { name: "Suhaib Sharieff", designation: "Deputy Head", department: "IT", year: "3rd", url: "https://www.linkedin.com/in/suhaib-sharieff/" },
  ],
  "CP Wing": [
    { name: "Dakshinesh M", designation: "Head", department: "CSE", year: "4th", url: "https://www.linkedin.com/in/dakshinesh-mandrasalam/" },
    { name: "Neelakandan", designation: "Head", department: "IT", year: "4th", url: "https://linkedin.com/in/neelakandan-s-profile" },
    { name: "Sree Ram T R", designation: "Head", department: "IT", year: "4th", url: "https://www.linkedin.com/in/sreeramtr/" },
    { name: "Devadharshan", designation: "Deputy Head", department: "CSE", year: "3rd", url: "https://www.linkedin.com/in/devadharsan-m-847017276/" },
    { name: "Vilweshwaran", designation: "Deputy Head", department: "IT", year: "3rd", url: "https://www.linkedin.com/in/vilweshwaran-m-a66b2836b/" },
  ],
  Design: [
    { name: "Jayashree J", designation: "Head", department: "IT", year: "4th", url: "https://www.linkedin.com/in/jayashree-jeyapal-008a90297" },
    { name: "Kiruthiga P M", designation: "Head", department: "CSE", year: "4th", url: "https://www.linkedin.com/in/kiruthiga-pm" },
    { name: "Abdullah", designation: "Deputy Head", department: "IT", year: "3rd", url: "https://www.linkedin.com/in/abdullah-suhail-baa383287/" },
    { name: "Asifalekha", designation: "Deputy Head", department: "IT", year: "3rd", url: "https://www.linkedin.com/in/asifa-lekha" },
    { name: "Kashika", designation: "Deputy Head", department: "GI", year: "3rd", url: "https://www.linkedin.com/in/kashika-venkatesan-991550331/" },
    { name: "Nagasurya", designation: "Deputy Head", department: "IT", year: "3rd", url: "https://www.linkedin.com/in/nagasurya-nagamanickam-6ab65a330/" },
  ],
  Events: [
    { name: "Soumya R", designation: "Head", department: "IT", year: "4th", url: "https://www.linkedin.com/in/soumya-renganathen-aa61a1263" },
    { name: "Swarna Karthika N", designation: "Head", department: "IT", year: "4th", url: "https://www.linkedin.com/in/swarna-karthika-n" },
    { name: "Ananyalakshmi", designation: "Deputy Head", department: "IT", year: "3rd", url: "https://www.linkedin.com/in/ananyalakshmi-v-k-93b420344/" },
    { name: "Ragotma Ragavendar", designation: "Deputy Head", department: "CSE", year: "3rd", url: "https://www.linkedin.com/in/ragotma-ragavendar-b6ab90226/" },
    { name: "Sainikitha", designation: "Deputy Head", department: "CSE", year: "3rd", url: "https://www.linkedin.com/in/sainikithailangovan/" },
    { name: "Sanjay Kumaran", designation: "Deputy Head", department: "CSE", year: "3rd", url: "https://www.linkedin.com/in/sanjay-kumaran-s-922441292/" },
    { name: "Sankara Krishnan", designation: "Deputy Head", department: "IT", year: "3rd", url: "https://www.linkedin.com/in/sankara-krishnan-p-3ab7bb28a/" },
    { name: "Suvi Sharon", designation: "Deputy Head", department: "CSE", year: "3rd", url: "http://www.linkedin.com/in/suvi-sharon-5b3907287" },
  ],
  "HR and Logistics": [
    { name: "Abhi Lavanya", designation: "Head", department: "CSE", year: "4th", url: "http://www.linkedin.com/in/abhi-lavanya-597457300" },
    { name: "Harshika Senthil", designation: "Head", department: "CSE", year: "4th", url: "https://www.linkedin.com/in/harshika-senthil-24bb19317" },
    { name: "Abirami Ramanathan", designation: "Deputy Head", department: "CSE", year: "3rd", url: "https://www.linkedin.com/in/abirami-ramanathan-707521285/" },
    { name: "Kavya Sri", designation: "Deputy Head", department: "CSE", year: "3rd", url: "https://www.linkedin.com/in/kavya-sri-v-4547272b3/" },
    { name: "Nikhitaa", designation: "Deputy Head", department: "CSE", year: "3rd", url: "https://www.linkedin.com/in/nikhitaa-muthukumar/" },
    { name: "Srisivanandana", designation: "Deputy Head", department: "IT", year: "3rd", url: "http://www.linkedin.com/in/srisivanandana-umaiyorupagam-287249369" },
  ],
  "Marketing and IR": [
    { name: "Lavanyalashmi E", designation: "Head", department: "IT", year: "4th", url: "https://www.linkedin.com/in/lavanyalashmi-elavarasan-816b7a287/" },
    { name: "Sowmiya D", designation: "Head", department: "CSE", year: "4th", url: "http://www.linkedin.com/in/sowmiya-dasarathan-687b1527a" },
    { name: "Balaji", designation: "Deputy Head", department: "CSE", year: "3rd", url: "https://www.linkedin.com/in/balaji-tamilselvan-b26105344/" },
    { name: "Naslun Wafa", designation: "Deputy Head", department: "CSE", year: "3rd", url: "https://www.linkedin.com/in/naslun-wafa-50961633a/" },
    { name: "Sarveswar", designation: "Deputy Head", department: "CSE", year: "3rd", url: "https://www.linkedin.com/in/sarveswar/" },
    { name: "Vishva Pranav", designation: "Deputy Head", department: "CSE", year: "3rd", url: "https://www.linkedin.com/in/vishva-pranav-048003280/" },
    { name: "Abdullah Mohamed Jahufar", designation: "Deputy Head", department: "EEE", year: "3rd" },
    { name: "Mohamed Huzaifa", designation: "Deputy Head", department: "EEE", year: "3rd" },
  ],
};

/** Initials for a member avatar fallback. */
export function memberInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
