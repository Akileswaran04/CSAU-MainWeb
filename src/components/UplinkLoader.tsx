"use client";

import type { CSSProperties } from "react";

/* ============================================================
   UPLINK LOADER — koi-swim progress cue (pure React + CSS)

   A hairline waterline with a small koi that swims along it as
   progress advances, a ripple travelling with it, a percentage
   readout and a status line. Progress is driven directly by the
   parent prop. Props are unchanged from the old tick-bar.
   ============================================================ */

const PHASES: [number, string][] = [
  [0, "STIRRING THE WATER"],
  [24, "GATHERING THE LILIES"],
  [52, "CALLING THE KOI"],
  [78, "SETTLING THE SURFACE"],
  [100, "THE POND IS READY"],
];

function phaseFor(p: number): string {
  let t = PHASES[0][1];
  for (const [k, v] of PHASES) if (p >= k) t = v;
  return t;
}

export type UplinkLoaderProps = {
  className?: string;
  style?: CSSProperties;
  progress?: number; // 0-100
};

export function UplinkLoader({ className = "", style, progress = 0 }: UplinkLoaderProps) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <>
      <style>{`
        .uplink-loader-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
          -webkit-font-smoothing: antialiased;
        }
        .uplink-top-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }
        .uplink-label {
          font-family: 'Ethnocentric', 'Sector034', sans-serif;
          font-size: 15px;
          letter-spacing: .06em;
          color: var(--on-surface, var(--foam));
        }
        .uplink-readout {
          font-size: 13px;
          letter-spacing: .08em;
          color: var(--on-surface, var(--foam));
          font-variant-numeric: tabular-nums;
        }
        .uplink-water {
          position: relative;
          height: 26px;
          margin: 0 18px;
        }
        .uplink-line, .uplink-fill {
          position: absolute;
          left: 0;
          top: 50%;
          height: 1px;
        }
        .uplink-line { right: 0; background: var(--outline-variant, var(--pond-700)); }
        .uplink-fill {
          background: var(--outline, var(--pond-300));
          transition: width .25s linear;
        }
        .uplink-koi {
          position: absolute;
          top: 50%;
          width: 44px;
          height: 18px;
          transform: translate(-50%, -50%);
          transition: left .25s linear;
        }
        .uplink-koi svg { display: block; overflow: visible; }
        .uplink-tail { transform-origin: 12px 9px; animation: uplinkWag .7s ease-in-out infinite; }
        @keyframes uplinkWag { 0%,100% { transform: rotate(-14deg); } 50% { transform: rotate(14deg); } }
        .uplink-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 30px;
          height: 12px;
          margin: -6px 0 0 -15px;
          border: 1px solid var(--outline, var(--pond-300));
          border-radius: 50%;
          opacity: 0;
          animation: uplinkRing 1.8s ease-out infinite;
        }
        .uplink-ring.b { animation-delay: .9s; }
        @keyframes uplinkRing {
          0% { transform: scale(.3); opacity: .7; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .uplink-status {
          font-size: 11px;
          letter-spacing: .16em;
          color: var(--on-surface-variant, var(--pond-300));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (prefers-reduced-motion: reduce) {
          .uplink-tail, .uplink-ring { animation: none; }
          .uplink-fill, .uplink-koi { transition: none; }
        }
      `}</style>

      <div
        className={`uplink-loader-wrap ${className}`}
        style={style}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Loading"
      >
        <div className="uplink-top-row">
          <span className="uplink-label">CSAU</span>
          <span className="uplink-readout">{pct}%</span>
        </div>

        <div className="uplink-water" aria-hidden>
          <div className="uplink-line" />
          <div className="uplink-fill" style={{ width: `${pct}%` }} />
          <div className="uplink-koi" style={{ left: `${pct}%` }}>
            <span className="uplink-ring" />
            <span className="uplink-ring b" />
            <svg width="44" height="18" viewBox="0 0 44 18">
              <defs>
                <clipPath id="uplinkKoiBody">
                  <path d="M42 9 C 40 4.5, 32 3, 25 4 C 19 4.8, 15 6.5, 12 9 C 15 11.5, 19 13.2, 25 14 C 32 15, 40 13.5, 42 9 Z" />
                </clipPath>
              </defs>
              <g className="uplink-tail">
                <path d="M13 9 L1 2 Q4 9 1 16 Z" fill="var(--foam)" opacity=".4" />
              </g>
              <path d="M28 5 L23 0.5 L21 5 Z M28 13 L23 17.5 L21 13 Z" fill="var(--foam)" opacity=".45" />
              <path d="M42 9 C 40 4.5, 32 3, 25 4 C 19 4.8, 15 6.5, 12 9 C 15 11.5, 19 13.2, 25 14 C 32 15, 40 13.5, 42 9 Z" fill="var(--foam)" />
              <g clipPath="url(#uplinkKoiBody)" fill="var(--signal)">
                <ellipse cx="37" cy="8.5" rx="4" ry="4.5" />
                <ellipse cx="26" cy="8" rx="5" ry="3" />
                <ellipse cx="17" cy="10" rx="3.5" ry="2.6" />
              </g>
              <circle cx="38.6" cy="6.4" r=".8" fill="var(--pond-950)" />
              <circle cx="38.6" cy="11.6" r=".8" fill="var(--pond-950)" />
            </svg>
          </div>
        </div>

        <div className="uplink-status">{phaseFor(pct)}</div>
      </div>
    </>
  );
}
