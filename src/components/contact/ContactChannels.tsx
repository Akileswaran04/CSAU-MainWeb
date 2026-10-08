"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import type { ContactChannel } from "@/data/contact";

/* ============================================================
   CONTACT CHANNELS - the pulsar map.

   After the map on the Voyager Golden Record (the reference: "A
   Message From Earth", Stink Studios for WeTransfer): lines run
   out from one point, the base, each to one of the club's
   channels, at its own angle and length. Like the pulsar map's,
   every line carries a number in binary as ticks across it: here
   the ASCII code of the channel's initial.

     • the base pings; a pulse runs out along each line in turn
     • pointing at or focusing a channel lights its line amber,
       runs pulses down it and names it on the readout
     • the channels are a real list of links laid over the map's
       line ends; under 1100px the map is a figure and the list
       is ruled rows, numbered to match
     • the email row offers Copy, announced politely
   SVG and CSS only; motion stops under reduced motion and while
   the menu covers the page.
   ============================================================ */

const VIEW_W = 1200;
const VIEW_H = 660;
const CX = 600;
const CY = 320;
/* each channel's line: its direction (degrees clockwise from east) and length, irregular like the pulsar map's.
   The space under the base is kept for the base's address. */
const RAYS = [
  { a: -158, l: 340 },
  { a: -118, l: 270 },
  { a: -64, l: 270 },
  { a: -22, l: 330 },
  { a: 24, l: 330 },
  { a: 158, l: 360 },
];
const rayFor = (i: number) => RAYS[i] ?? { a: 40 + (i - RAYS.length) * 22, l: 200 }; // a seventh channel still gets a line

const pad = (n: number) => String(n).padStart(2, "0");

function geometry(i: number, label: string) {
  const { a, l } = rayFor(i);
  const r = (a * Math.PI) / 180;
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  const x = CX + l * dx;
  const y = CY + l * dy;
  const bits = (label.charCodeAt(0) || 0).toString(2).padStart(8, "0");
  /* the ticks: a long one for 1, a short one for 0, across the outer half of the line */
  const ticks = [...bits]
    .map((b, k) => {
      const t = 0.44 + k * 0.056;
      const h = b === "1" ? 8 : 2.5;
      const px = CX + l * t * dx;
      const py = CY + l * t * dy;
      return `M${(px + dy * h).toFixed(1)} ${(py - dx * h).toFixed(1)}L${(px - dy * h).toFixed(1)} ${(py + dx * h).toFixed(1)}`;
    })
    .join("");
  return { x, y, ticks, bits, side: x < CX ? "left" : "right" };
}

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

  const geo = channels.map((c, i) => geometry(i, c.label));
  const tunedChannel = channels.find((c) => c.id === tuned);

  return (
    <div className="pm" data-tuned={tuned ? "" : undefined}>
      <div className="pm-map">
        <svg className="pm-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden focusable="false">
          <circle className="pm-orbit" cx={CX} cy={CY} r="46" />
          <circle className="pm-orbit" cx={CX} cy={CY} r="92" />
          <line className="pm-axis" x1={CX} y1={CY} x2={VIEW_W} y2={CY} />
          {channels.map((c, i) => {
            const g = geo[i];
            return (
              <g key={c.id} className="pm-ray" data-on={tuned === c.id || undefined} style={{ "--i": i } as CSSProperties}>
                <line className="pm-line" x1={CX} y1={CY} x2={g.x} y2={g.y} />
                <line className="pm-pulse" x1={CX} y1={CY} x2={g.x} y2={g.y} pathLength={100} />
                <path className="pm-bits" d={g.ticks} />
                <circle className="pm-end" cx={g.x} cy={g.y} r="5" />
                <text className="pm-num" x={g.x} y={g.y + (g.y < CY ? -16 : 28)} textAnchor="middle">
                  {pad(i + 1)}
                </text>
              </g>
            );
          })}
          <g className="pm-base">
            <circle className="pm-ping" cx={CX} cy={CY} r="10" />
            <circle className="pm-ping" cx={CX} cy={CY} r="10" />
            <circle className="pm-ping" cx={CX} cy={CY} r="10" />
            <circle className="pm-core" cx={CX} cy={CY} r="5" />
          </g>
        </svg>

        <div className="pm-caption">
          Each line carries its channel&apos;s initial in binary, as the pulsar map on the Voyager Golden Record does.
        </div>

        <ul className="pm-nodes" aria-label="Ways to reach CSAU">
          {channels.map((c, i) => {
            const g = geo[i];
            const external = !c.href.startsWith("mailto:");
            return (
              <li
                key={c.id}
                className="pm-node"
                data-side={g.side}
                data-on={tuned === c.id || undefined}
                style={{ "--x": g.x / VIEW_W, "--y": g.y / VIEW_H, "--i": i } as CSSProperties}
                onMouseEnter={() => setTuned(c.id)}
                onMouseLeave={() => setTuned((t) => (t === c.id ? null : t))}
                onFocus={() => setTuned(c.id)}
                onBlur={() => setTuned((t) => (t === c.id ? null : t))}
              >
                <span className="pm-label">
                  <span className="pm-no tabular" aria-hidden>
                    {pad(i + 1)}
                  </span>
                  {c.label}
                  <span className="pm-bin tabular" aria-hidden>
                    {g.bits}
                  </span>
                </span>
                <a
                  className="pm-handle"
                  href={c.href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  aria-label={external ? `${c.label}: ${c.handle}. Opens in a new tab.` : `${c.label}: ${c.handle}`}
                >
                  {c.handle}
                  <span className="pm-arrow" aria-hidden>
                    {external ? "↗" : "→"}
                  </span>
                </a>
                <span className="pm-note">{c.note}</span>
                {c.copy && (
                  <button type="button" className="btn btn-ghost pm-copy" onClick={() => copy(c)} aria-label={`Copy ${c.handle}`}>
                    {copied === c.id ? "Copied" : "Copy"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <p className="pm-readout">
          <span className="pm-readout-key">{tunedChannel ? "Tuned to" : "Listening on"}</span>
          <span className="pm-readout-value">{tunedChannel ? tunedChannel.label : `${channels.length} channels`}</span>
        </p>

        <aside className="pm-baseinfo" aria-label="Where we are">
          {/* the club's logo, as on csau.in */}
          <Image
            src="/images/brand/csau-logo.png"
            alt="CSAU logo: a desktop computer with keyboard and mouse beside the letters CSAU"
            width={1600}
            height={701}
            sizes="200px"
            className="pm-logo"
          />
          <h2 className="pm-base-title">Base</h2>
          <address className="pm-base-lines">
            {base.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>
          <span className="pm-base-coords tabular">{base.coordinates}</span>
        </aside>
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Address copied to the clipboard." : ""}
      </span>
    </div>
  );
}
