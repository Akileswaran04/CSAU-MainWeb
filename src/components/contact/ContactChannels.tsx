"use client";

import { useEffect, useRef, useState } from "react";
import type { ContactChannel } from "@/data/contact";

/* ============================================================
   CONTACT CHANNELS - the channel list and its beacon.

     • Channels are ruled rows (the events / blog row language):
       label, handle, one line on what it is for. The handle
       lights amber and nudges on hover / focus.
     • The beacon beside the list pings on its own; hovering or
       focusing a row tunes it to that channel (the readout names
       it and the ping turns to the signal colour).
     • The email row also offers Copy, announced politely.
     • Motion is CSS only and stops under reduced motion.
   ============================================================ */

export default function ContactChannels({
  channels,
  base,
}: {
  channels: ContactChannel[];
  base: { lines: string[]; coordinates: string };
}) {
  const [tuned, setTuned] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const copy = async (c: ContactChannel) => {
    try {
      await navigator.clipboard.writeText(c.handle);
      setCopied(c.id);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(null), 2400);
    } catch {
      /* clipboard unavailable: the address is on screen and selectable */
    }
  };

  const tunedChannel = channels.find((c) => c.id === tuned);

  return (
    <div className="ct-layout">
      <ul className="ct-list" aria-label="Ways to reach CSAU">
        {channels.map((c, i) => {
          const external = !c.href.startsWith("mailto:");
          return (
            <li
              key={c.id}
              className={`ct-row${tuned === c.id ? " is-tuned" : ""}`}
              style={{ ["--i" as string]: i }}
              onMouseEnter={() => setTuned(c.id)}
              onMouseLeave={() => setTuned((t) => (t === c.id ? null : t))}
              onFocus={() => setTuned(c.id)}
              onBlur={() => setTuned((t) => (t === c.id ? null : t))}
            >
              <span className="ct-label">{c.label}</span>
              <span className="ct-main">
                <a
                  className="ct-handle"
                  href={c.href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  aria-label={
                    external ? `${c.label}: ${c.handle}. Opens in a new tab.` : `${c.label}: ${c.handle}`
                  }
                >
                  <span className="ct-handle-text">{c.handle}</span>
                  <span className="ct-arrow" aria-hidden>
                    {external ? "↗" : "→"}
                  </span>
                </a>
                <span className="ct-note">{c.note}</span>
              </span>
              {c.copy && (
                <button
                  type="button"
                  className="btn btn-ghost ct-copy"
                  onClick={() => copy(c)}
                  aria-label={`Copy ${c.handle}`}
                >
                  {copied === c.id ? "Copied" : "Copy"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <aside className="ct-side" aria-label="Where we are">
        <div className={`ct-beacon${tunedChannel ? " is-tuned" : ""}`} aria-hidden>
          <span className="ct-ping" />
          <span className="ct-ping" />
          <span className="ct-ping" />
          <span className="ct-orbit">
            <span className="ct-orbit-dot" />
          </span>
          {/* ground dish, line art in the glyph language */}
          <svg className="ct-dish" viewBox="0 0 48 48" fill="none" strokeWidth="1.3" strokeLinecap="round">
            <path d="M10 26a15 15 0 0 0 21 12" stroke="var(--starlight)" />
            <path d="M10 26L31 38" stroke="var(--starlight)" opacity=".6" />
            <path d="M20.5 32l7-12" stroke="var(--starlight)" />
            <path d="M18 44h14M25 36v8" stroke="var(--dim-300)" />
            <circle className="ct-dish-feed" cx="28" cy="19" r="2.4" stroke="none" />
          </svg>
        </div>

        <p className="ct-readout">
          <span className="ct-readout-key">{tunedChannel ? "Tuned to" : "Listening on"}</span>
          <span className="ct-readout-value">
            {tunedChannel ? tunedChannel.label : `${channels.length} channels`}
          </span>
        </p>

        <div className="ct-base">
          <h2 className="ct-base-title">Base</h2>
          <address className="ct-base-lines">
            {base.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>
          <span className="ct-base-coords tabular">{base.coordinates}</span>
        </div>
      </aside>

      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Address copied to the clipboard." : ""}
      </span>
    </div>
  );
}
