"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { TeamMember } from "@/lib/team";
import { TEAM_GROUPS, memberMeta } from "@/lib/team";
import { DOMAINS_META } from "@/lib/domains";
import { lockScroll } from "@/lib/scrollLock";
import Portrait from "./Portrait";

/* ============================================================
   TEAM PROFILE - the detailed view for one member.

   Opens over the team page from the ring or the crew grid and
   reuses the Domains detail shell (.dm-detail*). Shows the photo,
   role, domain, department, year and profile link from the CMS,
   what the member's domain does, and the rest of their wing.
   ← → step through the roster, Esc / Back / the scrim close it.
   Focus moves into the panel on open, stays inside it, and is
   restored to the opener on close; the page behind is locked.
   ============================================================ */

export default function TeamProfile({
  member,
  roster,
  onSelect,
  onClose,
}: {
  member: TeamMember;
  /** everyone, in display order */
  roster: TeamMember[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const index = roster.findIndex((m) => m.id === member.id);
  const prev = roster[index - 1];
  const next = roster[index + 1];

  /* on open: lock the page, move focus in; on close: undo both */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const release = lockScroll();
    closeRef.current?.focus();
    return () => {
      release();
      if (opener && typeof opener.focus === "function") opener.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowLeft" && prev) {
        onSelect(prev.id);
      } else if (e.key === "ArrowRight" && next) {
        onSelect(next.id);
      } else if (e.key === "Tab") {
        // keep focus inside the panel
        const items = panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        if (!items || items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        const inside = panelRef.current?.contains(document.activeElement);
        if (e.shiftKey && (document.activeElement === first || !inside)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, onSelect, prev, next]);

  /* a new member starts at the top of the panel; if the control that was
     focused went away with the old member, focus returns to Back */
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
    if (!panelRef.current?.contains(document.activeElement)) closeRef.current?.focus();
  }, [member.id]);

  const groupTitle = TEAM_GROUPS.find((g) => g.id === member.group)?.title ?? "Team";
  const domainMeta = DOMAINS_META.find((d) => d.id === member.domainId);
  /* the rest of the wing: same domain, or the fellow office bearers / faculty */
  const wing = roster.filter(
    (m) => m.id !== member.id && (member.domain ? m.domain === member.domain : !m.domain && m.group === member.group),
  );
  const wingTitle = member.domain ? `Also in ${member.domain}` : `Other ${groupTitle.toLowerCase()}`;

  const facts: [string, string][] = [
    ["Domain", member.domain],
    ["Department", member.department],
    ["Year", member.year ? `${member.year} year` : ""],
  ];

  return (
    <div className="dm-detail tm-profile" role="dialog" aria-modal="true" aria-labelledby="tm-profile-name">
      <button
        type="button"
        className="dm-detail-scrim"
        aria-label="Close profile"
        onClick={onClose}
        tabIndex={-1}
      />

      <div ref={panelRef} className="dm-detail-panel">
        <div className="dm-detail-head">
          <button type="button" ref={closeRef} className="btn btn-ghost dm-back" onClick={onClose}>
            ← Back
          </button>
          <div className="tm-profile-nav">
            <button
              type="button"
              className="tm-step"
              aria-label={prev ? `Previous member: ${prev.name}` : "Previous member"}
              disabled={!prev}
              onClick={() => prev && onSelect(prev.id)}
            >
              ←
            </button>
            <span className="dm-detail-index tabular" aria-hidden>
              {String(index + 1).padStart(2, "0")} / {String(roster.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              className="tm-step"
              aria-label={next ? `Next member: ${next.name}` : "Next member"}
              disabled={!next}
              onClick={() => next && onSelect(next.id)}
            >
              →
            </button>
          </div>
        </div>

        <div className="dm-detail-body tm-profile-body">
          <div className="tm-profile-photo card-photo">
            <Portrait key={member.id} member={member} size={560} alt={`Portrait of ${member.name}`} eager />
          </div>

          <div className="tm-profile-main">
            <div className="eyebrow">{groupTitle}</div>
            <h2 id="tm-profile-name" className="tm-profile-name">
              {member.name}
            </h2>
            <p className="dm-detail-lede">{member.role}</p>

            <dl className="tm-facts">
              {facts
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label} className="tm-fact">
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>

            {member.link && (
              <p className="tm-profile-actions">
                <a
                  className="btn"
                  href={member.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on ${member.link.label}. Opens in a new tab.`}
                >
                  {member.link.label} ↗
                </a>
              </p>
            )}
          </div>

          {domainMeta && (
            <section className="dm-block tm-profile-wide" aria-labelledby="tm-profile-domain">
              <h3 id="tm-profile-domain" className="dm-block-title">
                What {domainMeta.name} does
              </h3>
              <p className="dm-detail-desc tm-profile-desc">{domainMeta.description}</p>
              <Link href="/domains" data-route-load className="btn btn-ghost">
                Explore the domains →
              </Link>
            </section>
          )}

          {wing.length > 0 && (
            <section className="dm-block tm-profile-wide" aria-labelledby="tm-profile-wing">
              <h3 id="tm-profile-wing" className="dm-block-title">
                {wingTitle} · {wing.length}
              </h3>
              <ul className="dm-members">
                {wing.map((m) => (
                  <li key={m.id} className="dm-member">
                    <button
                      type="button"
                      className="dm-member-link tm-member-btn"
                      onClick={() => onSelect(m.id)}
                      aria-label={`View profile: ${m.name}, ${m.role}`}
                    >
                      <span className="dm-member-avatar tm-avatar">
                        <Portrait member={m} size={96} />
                      </span>
                      <span className="dm-member-text">
                        <span className="dm-member-name">{m.name}</span>
                        <span className="dm-member-meta">
                          {[m.designation, memberMeta(m)].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
