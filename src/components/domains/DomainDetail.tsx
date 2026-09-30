"use client";

import { useEffect, useRef } from "react";
import type { Domain } from "@/lib/domains";
import Portrait from "@/components/team/Portrait";

/* ============================================================
   DOMAIN DETAIL - the focused view for a single domain.

   Opens as an overlay panel that animates in from the selected
   ring's position (the ring "arrives" at the centre and becomes
   this panel). Shows the name, description, principles,
   activities and the real members. A clear Back/close control
   and Esc both dismiss it; focus is trapped lightly by moving
   focus to the panel on open and restoring it on close.
   ============================================================ */

export default function DomainDetail({
  domain,
  ringIndex,
  onClose,
}: {
  domain: Domain;
  ringIndex: number;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    restoreFocusRef.current = document.activeElement;
    // move focus into the panel
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      // restore focus to whatever opened the panel
      const el = restoreFocusRef.current as HTMLElement | null;
      if (el && typeof el.focus === "function") el.focus();
    };
  }, [onClose]);

  const hasMembers = domain.members.length > 0;
  const titleId = `dm-detail-title-${domain.id}`;

  return (
    <div className="dm-detail" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        className="dm-detail-scrim"
        aria-label="Close domain detail"
        onClick={onClose}
        tabIndex={-1}
      />

      <div
        ref={panelRef}
        className="dm-detail-panel"
        style={{ ["--ring" as string]: ringIndex }}
      >
        <div className="dm-detail-head">
          <button
            type="button"
            ref={closeRef}
            className="btn btn-ghost dm-back"
            onClick={onClose}
          >
            ← Back
          </button>
          <span className="dm-detail-index tabular" aria-hidden>
            {String(ringIndex + 1).padStart(2, "0")} / 06
          </span>
        </div>

        <div className="dm-detail-body">
          <div className="eyebrow">Domain</div>
          <h2 id={titleId} className="dm-detail-name">
            {domain.name}
          </h2>
          <p className="dm-detail-lede">{domain.blurb}</p>
          <p className="dm-detail-desc">{domain.description}</p>

          <div className="dm-detail-cols">
            <section className="dm-block" aria-labelledby={`${domain.id}-principles`}>
              <h3 id={`${domain.id}-principles`} className="dm-block-title">
                Focus &amp; principles
              </h3>
              <ul className="dm-list">
                {domain.principles.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>

            <section className="dm-block" aria-labelledby={`${domain.id}-activities`}>
              <h3 id={`${domain.id}-activities`} className="dm-block-title">
                What they do
              </h3>
              <ul className="dm-list">
                {domain.activities.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className="dm-block" aria-labelledby={`${domain.id}-members`}>
            <h3 id={`${domain.id}-members`} className="dm-block-title">
              Members{hasMembers ? ` · ${domain.members.length}` : ""}
            </h3>

            {hasMembers ? (
              <ul className="dm-members">
                {domain.members.map((m) => {
                  const meta = [m.designation, m.department, m.year].filter(Boolean).join(" · ");
                  const inner = (
                    <>
                      <span className="dm-member-avatar tm-avatar" aria-hidden>
                        <Portrait member={m} size={96} />
                      </span>
                      <span className="dm-member-text">
                        <span className="dm-member-name">{m.name}</span>
                        <span className="dm-member-meta">{meta}</span>
                      </span>
                    </>
                  );
                  return (
                    <li key={m.name} className="dm-member">
                      {m.url ? (
                        <a
                          className="dm-member-link"
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${m.name}, ${m.designation}. Opens profile in a new tab.`}
                        >
                          {inner}
                        </a>
                      ) : (
                        <span className="dm-member-link is-static">{inner}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="dm-members-empty">Member list is being updated. Check back soon.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
