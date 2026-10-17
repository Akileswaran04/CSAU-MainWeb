"use client";

import { useMemo } from "react";
import TeamCarousel from "@/components/TeamCarousel";
import type { TeamGroup, TeamMember, TeamState } from "@/lib/team";
import { TEAM_GROUPS, memberMeta } from "@/lib/team";
import Portrait from "./Portrait";

/* ============================================================
   TEAM VIEW - carousel + crew grid

   • The faculty advisor, office bearers and domain heads on the
     full-circle ring (TeamCarousel, the very first carousel,
     restored 2026-10-17), on every screen size.
   • Below it: the deputy heads (and core members, if the CMS
     lists any), grouped by domain.
   Everything is driven by the `members` prop (see src/lib/team.ts).
   ============================================================ */

/** Groups that ride the ring; the rest are listed below it. */
const RING_GROUPS: TeamGroup[] = ["faculty", "office", "heads"];

export default function TeamView({ members, state }: { members: TeamMember[]; state: TeamState }) {
  const featured = useMemo(() => members.filter((m) => RING_GROUPS.includes(m.group)), [members]);

  /* crew sections: one per group not on the carousel, members bucketed by domain */
  const crew = useMemo(
    () =>
      TEAM_GROUPS.filter((g) => !RING_GROUPS.includes(g.id))
        .map((g) => {
          const byDomain = new Map<string, TeamMember[]>();
          for (const m of members) {
            if (m.group !== g.id) continue;
            byDomain.set(m.domain, [...(byDomain.get(m.domain) ?? []), m]);
          }
          let domains = Array.from(byDomain, ([name, list]) => ({ name, list }));
          // one person per domain (the heads, the office bearers): no domain headings, one list
          if (domains.every((d) => d.list.length === 1)) domains = [{ name: "", list: domains.flatMap((d) => d.list) }];
          return { ...g, domains };
        })
        .filter((g) => g.domains.length > 0),
    [members],
  );

  return (
    <main id="content" style={{ background: "transparent" }}>
      <h1 className="sr-only">Team</h1>

      {/* ── Full-circle member carousel ── */}
      {featured.length > 0 && <TeamCarousel members={featured} />}

      {/* ── Crew grid ── */}
      {crew.map((group, gi) => (
        <section key={group.id} className="tm-crew" aria-labelledby={`tm-${group.id}`}>
          <div className="tm-crew-in">
            <h2 id={`tm-${group.id}`} className="tm-title">
              {group.title}
            </h2>

            {gi === 0 && state === "fallback" && (
              <p className="dm-notice" role="status">
                <span className="dm-notice-dot" aria-hidden />
                Showing the latest saved roster.
              </p>
            )}

            <div className="tm-groups">
              {group.domains.map((d) => (
                <div key={d.name} className="tm-group">
                  {/* a domain's heading; an unnamed list sits straight under the section title, which already names it */}
                  {d.name && (
                    <h3 className="tm-group-name">
                      {d.name}
                      <span className="tm-group-count tabular">
                        {String(d.list.length).padStart(2, "0")} {d.list.length === 1 ? "member" : "members"}
                      </span>
                    </h3>
                  )}
                  <ul className="tm-grid">
                    {d.list.map((m) => (
                      <li key={m.id}>
                        <div className="clay-card card-photo tm-card">
                          <span className="tm-card-photo">
                            <Portrait member={m} size={400} />
                          </span>
                          <span className="tm-card-body">
                            <span className="tm-card-name">{m.name}</span>
                            <span className="tm-card-bar" aria-hidden />
                            <span className="tm-card-role">{d.name ? m.designation : m.role}</span>
                            <span className="tm-card-meta">{memberMeta(m)}</span>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
