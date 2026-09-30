"use client";

import { useState } from "react";

/* ============================================================
   EVENT POSTER - the visual plate for an event card.

   If a real poster URL exists we show it (and fall back to the
   generated plate if it fails to load). Otherwise we render a
   deterministic, space-themed plate built from tokens and pure
   SVG - a starfield, an orbit ring and the event's initials -
   so the layout always has a strong visual without inventing a
   fake image. No external dependencies.
   ============================================================ */

export interface EventPosterProps {
  name: string;
  tag: string;
  poster?: string;
  /** Marks the plate as decorative when the name is already shown as text. */
  variant?: "card" | "feature";
}

/** Small deterministic hash so the same event always gets the same plate. */
function seedFrom(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function initials(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Deterministic pseudo-random star positions from a seed. */
function stars(seed: number, count: number) {
  const out: { x: number; y: number; r: number; o: number }[] = [];
  let s = seed || 1;
  const rnd = () => {
    // xorshift
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1000) / 1000;
  };
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.round(rnd() * 300),
      y: Math.round(rnd() * 180),
      r: rnd() * 1.1 + 0.3,
      o: rnd() * 0.6 + 0.2,
    });
  }
  return out;
}

export default function EventPoster({ name, tag, poster, variant = "card" }: EventPosterProps) {
  const [failed, setFailed] = useState(false);

  if (poster && !failed) {
    return (
      <div className="ev-poster">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster}
          alt={`Poster for ${name}`}
          loading="lazy"
          decoding="async"
          className="ev-poster-img"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  const seed = seedFrom(name + tag);
  const pts = stars(seed, variant === "feature" ? 26 : 16);
  // orbit tilt varies per event for subtle variety
  const tilt = (seed % 40) - 20;

  return (
    <div className="ev-poster ev-poster-gen" role="img" aria-label={`${name} — generated poster plate`}>
      <svg viewBox="0 0 300 180" preserveAspectRatio="xMidYMid slice" aria-hidden focusable="false">
        <defs>
          <radialGradient id={`evg-${seed}`} cx="78%" cy="20%" r="90%">
            <stop offset="0%" stopColor="var(--lit-soft)" />
            <stop offset="55%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width="300" height="180" fill="var(--surface-container-high)" />
        <rect width="300" height="180" fill={`url(#evg-${seed})`} opacity="0.7" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="var(--starlight)" opacity={p.o} />
        ))}
        {/* orbit ring + body */}
        <g transform={`rotate(${tilt} 210 44)`}>
          <ellipse
            cx="210"
            cy="44"
            rx="52"
            ry="18"
            fill="none"
            stroke="var(--lit)"
            strokeWidth="1"
            opacity="0.55"
          />
          <circle cx="262" cy="44" r="3.5" fill="var(--lit)" />
        </g>
      </svg>
      <span className="ev-poster-mono" aria-hidden>
        {initials(name)}
      </span>
      <span className="ev-poster-tag" aria-hidden>
        {tag}
      </span>
    </div>
  );
}
