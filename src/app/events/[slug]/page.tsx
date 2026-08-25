import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SubpageShell from "@/components/SubpageShell";
import { events, getEvent } from "@/data/events";

/* ============================================================================
   EVENT DETAIL — an archive entry opened: hero, metadata, report, gallery.
   Gallery tiles are graceful placeholders until real photos are supplied.
   ========================================================================== */

export function generateStaticParams() {
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return { title: "Unknown Entry | CSAU" };
  return {
    title: `${event.title} | CSAU — The Archive`,
    description: event.description,
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  return (
    <SubpageShell label={`ARCHIVE / ENTRY ${event.entryNo} · ${event.year}`}>
      {/* Hero */}
      <section className="px-5 sm:px-8 lg:px-12 max-w-6xl mx-auto pb-16">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-xs px-3 py-1 rounded-full bg-cyan/20 text-cyan border border-cyan/30 font-[family-name:var(--font-geist-mono)]">
            {event.category.toUpperCase()}
          </span>
          <span className="text-xs tracking-[0.25em] text-foreground/40 font-[family-name:var(--font-geist-mono)]">
            {event.year}
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-[family-name:var(--font-display)] leading-[1.05]">
          {event.title}
        </h1>
        <div className="section-divider mt-8" />

        <p className="mt-10 max-w-2xl text-lg text-foreground/60 leading-relaxed">
          {event.description}
        </p>
      </section>

      {/* Highlights */}
      <section className="px-5 sm:px-8 lg:px-12 max-w-6xl mx-auto pb-16">
        <h2 className="text-xs tracking-[0.3em] uppercase text-foreground/40 font-[family-name:var(--font-geist-mono)] mb-6">
          Mission Highlights
        </h2>
        <ul className="grid sm:grid-cols-3 gap-4">
          {event.highlights.map((h, i) => (
            <li
              key={h}
              className="holo-card rounded-xl p-5 text-sm text-foreground/70"
            >
              <span className="block text-[10px] tracking-[0.3em] text-cyan/60 font-[family-name:var(--font-geist-mono)] mb-2">
                {String(i + 1).padStart(2, "0")}
              </span>
              {h}
            </li>
          ))}
        </ul>
      </section>

      {/* Gallery — graceful placeholders until real assets exist */}
      <section className="px-5 sm:px-8 lg:px-12 max-w-6xl mx-auto pb-20">
        <h2 className="text-xs tracking-[0.3em] uppercase text-foreground/40 font-[family-name:var(--font-geist-mono)] mb-6">
          Gallery
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              data-cursor="VIEW"
              className="aspect-video rounded-xl border border-foreground/10 bg-gradient-to-br from-cyan/10 via-transparent to-magenta/10 flex items-center justify-center"
              aria-label="Gallery image placeholder"
            >
              <span className="text-[9px] tracking-[0.3em] uppercase text-foreground/25 font-[family-name:var(--font-geist-mono)]">
                Awaiting Assets / {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Back to archive */}
      <section className="pb-24 text-center">
        <Link
          href="/events"
          data-cursor="ENTER"
          className="neon-underline text-sm tracking-[0.25em] uppercase text-foreground/50 hover:text-cyan transition-colors font-[family-name:var(--font-geist-mono)]"
        >
          ← Back to the archive
        </Link>
      </section>
    </SubpageShell>
  );
}
