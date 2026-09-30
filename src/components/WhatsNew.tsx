"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { WhatsNewItem } from "@/lib/whatsNew";

/* ============================================================
   WHAT'S NEW - a small rocket towing a flag.

   Sits in the bottom-right corner of the home hero (it is part
   of the hero, not fixed, so it scrolls away with it and never
   covers the story or the nav). The rocket tows the flag in a
   moment after the hero settles, then idles: a slow bob, a
   flickering engine and a flag that ripples. Pressing it opens
   a short list of what is new, above the rocket.

   • A real <button aria-expanded> + a labelled region; Esc or a
     click outside closes it and focus returns to the rocket.
   • An amber dot marks items you have not opened yet
     (remembered in localStorage).
   • Motion is CSS only and stops under reduced motion.
   ============================================================ */

const SEEN_KEY = "csau-whatsnew-seen";

/* The last list the visitor opened, kept in localStorage and read as an
   external store so the unread dot never causes a hydration mismatch. */
const listeners = new Set<() => void>();
const subscribeSeen = (fn: () => void) => {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
};
const readSeen = (): string | null => {
  try {
    return localStorage.getItem(SEEN_KEY) ?? "";
  } catch {
    return null; // storage unavailable: never show the dot
  }
};
const markSeen = (signature: string) => {
  try {
    localStorage.setItem(SEEN_KEY, signature);
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((fn) => fn());
};

export default function WhatsNew({ items }: { items: WhatsNewItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const signature = items.map((i) => i.id).join("|");
  /* anything here the visitor has not opened before? (unknown on the server) */
  const seen = useSyncExternalStore(subscribeSeen, readSeen, () => null);
  const unseen = seen !== null && seen !== signature;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  if (items.length === 0) return null;

  const toggle = () => {
    setOpen((o) => !o);
    markSeen(signature);
  };

  return (
    <div ref={rootRef} className={`wn${open ? " is-open" : ""}`}>
      {open && (
        <div id="wn-panel" className="wn-panel" role="region" aria-label="What's new">
          <div className="wn-panel-head">
            <span className="eyebrow">What&apos;s new</span>
            <button
              type="button"
              className="tm-step wn-close"
              aria-label="Close what's new"
              onClick={() => {
                setOpen(false);
                btnRef.current?.focus();
              }}
            >
              ✕
            </button>
          </div>
          <ul className="wn-list">
            {items.map((item) => {
              const body = (
                <>
                  <span className="wn-kind">{item.kind}</span>
                  <span className="wn-title">
                    {item.title}
                    <span className="wn-arrow" aria-hidden>
                      {item.external ? " ↗" : " →"}
                    </span>
                  </span>
                  <span className="wn-meta">{item.meta}</span>
                </>
              );
              return (
                <li key={item.id}>
                  {item.external ? (
                    <a
                      className="wn-item"
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${item.kind}: ${item.title}. Opens in a new tab.`}
                    >
                      {body}
                    </a>
                  ) : (
                    <Link className="wn-item" href={item.href} data-route-load>
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        ref={btnRef}
        type="button"
        className="wn-btn"
        aria-expanded={open}
        aria-controls="wn-panel"
        onClick={toggle}
      >
        <span className="wn-tow">
          <span className="wn-flag">
            What&apos;s new
            {unseen && <span className="wn-dot" aria-hidden />}
          </span>
          <span className="wn-tether" aria-hidden />
          <svg className="wn-rocket" viewBox="0 0 52 24" fill="none" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path className="wn-flame" d="M12 12L1 8.6 4.5 12 1 15.4Z" />
            <path d="M12 7h18c7 0 13 3 17 5-4 2-10 5-17 5H12z" fill="var(--hull-900)" stroke="var(--starlight)" />
            <path d="M18 7l-6-5v5M18 17l-6 5v-5" fill="var(--hull-900)" stroke="var(--dim-300)" />
            <path d="M12 7v10" stroke="var(--dim-300)" />
            <circle cx="33" cy="12" r="2.4" fill="var(--lit)" stroke="none" />
          </svg>
        </span>
        <span className="sr-only">
          , {items.length} {items.length === 1 ? "update" : "updates"}
          {unseen ? ", unread" : ""}
        </span>
      </button>
    </div>
  );
}
