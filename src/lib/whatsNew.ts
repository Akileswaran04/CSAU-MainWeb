/* ============================================================
   The rocket's flag in the home hero: a fixed link to the
   Quick Code page.
   ============================================================ */

export interface WhatsNewItem {
  /** short status word before the title, e.g. "UPCOMING" */
  kind: string;
  title: string;
  href: string;
  /** opens in a new tab */
  external: boolean;
}

export const QUICK_CODE: WhatsNewItem = { kind: "", title: "Quick Code", href: "/quick-code", external: false };
