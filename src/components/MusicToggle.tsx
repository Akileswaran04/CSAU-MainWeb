"use client";

import { useSyncExternalStore } from "react";
import { musicState, subscribeMusic, toggleMusic } from "@/lib/music";

/* the music's pause/play switch; shown once the Earth tap has started it */
export default function MusicToggle() {
  const state = useSyncExternalStore(subscribeMusic, musicState, () => "off" as const);
  if (state === "off") return null;
  const on = state === "on";
  return (
    <>
      <style>{`
        .mu-toggle {
          position: fixed;
          right: max(20px, env(safe-area-inset-right));
          bottom: max(20px, env(safe-area-inset-bottom));
          z-index: 400;
          display: inline-flex;
          align-items: flex-end;
          justify-content: center;
          gap: 3px;
          width: 44px;
          height: 44px;
          padding: 13px 12px;
          border-radius: 2px;
          border: 1px solid var(--outline-variant);
          background: transparent;
          cursor: pointer;
          touch-action: manipulation;
        }
        .mu-toggle i { width: 3px; height: 100%; background: var(--on-surface); transform-origin: bottom; transform: scaleY(.25); }
        .mu-toggle[aria-pressed="true"] i { animation: mu-bar .9s ease-in-out infinite alternate; }
        .mu-toggle i:nth-child(2) { animation-delay: -.3s; }
        .mu-toggle i:nth-child(3) { animation-delay: -.6s; }
        .mu-toggle i:nth-child(4) { animation-delay: -.15s; }
        .mu-toggle:focus-visible { outline: 2px solid var(--signal); outline-offset: 3px; }
        @keyframes mu-bar { to { transform: scaleY(1); } }
        @media (prefers-reduced-motion: reduce) {
          .mu-toggle[aria-pressed="true"] i { animation: none; transform: scaleY(.7); }
        }
      `}</style>
      <button type="button" className="mu-toggle" aria-pressed={on} aria-label={on ? "Pause music" : "Play music"} onClick={toggleMusic}>
        <i />
        <i />
        <i />
        <i />
      </button>
    </>
  );
}
