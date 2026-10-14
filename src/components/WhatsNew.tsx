import Link from "next/link";
import type { WhatsNewItem } from "@/lib/whatsNew";

/* ============================================================
   THE ROCKET - a small rocket towing a long flag beside the
   wordmark in the home hero. The flag reads Quick Code
   (lib/whatsNew.ts) and the whole thing links to that page.
   It tows in once the hero settles,
   then idles: a slow bob, a flickering engine, a rippling flag.
   Motion is CSS only and stops under reduced motion.
   ============================================================ */

export default function WhatsNew({ item }: { item: WhatsNewItem }) {
  const body = (
    <span className="wn-tow">
      <span className="wn-flag">
        {item.kind && <span className="wn-kind">{item.kind}</span>}
        <span className="wn-title">{item.title}</span>
      </span>
      <span className="wn-tether" aria-hidden />
      <svg className="wn-rocket" viewBox="0 0 52 24" fill="none" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path className="wn-flame" d="M12 12L1 8.6 4.5 12 1 15.4Z" />
        <path d="M12 7h18c7 0 13 3 17 5-4 2-10 5-17 5H12z" fill="var(--hull-900)" stroke="var(--starlight)" />
        <path d="M18 7l-6-5v5M18 17l-6 5v-5" fill="var(--hull-900)" stroke="var(--dim-300)" />
        <path d="M12 7v10" stroke="var(--dim-300)" />
        <circle cx="33" cy="12" r="2.4" fill="var(--lit)" stroke="none" />
      </svg>
    </span>
  );
  return item.external ? (
    <a className="wn" href={item.href} target="_blank" rel="noopener noreferrer" aria-label={`${item.title}. Opens in a new tab.`}>
      {body}
    </a>
  ) : (
    <Link className="wn" href={item.href} data-route-load>
      {body}
    </Link>
  );
}
