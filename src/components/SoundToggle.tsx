"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  isAmbienceOn,
  setAmbienceOn,
  startDrone,
  stopDrone,
  getAudio,
} from "@/lib/sound";

/* ============================================================================
   SOUND TOGGLE — minimal persistent ambience control.
   "◉ AMBIENCE ON / ○ AMBIENCE OFF" bottom-left; preference persists in
   localStorage via the shared sound engine. Never autoplays: enabling
   requires a click, and the AudioContext only starts on that gesture.
   ========================================================================== */

export default function SoundToggle() {
  const [on, setOn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOn(isAmbienceOn());
  }, []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    setAmbienceOn(next);
    // Notify AmbientSound component of toggle
    window.dispatchEvent(new CustomEvent("csau:ambience-toggle"));
    if (next) {
      getAudio();
      startDrone();
    } else {
      stopDrone(0.8);
    }
  };

  if (!mounted) return null;

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.6 }}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Turn ambience off" : "Turn ambience on"}
      className="fixed bottom-5 left-5 z-50 flex items-center gap-2 px-3 py-2 rounded-full glass text-[10px] tracking-[0.25em] uppercase text-foreground/50 hover:text-cyan transition-colors font-[family-name:var(--font-geist-mono)]"
    >
      <span className={on ? "text-cyan" : "text-foreground/30"}>
        {on ? "◉" : "○"}
      </span>
      {on ? "Ambience On" : "Sound Off"}
    </motion.button>
  );
}
