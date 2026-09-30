import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_BASE, CONTACT_CHANNELS } from "@/data/contact";
import ContactChannels from "@/components/contact/ContactChannels";

/* ============================================================
   CONTACT - how to reach the club: a ruled list of its real
   channels beside a beacon that tunes to whichever channel is
   hovered or focused. Driven entirely by src/data/contact.ts.
   Route: /contact
   ============================================================ */

export const metadata: Metadata = {
  title: "Contact // CSAU - Computer Society of Anna University",
  description:
    "Reach the Computer Society of Anna University, CEG - email and the club's Instagram, LinkedIn, X, Facebook and Medium.",
};

export default function ContactPage() {
  return (
    <main id="content" className="pg">
      <div className="pg-in">
        <header className="ct-head">
          <div className="eyebrow">Open channel</div>
          <h1 className="pg-title">Contact</h1>
          <p className="pg-lede">
            Questions, collaborations, partnerships. These are the club&apos;s channels. Pick one
            and open a line.
          </p>
        </header>

        <ContactChannels channels={CONTACT_CHANNELS} base={CONTACT_BASE} />

        <p className="pg-next">
          <Link href="/team" data-route-load className="btn btn-primary">
            Meet the team →
          </Link>
        </p>
      </div>
    </main>
  );
}
