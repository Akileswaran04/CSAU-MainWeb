"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

/* The 3D intro is a separate chunk; the boot preloader warms it up. */
const PowerOnIntro = dynamic(() => import("./space/PowerOnIntro"), { ssr: false });

/* ============================================================
   LANDING PAGE - Earth, alone

   Standby shows nothing but Earth turning in the dark, with one line
   of hint text. Tapping Earth launches the flight: the camera drifts
   into space along a glowing line through the letters C, S, A and U,
   then hands off to the hero. Once it is running, a short telemetry
   line and SKIP appear.
   ============================================================ */

interface LandingPageProps {
  onEnter?: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [started, setStarted] = useState(false);
  const [clock, setClock] = useState("--:--:--");
  const entered = useRef(false);

  useEffect(() => {
    if (!started) return;
    const tick = () => setClock(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [started]);

  /* Hand off exactly once, whether the sequence ends or SKIP is pressed. */
  const enter = useCallback(() => {
    if (entered.current) return;
    entered.current = true;
    onEnter?.();
  }, [onEnter]);

  const fade = { opacity: started ? 1 : 0, transition: "opacity .6s ease .3s", pointerEvents: started ? "auto" : "none" } as const;

  return (
    <>
      <style>{`
        .ld-skip {
          position: absolute;
          right: 5%;
          bottom: 26px;
          z-index: 40;
          min-width: var(--tap-min);
          min-height: var(--tap-min);
          padding: 0 16px;
          background: transparent;
          color: var(--starlight);
          border: 1px solid var(--dim-300);
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: .2em;
          text-transform: uppercase;
          cursor: pointer;
          touch-action: manipulation;
          transition: border-color 150ms ease, background-color 150ms ease;
        }
        .ld-skip:hover { border-color: var(--starlight); background: var(--hull-900); }
        .ld-skip:focus-visible { outline: 2px solid var(--signal); outline-offset: 3px; }
      `}</style>
      <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 10, background: "var(--space-black)" }}>
        <PowerOnIntro onPowerOn={() => setStarted(true)} onEnter={enter} />

        <h1 className="sr-only">CSAU - Computer Society of Anna University</h1>

        {/* Appears only once the flight has started */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: "5%",
            bottom: 34,
            zIndex: 20,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: ".2em",
            color: "var(--dim-300)",
            ...fade,
          }}
        >
          <div style={{ marginBottom: 6 }}>In transit</div>
          <div>
            13.08 N 80.27 E <span style={{ color: "var(--lit)" }}>·</span> {clock}
          </div>
        </div>

        {/* the only text on the start page */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 0,
            right: 0,
            bottom: "max(28px, env(safe-area-inset-bottom))",
            zIndex: 20,
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            letterSpacing: ".24em",
            textTransform: "uppercase",
            color: "var(--dim-300)",
            opacity: started ? 0 : 1,
            transition: "opacity .4s ease",
          }}
        >
          Tap Earth to launch
        </div>

        <button type="button" className="ld-skip" onClick={enter} style={fade} tabIndex={started ? 0 : -1}>
          Skip
        </button>
      </div>
    </>
  );
}
