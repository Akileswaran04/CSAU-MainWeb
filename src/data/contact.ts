/* ============================================================
   CONTACT DATA - the club's real channels.

   Every entry is one csau.in already publishes: the four social
   profiles in its footer, the address its contact form delivers
   to, and the Medium publication the blog reads (see
   src/lib/blog.ts). The base is the one named in the club's own
   "about" copy. Nothing here is invented - to add a channel
   (phone, Discord, WhatsApp...) add a row once it is official.
   ============================================================ */

export interface ContactChannel {
  id: string;
  /** what the channel is, e.g. "Instagram" */
  label: string;
  /** what to show as the address / handle */
  handle: string;
  href: string;
  /** one plain line on what the channel is for */
  note: string;
  /** offer a copy-to-clipboard button (addresses people paste elsewhere) */
  copy?: boolean;
}

export const CONTACT_EMAIL = "csau.new@gmail.com";

export const CONTACT_CHANNELS: ContactChannel[] = [
  {
    id: "email",
    label: "Email",
    handle: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
    note: "Questions, collaborations and anything that needs a reply.",
    copy: true,
  },
  {
    id: "instagram",
    label: "Instagram",
    handle: "@csau_ceg",
    href: "https://www.instagram.com/csau_ceg/",
    note: "Event announcements, posters and photos.",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    handle: "Computer Society of Anna University",
    href: "https://www.linkedin.com/school/computer-society-of-anna-university/",
    note: "Updates from the club and its members.",
  },
  {
    id: "x",
    label: "X / Twitter",
    handle: "@csau_ceg",
    href: "https://twitter.com/csau_ceg",
    note: "Short updates.",
  },
  {
    id: "facebook",
    label: "Facebook",
    handle: "csau.ceg",
    href: "https://www.facebook.com/csau.ceg/",
    note: "The club's page.",
  },
  {
    id: "medium",
    label: "Medium",
    handle: "@cegcsau",
    href: "https://medium.com/@cegcsau",
    note: "Articles written by the members.",
  },
];

/** Where the club works from, top line first. */
export const CONTACT_BASE = {
  lines: ["Ramanujan Computing Centre", "College of Engineering Guindy", "Anna University"],
  coordinates: "13.08 N 80.27 E",
};
