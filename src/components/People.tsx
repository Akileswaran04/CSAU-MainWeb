"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { teamMembers } from "@/data/team";

/* team data comes from @/data/team (single source of truth) */
import type { TeamMember } from "@/data/team";

function TeamCard({ member, index }: { member: TeamMember; index: number }) {
  const borderGlow =
    member.accent === "cyan"
      ? "border-cyan/20 hover:border-cyan/50"
      : "border-magenta/20 hover:border-magenta/50";
  const avatarBg =
    member.accent === "cyan" ? "bg-cyan/10 text-cyan" : "bg-magenta/10 text-magenta";
  const avatarBorder =
    member.accent === "cyan"
      ? "border-cyan/30 group-hover:border-cyan/60"
      : "border-magenta/30 group-hover:border-magenta/60";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className={`holo-card rounded-xl p-6 border ${borderGlow} group cursor-pointer`}
    >
      {/* Avatar */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`w-16 h-16 rounded-full border-2 ${avatarBorder} ${avatarBg} flex items-center justify-center text-lg font-bold font-[family-name:var(--font-space-grotesk)] transition-all duration-300`}
        >
          {member.initials}
        </div>
        <div>
          <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)] group-hover:text-cyan transition-colors">
            {member.name}
          </h3>
          <p className="text-sm text-foreground/50">{member.role}</p>
        </div>
      </div>

      {/* Domain */}
      <div className="mb-4">
        <span className="text-xs px-3 py-1 rounded-full bg-foreground/5 text-foreground/50 border border-foreground/10">
          {member.domain}
        </span>
      </div>

      {/* Social Links */}
      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {member.social.github && (
          <a href={member.social.github} className="text-foreground/40 hover:text-cyan transition-colors" aria-label="GitHub">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        )}
        {member.social.linkedin && (
          <a href={member.social.linkedin} className="text-foreground/40 hover:text-cyan transition-colors" aria-label="LinkedIn">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default function People() {
  return (
    <section id="people" className="relative min-h-[100svh] flex items-center overflow-hidden py-20 sm:py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-lines opacity-20" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-cyan/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-0 w-80 h-80 bg-magenta/5 rounded-full blur-3xl" />

      <div className="stage-16x9 relative z-10 px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-cyan text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">
            06
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-[family-name:var(--font-display)]">
            The People
          </h2>
          <p className="mt-4 text-foreground/50 max-w-xl mx-auto">
            Technology is built by people — meet the minds building CSAU.
          </p>
          <div className="section-divider mt-6" />
        </motion.div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {teamMembers.map((member, i) => (
            <TeamCard key={member.name} member={member} index={i} />
          ))}
        </div>

        {/* Full roster link */}
        <div className="mt-12 text-center">
          <Link
            href="/team"
            data-cursor="VIEW"
            className="neon-underline text-sm tracking-[0.25em] uppercase text-foreground/40 hover:text-cyan transition-colors font-[family-name:var(--font-geist-mono)]"
          >
            Connect with everyone →
          </Link>
        </div>
      </div>
    </section>
  );
}
