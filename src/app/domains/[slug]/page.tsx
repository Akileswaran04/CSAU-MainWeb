import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SubpageShell from "@/components/SubpageShell";
import { domains, getDomain } from "@/data/domains";

/* ============================================================================
   DOMAIN DETAIL — a micro-world. Each domain's sub-areas render as nodes
   on an SVG connection map, keeping every domain page structurally identical
   but visually themed by its accent colour.
   ========================================================================== */

export function generateStaticParams() {
  return domains.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const domain = getDomain(slug);
  if (!domain) return { title: "Unknown Domain | CSAU" };
  return {
    title: `${domain.name} | CSAU — The Domains`,
    description: domain.description,
  };
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const domain = getDomain(slug);
  if (!domain) notFound();

  const cyan = domain.accent === "cyan";
  const accentText = cyan ? "text-cyan" : "text-magenta";

  /* node positions on a 1000x420 canvas — center hub + ring of areas */
  const cx = 500;
  const cy = 210;
  const R = 160;
  const nodes = domain.areas.map((area, i) => {
    const a = (Math.PI * 2 * i) / domain.areas.length - Math.PI / 2;
    return {
      area,
      x: cx + Math.cos(a) * R,
      y: cy + Math.sin(a) * R,
    };
  });

  return (
    <SubpageShell label={`DOMAIN / ${domain.name.toUpperCase()} · REALM STATUS ONLINE`}>
      {/* Hero */}
      <section className="px-5 sm:px-8 lg:px-12 max-w-6xl mx-auto pb-12">
        <span className="text-5xl" role="img" aria-label={domain.name}>
          {domain.icon}
        </span>
        <h1
          className={`mt-4 text-4xl sm:text-6xl md:text-7xl font-bold font-[family-name:var(--font-display)] leading-[1.05] ${accentText} ${
            cyan ? "glow-cyan" : "glow-magenta"
          }`}
        >
          {domain.name}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-foreground/60 leading-relaxed">
          {domain.description}
        </p>
        <div className="section-divider mt-8" />
      </section>

      {/* Micro-world node map */}
      <section className="px-5 sm:px-8 lg:px-12 max-w-6xl mx-auto pb-16">
        <h2 className="text-xs tracking-[0.3em] uppercase text-foreground/40 font-[family-name:var(--font-geist-mono)] mb-6">
          Sub-realms
        </h2>

        {/* Desktop map */}
        <div className="hidden md:block holo-card rounded-2xl overflow-hidden">
          <svg viewBox="0 0 1000 420" className="w-full" role="img" aria-label={`${domain.name} sub-realm map`}>
            {/* connections */}
            {nodes.map((n) => (
              <line
                key={`l-${n.area}`}
                x1={cx}
                y1={cy}
                x2={n.x}
                y2={n.y}
                stroke={cyan ? "rgba(84,217,232,0.35)" : "rgba(215,124,203,0.35)"}
                strokeWidth="1"
                strokeDasharray="3 5"
              />
            ))}
            {/* orbit */}
            <circle
              cx={cx}
              cy={cy}
              r={R}
              fill="none"
              stroke={cyan ? "rgba(84,217,232,0.15)" : "rgba(215,124,203,0.15)"}
              strokeWidth="1"
            />
            {/* hub */}
            <circle
              cx={cx}
              cy={cy}
              r={44}
              fill={cyan ? "rgba(84,217,232,0.08)" : "rgba(215,124,203,0.08)"}
              stroke={cyan ? "rgba(84,217,232,0.5)" : "rgba(215,124,203,0.5)"}
              strokeWidth="1"
            />
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              fill="#F4F0E8"
              fontSize="13"
              fontWeight="600"
              fontFamily="var(--font-display)"
            >
              CSAU
            </text>
            <text
              x={cx}
              y={cy + 14}
              textAnchor="middle"
              fill={cyan ? "#54D9E8" : "#D77CCB"}
              fontSize="9"
              letterSpacing="2"
              fontFamily="var(--font-geist-mono)"
            >
              {domain.name.toUpperCase()}
            </text>
            {/* area nodes */}
            {nodes.map((n) => (
              <g key={n.area}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={7}
                  fill="#090714"
                  stroke={cyan ? "#54D9E8" : "#D77CCB"}
                  strokeWidth="1.5"
                />
                <text
                  x={n.x}
                  y={n.y - 16}
                  textAnchor="middle"
                  fill="rgba(244,240,232,0.75)"
                  fontSize="11"
                  letterSpacing="1.5"
                  fontFamily="var(--font-geist-mono)"
                >
                  {n.area}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Mobile chips */}
        <div className="md:hidden flex flex-wrap gap-2">
          {domain.areas.map((a) => (
            <span
              key={a}
              className={`px-3 py-1.5 rounded-full border text-xs font-[family-name:var(--font-geist-mono)] tracking-widest ${
                cyan
                  ? "border-cyan/30 text-cyan/80 bg-cyan/5"
                  : "border-magenta/30 text-magenta/80 bg-magenta/5"
              }`}
            >
              {a}
            </span>
          ))}
        </div>
      </section>

      {/* Back */}
      <section className="pb-24 text-center">
        <Link
          href="/#domains"
          data-cursor="ENTER"
          className="neon-underline text-sm tracking-[0.25em] uppercase text-foreground/50 hover:text-cyan transition-colors font-[family-name:var(--font-geist-mono)]"
        >
          ← Back to all domains
        </Link>
      </section>
    </SubpageShell>
  );
}
