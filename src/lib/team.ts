import { DOMAINS_META } from "./domains";

/* ============================================================
   TEAM DATA - the real CSAU roster.

   Every person comes from the `team` documents in the club's
   Sanity CMS (project wzu06sd5 / production) - the same records
   csau.in/team and the Domains page read. Members are fetched
   live on the server (revalidated hourly), with a baked-in real
   snapshot as the fallback if the CMS is unreachable.

   Nothing here is invented: name, designation, domain,
   department, year, photo and profile link are the CMS fields.

   Faculty Advisor: the CMS holds no faculty record yet. Any
   `team` document whose designation mentions faculty / advisor
   (e.g. "Faculty Advisor") is picked up automatically and leads
   the roster - no code change needed.
   ============================================================ */

export type TeamGroup = "faculty" | "office" | "heads" | "deputies" | "members";

export interface TeamLink {
  /** "LinkedIn" | "GitHub" | "Profile" */
  label: string;
  url: string;
}

export interface TeamMember {
  /** stable id (the CMS slug) */
  id: string;
  name: string;
  /** the CMS designation, e.g. "President", "Head", "Deputy Head" */
  designation: string;
  /** display role, e.g. "President", "Web & App Head" */
  role: string;
  group: TeamGroup;
  /** display name of the domain ("" for office bearers) */
  domain: string;
  /** id of the matching entry in DOMAINS_META, if there is one */
  domainId?: string;
  /** short department code, e.g. "CSE", "IT" */
  department: string;
  /** e.g. "4th" */
  year: string;
  /** Sanity image URL without transform params ("" if none) */
  photo: string;
  link?: TeamLink;
}

export type TeamState = "ok" | "fallback";

export interface TeamResult {
  members: TeamMember[];
  state: TeamState;
}

/** Section titles, in display order. */
export const TEAM_GROUPS: { id: TeamGroup; title: string }[] = [
  { id: "faculty", title: "Faculty Advisor" },
  { id: "office", title: "Office Bearers" },
  { id: "heads", title: "Domain Heads" },
  { id: "deputies", title: "Deputy Heads" },
  { id: "members", title: "Core Members" },
];

const SANITY_PROJECT_ID = "wzu06sd5";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "v2021-10-21";
const SANITY_IMAGE_BASE = `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/`;

/* ---- helpers safe on client and server ---- */

/** Square portrait at the given pixel size (resized by the Sanity CDN). */
export function photoUrl(photo: string, size: number): string {
  if (!photo) return "";
  return `${photo}?w=${size}&h=${size}&fit=crop&auto=format&q=80`;
}

/** "CSE · 4th year" */
export function memberMeta(m: Pick<TeamMember, "department" | "year">): string {
  return [m.department, m.year ? `${m.year} year` : ""].filter(Boolean).join(" · ");
}

/** Initials for avatar fallbacks */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ---- CMS row -> member ---- */

interface SanityTeamRow {
  name?: string;
  designation?: string;
  domain?: string;
  department?: string;
  year?: string;
  lnurl?: string;
  slug?: string;
  photo?: string;
}

function groupOf(designation: string): TeamGroup {
  if (/faculty|advis[eo]r|professor|staff/i.test(designation)) return "faculty";
  if (/^head$/i.test(designation)) return "heads";
  if (/^deputy head$/i.test(designation)) return "deputies";
  if (/member/i.test(designation)) return "members";
  return "office";
}

/** President, then the secretaries, then any other office the CMS adds. */
function officeRank(designation: string): number {
  if (/president/i.test(designation)) return 0;
  if (/general secretary/i.test(designation)) return 1;
  if (/joint secretary/i.test(designation)) return 2;
  return 3;
}

/** Keep only links that point at an actual profile, without tracking params. */
function toLink(raw?: string): TeamLink | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  try {
    const u = new URL(value);
    if (u.pathname.replace(/\/+$/, "") === "") return undefined; // bare site root
    u.protocol = "https:";
    u.search = "";
    u.hash = "";
    const host = u.hostname.replace(/^www\./, "");
    const label = host.endsWith("linkedin.com") ? "LinkedIn" : host.endsWith("github.com") ? "GitHub" : "Profile";
    return { label, url: u.toString() };
  } catch {
    return undefined;
  }
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function toMember(r: SanityTeamRow): TeamMember | null {
  const name = r.name?.trim();
  if (!name) return null;
  const designation = r.designation?.trim() || "Member";
  const cmsDomain = r.domain?.trim() || "";
  const meta = DOMAINS_META.find((d) => d.cmsDomain === cmsDomain);
  const domain = meta?.name ?? cmsDomain;
  const group = groupOf(designation);
  const photo = r.photo?.trim() || "";

  return {
    id: r.slug?.trim() || slugify(name),
    name,
    designation,
    role: domain && (group === "heads" || group === "deputies") ? `${domain} ${designation}` : designation,
    group,
    domain,
    domainId: meta?.id,
    department: r.department?.trim() || "",
    year: r.year?.trim() || "",
    photo: photo.startsWith("http") ? photo : photo ? SANITY_IMAGE_BASE + photo : "",
    link: toLink(r.lnurl),
  };
}

