"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { isExternal, sanityImage, type PastEvent, type UpcomingEvent } from "@/data/events";
import EventPoster from "@/components/EventPoster";
import { lockScroll } from "@/lib/scrollLock";
import { ANNOUNCEMENT } from "@/data/announcement";

/* ============================================================
   EVENTS - the pieces the events page (EventsBoard.tsx) shares:
   the empty launchpad and the entry panel that opens on a tile.
   ============================================================ */

export const LEAD = "Upcoming & Current";
const PAD_NAME = ANNOUNCEMENT?.text ?? "Nothing on the launchpad right now";

const pad = (n: number) => String(n).padStart(2, "0");

/** One card: an upcoming event, the empty launchpad (nothing upcoming), or an archived event. */
export type Item = { up: UpcomingEvent } | { pad: true } | { past: PastEvent };
export const keyOf = (it: Item) => ("past" in it ? it.past.id : "up" in it ? `up:${it.up.id}` : "pad");
export const nameOf = (it: Item) => ("past" in it ? it.past.name : "up" in it ? it.up.name : PAD_NAME);

/** The empty launch pad, drawn in hairlines: three points of sky above the mast. */
export function LaunchPad() {
  return (
    <div className="ev-poster evo-pad">
      <svg viewBox="0 0 160 132" aria-hidden focusable="false">
        <g className="evo-pad-sky">
          <circle cx="80" cy="16" r="1.4" />
          <circle cx="80" cy="34" r="1.4" />
          <circle cx="80" cy="52" r="1.4" />
        </g>
        <path d="M108 30 V96 M108 44 H96 M108 66 H96" />
        <path d="M62 96 H118 M44 108 H136 M30 120 H150" />
      </svg>
    </div>
  );
}

export function EntryPanel({
  items,
  index,
  onGo,
  onClose,
}: {
  items: Item[];
  index: number;
  onGo: (i: number) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const it = items[index];
  const prev = items[index - 1];
  const next = items[index + 1];
  const past = "past" in it ? it.past : null;
  const up = "up" in it ? it.up : null;
  const ev = past ?? up;
  /* where it sits: its year in the archive, or among the upcoming */
  const group = items.filter((x) => (past ? "past" in x && x.past.year === past.year : !("past" in x)));
  const text = past ? past.log || past.blurb : up ? up.blurb : "";
  const photos = past?.photos ?? [];

  /* lock the page and move focus in; undo both on close */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const release = lockScroll();
    closeRef.current?.focus();
    return () => {
      release();
      opener?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [index]);

  useEffect(() => {
    const onKey = (k: KeyboardEvent) => {
      if (k.key === "Escape") onClose();
      else if (k.key === "ArrowLeft" && index > 0) onGo(index - 1);
      else if (k.key === "ArrowRight" && index < items.length - 1) onGo(index + 1);
      else if (k.key === "Tab") {
        // keep focus inside the panel
        const all = panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        if (!all?.length) return;
        const first = all[0];
        const last = all[all.length - 1];
        const inside = panelRef.current?.contains(document.activeElement);
        if (k.shiftKey && (document.activeElement === first || !inside)) {
          k.preventDefault();
          last.focus();
        } else if (!k.shiftKey && (document.activeElement === last || !inside)) {
          k.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, items.length, onGo, onClose]);

  return (
    <div className="dm-detail evo-panel" role="dialog" aria-modal="true" aria-labelledby="evo-panel-name">
      <button type="button" className="dm-detail-scrim" aria-label="Close entry" tabIndex={-1} onClick={onClose} />
      <div ref={panelRef} className="dm-detail-panel evo-panel-sheet">
        <div className="dm-detail-head">
          <span className="dm-detail-index tabular">
            {past ? past.year : LEAD}
            {group.length > 1 && ` · ${pad(group.indexOf(it) + 1)} / ${pad(group.length)}`}
          </span>
          <button type="button" ref={closeRef} className="tm-step" aria-label="Close entry" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="evo-panel-body" key={keyOf(it)}>
          <h3 id="evo-panel-name" className="evo-panel-name">
            {nameOf(it)}
          </h3>
          <div className="evo-panel-poster">
            {ev ? <EventPoster name={ev.name} tag={ev.tag} poster={ev.poster} /> : <LaunchPad />}
          </div>
          {ev && (
            <dl className="evo-facts">
              <div>
                <dt>Date</dt>
                <dd className="tabular">{ev.date}</dd>
              </div>
              {past?.stat && (
                <div>
                  <dt>Location</dt>
                  <dd className="ev-stat">{past.stat}</dd>
                </div>
              )}
              {up && (
                <div>
                  <dt>Status</dt>
                  <dd className="evo-status">{up.status}</dd>
                </div>
              )}
            </dl>
          )}
          {text && <p className="evo-log">{text}</p>}
          {!ev &&
            ANNOUNCEMENT?.href &&
            (isExternal(ANNOUNCEMENT.href) ? (
              <a href={ANNOUNCEMENT.href} target="_blank" rel="noopener noreferrer" className="btn btn-signal evo-cta">
                Open ↗
              </a>
            ) : (
              <Link href={ANNOUNCEMENT.href} data-route-load className="btn btn-signal evo-cta">
                Open →
              </Link>
            ))}
          {up?.href &&
            up.cta &&
            (isExternal(up.href) ? (
              <a
                href={up.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-signal evo-cta"
                aria-label={`${up.cta}: ${up.name}. Opens in a new tab.`}
              >
                {up.cta} ↗
              </a>
            ) : (
              <Link href={up.href} data-route-load className="btn btn-signal evo-cta">
                {up.cta} →
              </Link>
            ))}
          {past?.href && (
            <Link href={past.href} data-route-load className="btn btn-signal evo-cta">
              Open →
            </Link>
          )}
          {photos.length > 0 && past && (
            <ul className="ev-photos" aria-label={`Photos from ${past.name}`}>
              {photos.map((photo, i) => (
                <li key={photo}>
                  <a
                    className="ev-photo"
                    href={sanityImage(photo, 1600)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Photo ${i + 1} of ${photos.length} from ${past.name}. Opens in a new tab.`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sanityImage(photo, 192, 144)} alt="" width={96} height={72} decoding="async" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav className="evo-panel-nav" aria-label="Browse the events">
          <button
            type="button"
            disabled={!prev}
            onClick={() => onGo(index - 1)}
            aria-label={prev ? `Previous: ${nameOf(prev)}` : "Previous"}
          >
            <span>← Previous</span>
            {prev && <span className="evo-panel-nav-name">{nameOf(prev)}</span>}
          </button>
          <button
            type="button"
            disabled={!next}
            onClick={() => onGo(index + 1)}
            aria-label={next ? `Next: ${nameOf(next)}` : "Next"}
          >
            <span>Next →</span>
            {next && <span className="evo-panel-nav-name">{nameOf(next)}</span>}
          </button>
        </nav>
      </div>
    </div>
  );
}
