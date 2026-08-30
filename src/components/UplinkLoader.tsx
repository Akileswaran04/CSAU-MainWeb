"use client";

import { useRef, useEffect, type CSSProperties } from "react";

/* ============================================================
   UPLINK LOADER — Compact Progress Bar (pure React)

   56 illuminated ticks, percentage readout, status text.
   Progress driven directly by parent prop — instant, no
   iframe/message timing issues.

   Styled to match the original ThreeUI UplinkLoader aesthetic.
   ============================================================ */

const TICKS = 56;
const MARK_EVERY = 8;

const PHASES: [number, string][] = [
  [0, "INITIALIZING CORE SYSTEMS"],
  [24, "LOADING COMPONENTS"],
  [52, "SYNCHRONIZING DATA"],
  [78, "PREPARING INTERFACE"],
  [100, "SYSTEM READY"],
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
  const prevLitRef = useRef(-1);
  const tickRefs = useRef<(HTMLDivElement | null)[]>([]);

  const clampedPct = Math.max(0, Math.min(100, Math.round(progress)));
  const lit = Math.round((clampedPct / 100) * TICKS);
  const displayStatus = phaseFor(clampedPct);

  // Flash newly lit ticks
  useEffect(() => {
    if (lit > prevLitRef.current && prevLitRef.current >= 0 && lit > 0) {
      const el = tickRefs.current[lit - 1];
      if (el) {
        el.classList.remove("tick-flash");
        void el.offsetWidth; // reflow
        el.classList.add("tick-flash");
      }
    }
    prevLitRef.current = lit;
  }, [lit]);

  return (
    <>
      <style>{`
        .uplink-loader-wrap {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 4%;
          gap: 3px;
          width: 100%;
          height: 100%;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          -webkit-font-smoothing: antialiased;
        }
        .uplink-top-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          width: 100%;
        }
        .uplink-label {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: .14em;
          color: #77767b;
          opacity: .55;
        }
        .uplink-readout {
          font-size: 10px;
          font-weight: 300;
          letter-spacing: .7px;
          color: #77767b;
          text-shadow: 0 0 2px rgba(119,118,123,.12);
        }
        .uplink-bar {
          width: 100%;
          height: 12px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 1px;
        }
        .uplink-tick {
          flex: 1;
          min-width: 0;
          height: 7px;
          background: rgba(119,118,123,.2);
          transform: skewX(8deg);
          border-radius: 1px;
          transition: background .1s, box-shadow .1s;
        }
        .uplink-tick.mk { height: 12px; }
        .uplink-tick.on {
          background: #77767b;
          box-shadow: 0 0 2px rgba(119,118,123,.25);
        }
        .uplink-tick.tick-flash {
          animation: uplinkIgnite .25s ease-out;
        }
        @keyframes uplinkIgnite {
          0% { background: #c7c6cb; box-shadow: 0 0 5px rgba(199,198,203,.5), 0 0 12px rgba(119,118,123,.25); }
          100% { background: #77767b; box-shadow: 0 0 2px rgba(119,118,123,.25); }
        }
        .uplink-status {
          font-size: 7px;
          font-weight: 500;
          letter-spacing: .11em;
          color: #77767b;
          opacity: .45;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

      <div className={`uplink-loader-wrap ${className}`} style={style}>
        <div className="uplink-top-row">
          <span className="uplink-label">CSAU</span>
          <span className="uplink-readout">{clampedPct}%</span>
        </div>

        <div className="uplink-bar">
          {Array.from({ length: TICKS }, (_, i) => (
            <div
              key={i}
              ref={(el) => { tickRefs.current[i] = el; }}
              className={`uplink-tick${(i + 1) % MARK_EVERY === 0 ? " mk" : ""}${i < lit ? " on" : ""}`}
            />
          ))}
        </div>

        <div className="uplink-status">{displayStatus}</div>
      </div>
    </>
  );
}
