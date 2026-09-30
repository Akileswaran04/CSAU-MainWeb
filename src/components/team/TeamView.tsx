"use client";

import { useCallback, useMemo, useState } from "react";
import TeamCarousel from "@/components/TeamCarousel";
import type { TeamGroup, TeamMember, TeamState } from "@/lib/team";
import { TEAM_GROUPS, memberMeta } from "@/lib/team";
import Portrait from "./Portrait";
import TeamProfile from "./TeamProfile";

/* ============================================================
   TEAM VIEW - Full-circle carousel + crew grid + profile

   • Pinned Three.js stage: the faculty advisor, office bearers
     and domain heads spin around a full circle - role on the
     left, name / dept / links on the right, vertical CSAU
     wordmark standing at the centre of the ring.
   • Below the carousel: the deputy heads (and core members, if
     the CMS lists any), grouped by domain.
   • Any member opens the detailed profile.
   Everything is driven by the `members` prop (see src/lib/team.ts).
   ============================================================ */

/** Groups that ride the ring; the rest are listed below it. */
const RING_GROUPS: TeamGroup[] = ["faculty", "office", "heads"];

const CREW_LEDES: Partial<Record<TeamGroup, string>> = {
  deputies: "The crew that keeps every build, event and round running.",
};

export default function TeamView({ members, state }: { members: TeamMember[]; state: TeamState }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = useCallback((id: string) => setOpenId(id), []);
  const close = useCallback(() => setOpenId(null), []);

  const featured = useMemo(() => members.filter((m) => RING_GROUPS.includes(m.group)), [members]);

  /* crew sections: one per remaining group, members bucketed by domain */
  const crew = useMemo(
    () =>
      TEAM_GROUPS.filter((g) => !RING_GROUPS.includes(g.id))
        .map((g) => {
          const byDomain = new Map<string, TeamMember[]>();
          for (const m of members) {
            if (m.group !== g.id) continue;
            byDomain.set(m.domain, [...(byDomain.get(m.domain) ?? []), m]);
          }
          return { ...g, domains: Array.from(byDomain, ([name, list]) => ({ name, list })) };
        })
        .filter((g) => g.domains.length > 0),
    [members],
  );

  const current = openId ? members.find((m) => m.id === openId) : undefined;

  return (
    <main id="content" style={{ background: "transparent" }}>
      <h1 className="sr-only">Team</h1>

      {/* ── Full-circle member carousel ── */}
      {featured.length > 0 && <TeamCarousel members={featured} onOpen={open} />}

      {/* ── Crew grid ── */}
      {crew.map((group, gi) => (
        <section key={group.id} className="tm-crew" aria-labelledby={`tm-${group.id}`}>
          <div className="tm-crew-in">
            <div className="eyebrow">Support crew</div>
            <h2 id={`tm-${group.id}`} className="tm-title">
              {group.title}
            </h2>
            {CREW_LEDES[group.id] && <p className="tm-lede">{CREW_LEDES[group.id]}</p>}

            {gi === 0 && state === "fallback" && (
              <p className="dm-notice" role="status">
                <span className="dm-notice-dot" aria-hidden />
                Showing the latest saved roster.
              </p>
            )}

            <div className="tm-groups">
              {group.domains.map((d) => (
                <div key={d.name} className="tm-group">
                  <h3 className="tm-group-name">
                    {d.name || group.title}
                    <span className="tm-group-count tabular">
                      {String(d.list.length).padStart(2, "0")} {d.list.length === 1 ? "member" : "members"}
                    </span>
                  </h3>
                  <ul className="tm-grid">
                    {d.list.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          className="clay-card card-photo tm-card"
                          onClick={() => open(m.id)}
                          aria-label={`View profile: ${m.name}, ${m.role}`}
                        >
                          <span className="tm-card-photo">
                            <Portrait member={m} size={400} />
                          </span>
                          <span className="tm-card-body">
                            <span className="tm-card-name">{m.name}</span>
                            <span className="tm-card-bar" aria-hidden />
                            <span className="tm-card-role">{m.designation}</span>
                            <span className="tm-card-meta">{memberMeta(m)}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {current && <TeamProfile member={current} roster={members} onSelect={open} onClose={close} />}
    </main>
  );
}
