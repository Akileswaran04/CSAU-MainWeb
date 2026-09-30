import type { Metadata } from "next";
import Link from "next/link";
import { getDomains } from "@/lib/domains";
import SaturnDomains from "@/components/domains/SaturnDomains";

/* ============================================================
   DOMAINS - CSAU's six working domains, shown as the rings of
   Saturn. Members are fetched live from the CMS (revalidated
   hourly) on the server and passed to the interactive Saturn.
   Route: /domains
   ============================================================ */

export const metadata: Metadata = {
  title: "Domains // CSAU - Computer Society of Anna University",
  description:
    "The six domains of the Computer Society of Anna University, CEG - Web & App, CP Wing, Design, Events, HR & Logistics and Marketing & IR.",
};

export const revalidate = 3600;

export default async function DomainsPage() {
  const { domains, state } = await getDomains();

  return (
    <main id="content" className="pg">
      <div className="pg-in">
        <header className="dm-head">
          <div className="eyebrow">How we&apos;re organised</div>
          <h1 className="pg-title">Domains</h1>
          <p className="pg-lede">
            CSAU runs on six domains - the rings of our Saturn. Hover a ring to see which domain it
            is, then open it to meet the people and see what they do.
          </p>
        </header>

        {state === "fallback" && (
          <p className="dm-notice" role="status">
            <span className="dm-notice-dot" aria-hidden />
            Showing the latest saved roster.
          </p>
        )}

        <SaturnDomains domains={domains} />

        <p className="pg-next">
          <Link href="/team" data-route-load className="btn btn-primary">
            Meet the full crew →
          </Link>
        </p>
      </div>
    </main>
  );
}