function domainRank(m: TeamMember): number {
  const i = DOMAINS_META.findIndex((d) => d.id === m.domainId);
  return i === -1 ? DOMAINS_META.length : i;
}

function orderMembers(a: TeamMember, b: TeamMember): number {
  const g = TEAM_GROUPS.findIndex((x) => x.id === a.group) - TEAM_GROUPS.findIndex((x) => x.id === b.group);
  if (g !== 0) return g;
  if (a.group === "office") {
    const o = officeRank(a.designation) - officeRank(b.designation);
    if (o !== 0) return o;
  }
  const d = domainRank(a) - domainRank(b);
  if (d !== 0) return d;
  return a.domain.localeCompare(b.domain) || a.name.localeCompare(b.name);
}

function toRoster(rows: SanityTeamRow[]): TeamMember[] {
  const seen = new Set<string>();
  const members: TeamMember[] = [];
  for (const r of rows) {
    const m = toMember(r);
    if (!m || seen.has(m.id)) continue;
    seen.add(m.id);
    members.push(m);
  }
  return members.sort(orderMembers);
}

/* ---- live fetch from Sanity ---- */

async function fetchRows(signal?: AbortSignal): Promise<SanityTeamRow[] | null> {
  const query = `*[_type == "team"]{name, designation, domain, department, year, lnurl, "slug": slug.current, "photo": image.asset->url}`;
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(
    query,
  )}`;

  try {
    const res = await fetch(url, { signal, next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: SanityTeamRow[] };
    const rows = data.result ?? [];
    return rows.length ? rows : null;
  } catch {
    return null;
  }
}

/**
 * The whole roster, ordered faculty -> office bearers -> heads -> deputies.
 * Revalidated hourly. Falls back to the baked-in real snapshot if Sanity
 * is unreachable.
 */
export async function getTeam(): Promise<TeamResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const rows = await fetchRows(controller.signal);
    const members = rows ? toRoster(rows) : [];
    if (members.length === 0) return { members: toRoster(FALLBACK_ROWS), state: "fallback" };
    return { members, state: "ok" };
  } catch {
    return { members: toRoster(FALLBACK_ROWS), state: "fallback" };
  } finally {
    clearTimeout(timeout);
  }
}

/* ============================================================
   FALLBACK - a real snapshot of the CSAU `team` documents,
   captured from Sanity on 2026-09-30. Used only when the live
   CMS cannot be reached. These are genuine members, not
   invented ones. `photo` is the Sanity asset file name.
   ============================================================ */
const FALLBACK_ROWS: SanityTeamRow[] = [
  { name: "Deiva Raja B", designation: "General Secretary", domain: "", department: "IT", year: "4th", lnurl: "https://www.linkedin.com/in/deivarajab/", slug: "deiva-raja-b", photo: "f87028d78d8cb133577b3c7bfc8c298483eb3988-1073x1073.jpg" },
  { name: "Sharukesh K", designation: "President", domain: "", department: "CSE", year: "4th", lnurl: "http://www.linkedin.com/in/sharukesh-kannan-9696a5264", slug: "sharukesh-k", photo: "232ae86f19ece010cc801ee2f667a3dfd05205f3-1079x1079.jpg" },
  { name: "Akshaya Srikrishna", designation: "President", domain: "", department: "CSE", year: "4th", lnurl: "http://www.linkedin.com/in/akshaya-srikrishna-527116330", slug: "akshaya-srikrishna", photo: "bce66035482c9501cc8fbcc18f2275d986476b62-864x864.jpg" },
  { name: "Jayashree J", designation: "Head", domain: "Design", department: "IT", year: "4th", lnurl: "https://www.linkedin.com/in/jayashree-jeyapal-008a90297?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", slug: "jayashree-j", photo: "77655e2d41442b4d065a5d36d33bd1adda135f80-687x687.jpg" },
  { name: "Sanjay T G", designation: "Joint Secretary", domain: "", department: "CSE", year: "4th", lnurl: "https://www.linkedin.com/in/tgsanjay", slug: "sanjay-t-g", photo: "a8b53e33352ddd62e1ff579cd90d48eef27823ba-1080x1080.jpg" },
  { name: "Abharna Shree M", designation: "General Secretary", domain: "", department: "IT", year: "4th", lnurl: "https://www.linkedin.com/in/abharna-shree-m-500543253?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", slug: "abharna-shree-m", photo: "4af1cd8b09e5bd6c4eb3df1e55388d0b99f2e55b-1046x1046.jpg" },
  { name: "Soumya R", designation: "Head", domain: "Events", department: "IT", year: "4th", lnurl: "https://www.linkedin.com/in/soumya-renganathen-aa61a1263", slug: "soumya-r", photo: "25754a08c8b6d52560b4a3bf9dfbc8f31cd21279-1060x1060.jpg" },
  { name: "Swarna Karthika N", designation: "Head", domain: "Events", department: "IT", year: "4th", lnurl: "https://www.linkedin.com/in/swarna-karthika-n", slug: "swarna-karthika-n", photo: "b2b82efa6324d01476038b1cc4da7b10e68367fa-864x864.jpg" },
  { name: "Lavanyalashmi E", designation: "Head", domain: "Marketing and IR", department: "IT", year: "4th", lnurl: "https://www.linkedin.com/in/lavanyalashmi-elavarasan-816b7a287/", slug: "lavanyalashmi-e", photo: "584024862970f6880d9792d20b18b6d6c6cfb970-864x864.jpg" },
  { name: "Mohamed Imran", designation: "Head", domain: "Web and App", department: "CSE", year: "4th", lnurl: "https://www.linkedin.com/in/mohamed-imran-rmn-206713253", slug: "mohamed-imran", photo: "37ab3f9d9cb18bb4762a6d5712685963c89c293d-880x880.png" },
  { name: "Kiruthiga P M", designation: "Head", domain: "Design", department: "CSE", year: "4th", lnurl: "https://www.linkedin.com/in/kiruthiga-pm", slug: "kiruthiga-p-m", photo: "31adb7f6fb9071763f37655cd80944de5eb19ce0-1080x1080.jpg" },
  { name: "Harshika Senthil", designation: "Head", domain: "HR and Logistics", department: "CSE", year: "4th", lnurl: "https://www.linkedin.com/in/harshika-senthil-24bb19317?trk=contact-info", slug: "harshika-senthil", photo: "2ab8111be040cc17bd32e66ef1f0d0bff0faf0c9-864x864.jpg" },
  { name: "Sowmiya D", designation: "Head", domain: "Marketing and IR", department: "CSE", year: "4th", lnurl: "http://www.linkedin.com/in/sowmiya-dasarathan-687b1527a", slug: "sowmiya-d", photo: "58e12ee84da5ece23a9408d12bdda66ea7869701-1077x1077.jpg" },
  { name: "Abhi Lavanya", designation: "Head", domain: "HR and Logistics", department: "CSE", year: "4th", lnurl: "http://www.linkedin.com/in/abhi-lavanya-597457300", slug: "abhi-lavanya", photo: "7852ef14916daf211a6861ad7c38bfd740bcd78f-1079x1079.jpg" },
  { name: "Tarun Kumar Elangovan", designation: "Head", domain: "Web and App", department: "CSE", year: "4th", lnurl: "https://www.linkedin.com/in/tarun-kumar-x12", slug: "tarun-kumar-elangovan", photo: "d8271922ac3ebffac3f35f5095bd65b935fc811d-960x960.png" },
  { name: "Neelakandan", designation: "Head", domain: "CP Wing", department: "IT", year: "4th", lnurl: "https://linkedin.com/in/neelakandan-s-profile", slug: "neelakandan", photo: "8164e4403ea1ee85f8678d7382fd715aaf4b8ef3-692x682.png" },
  { name: "Sree Ram T R", designation: "Head", domain: "CP Wing", department: "IT", year: "4th", lnurl: "https://www.linkedin.com/in/sreeramtr/", slug: "sree-ram-t-r", photo: "760b16d177b53beaf3e3cacb7a676d75a88eb10d-1800x1800.png" },
  { name: "Dakshinesh M", designation: "Head", domain: "CP Wing", department: "CSE", year: "4th", lnurl: "https://www.linkedin.com/in/dakshinesh-mandrasalam/", slug: "dakshinesh-m", photo: "86deb41db60927dc2764db1072d269ab26283622-1065x1065.png" },
  { name: "Gnana Keshav", designation: "Deputy Head", domain: "Web and App", department: "CSE", year: "3rd", lnurl: "https://github.com/161-Keshav", slug: "gnana-keshav", photo: "9c918ad771a482020c8c4b58ee448287c38104b4-840x840.png" },
  { name: "Suvi Sharon", designation: "Deputy Head", domain: "Events", department: "CSE", year: "3rd", lnurl: "http://www.linkedin.com/in/suvi-sharon-5b3907287", slug: "suvi-sharon", photo: "48152cb465e0380138a7e65849309acb4b655968-868x868.png" },
  { name: "Ragotma Ragavendar", designation: "Deputy Head", domain: "Events", department: "CSE", year: "3rd", lnurl: "https://www.linkedin.com/in/ragotma-ragavendar-b6ab90226/", slug: "ragotma-ragavendar", photo: "925fc230cb732d35385a8cfaa1fbe836a2681236-2496x2496.png" },
  { name: "Sanjay Kumaran", designation: "Deputy Head", domain: "Events", department: "CSE", year: "3rd", lnurl: "https://www.linkedin.com/in/sanjay-kumaran-s-922441292/", slug: "sanjay-kumaran", photo: "24bb3dcd842109632734984fb3cf0162b663b6e8-864x864.png" },
  { name: "Sainikitha", designation: "Deputy Head", domain: "Events", department: "CSE", year: "3rd", lnurl: "https://www.linkedin.com/in/sainikithailangovan/", slug: "sainikitha", photo: "4386cfb6c6b0bbe42d15cca6f2151c4cf0e99617-2394x2394.png" },
  { name: "Ananyalakshmi", designation: "Deputy Head", domain: "Events", department: "IT", year: "3rd", lnurl: "https://www.linkedin.com/in/ananyalakshmi-v-k-93b420344/", slug: "ananyalakshmi", photo: "d73b23b7d1e6eb60029b5bf21c39b087105348ac-1814x1814.png" },
  { name: "Sankara Krishnan", designation: "Deputy Head", domain: "Events", department: "IT", year: "3rd", lnurl: "https://www.linkedin.com/in/sankara-krishnan-p-3ab7bb28a/", slug: "sankara-krishnan", photo: "206116f6d7a01e2ee6bb2d7906e7a16053a044f8-2771x2771.png" },
  { name: "Nikhitaa", designation: "Deputy Head", domain: "HR and Logistics", department: "CSE", year: "3rd", lnurl: "https://www.linkedin.com/in/nikhitaa-muthukumar/", slug: "nikhitaa", photo: "0969de65e25560ed937aed60650086247f043817-959x959.png" },
  { name: "Kavya Sri", designation: "Deputy Head", domain: "HR and Logistics", department: "CSE", year: "3rd", lnurl: "https://www.linkedin.com/in/kavya-sri-v-4547272b3/", slug: "kavya-sri", photo: "53544b49fb55598f97c6cb40e82fc613323f5f40-2412x2412.png" },
  { name: "Abirami Ramanathan", designation: "Deputy Head", domain: "HR and Logistics", department: "CSE", year: "3rd", lnurl: "https://www.linkedin.com/in/abirami-ramanathan-707521285/", slug: "abirami-ramanathan", photo: "5be890811c4ebdde9abad4f855c9e51b86b3866e-768x768.png" },
  { name: "Srisivanandana", designation: "Deputy Head", domain: "HR and Logistics", department: "IT", year: "3rd", lnurl: "http://www.linkedin.com/in/srisivanandana-umaiyorupagam-287249369", slug: "srisivanandana", photo: "a1a14825676d94dda77c81cb2f442b8799b5331a-1916x1916.png" },
  { name: "Vishva Pranav", designation: "Deputy Head", domain: "Marketing and IR", department: "CSE", year: "3rd", lnurl: "https://www.linkedin.com/in/vishva-pranav-048003280/", slug: "vishva-pranav", photo: "01bff7620718355b99d84201f860a145ba51bb71-345x345.png" },
  { name: "Abdullah Mohamed Jahufar", designation: "Deputy Head", domain: "Marketing and IR", department: "EEE", year: "3rd", lnurl: "https://www.linkedin.com/", slug: "abdullah-mohamed-jahufar", photo: "3b902e61a3183a48122158df6b82e4d082d62237-683x683.png" },
  { name: "Balaji", designation: "Deputy Head", domain: "Marketing and IR", department: "CSE", year: "3rd", lnurl: "https://www.linkedin.com/in/balaji-tamilselvan-b26105344/", slug: "balaji", photo: "d17926ff22c1966189dc24c08d046c9b47929b2e-681x681.png" },
  { name: "Sarveswar", designation: "Deputy Head", domain: "Marketing and IR", department: "CSE", year: "3rd", lnurl: "https://www.linkedin.com/in/sarveswar/", slug: "sarveswar", photo: "ce17abf92224cec4ef4acf23a8801e1eb095db29-1372x1372.png" },
  { name: "Mohamed Huzaifa", designation: "Deputy Head", domain: "Marketing and IR", department: "EEE", year: "3rd", lnurl: "https://www.linkedin.com/", slug: "mohamed-huzaifa", photo: "34a387771ac031e61f39f87693ce95e05ba9874b-1958x1958.png" },
  { name: "Naslun Wafa", designation: "Deputy Head", domain: "Marketing and IR", department: "CSE", year: "3rd", lnurl: "https://www.linkedin.com/in/naslun-wafa-50961633a/", slug: "naslun-wafa", photo: "10bac18af90cc7f1812153789a0d3e0a92b43dd4-464x464.png" },
  { name: "Suhaib Sharieff", designation: "Deputy Head", domain: "Web and App", department: "IT", year: "3rd", lnurl: "https://www.linkedin.com/in/suhaib-sharieff/", slug: "suhaib-sharieff", photo: "7fe947bc4350fe790b77e202f23033b036d70f1a-768x768.png" },
  { name: "Abhijith", designation: "Deputy Head", domain: "Web and App", department: "CSE", year: "3rd", lnurl: "https://www.linkedin.com/in/abhijith-m-a3541b278/", slug: "abhijith", photo: "c955ac4e6d5560d3842e66f6710aa8e9d253b27d-793x793.png" },
  { name: "Hiba Al Hasan", designation: "Deputy Head", domain: "Web and App", department: "IT", year: "3rd", lnurl: "https://www.linkedin.com/in/hiba-hasan-5b4b64254/", slug: "hiba-al-hasan", photo: "7b0b81c62e6facf7e6af3c1517d9558f1b17fcf7-869x869.png" },
  { name: "Devadharshan", designation: "Deputy Head", domain: "CP Wing", department: "CSE", year: "3rd", lnurl: "https://www.linkedin.com/in/devadharsan-m-847017276/", slug: "devadharshan", photo: "84000911c07d6c311a49e0ec21326d0c90bf6fad-525x525.png" },
  { name: "Vilweshwaran", designation: "Deputy Head", domain: "CP Wing", department: "IT", year: "3rd", lnurl: "https://www.linkedin.com/in/vilweshwaran-m-a66b2836b/", slug: "vilweshwaran", photo: "96a6592a92307905bf55756ce1b4bf28c2dc52b0-916x916.png" },
  { name: "Asifalekha", designation: "Deputy Head", domain: "Design", department: "IT", year: "3rd", lnurl: "https://www.linkedin.com/in/asifa-lekha", slug: "asifalekha", photo: "47d57f1584c66cfd17b7f8cc07813395eaf1d4fd-502x502.png" },
  { name: "Nagasurya", designation: "Deputy Head", domain: "Design", department: "IT", year: "3rd", lnurl: "https://www.linkedin.com/in/nagasurya-nagamanickam-6ab65a330/", slug: "nagasurya", photo: "174eb803725b027a2fc831a2ffd3b8d9c179d413-1511x1511.png" },
  { name: "Abdullah", designation: "Deputy Head", domain: "Design", department: "IT", year: "3rd", lnurl: "https://www.linkedin.com/in/abdullah-suhail-baa383287/", slug: "abdullah", photo: "34dc3b091e1a4e15e5057ff8909c6065e4e35311-945x945.png" },
  { name: "Kashika", designation: "Deputy Head", domain: "Design", department: "GI", year: "3rd", lnurl: "https://www.linkedin.com/in/kashika-venkatesan-991550331/", slug: "kashika", photo: "744d2d06b91132a6c93ecf26a0ad788184fcff3b-1552x1552.png" },
  { name: "Saravana Kumar", designation: "Deputy Head", domain: "Editing", department: "CSE", year: "3rd", lnurl: "https://www.linkedin.com/in/saravanakumar7447", slug: "saravana-kumar", photo: "aae10cccda8256c8179c442c075001e4ffc0398d-502x502.png" },
];
