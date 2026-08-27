"use client";

import { useEffect, useRef } from "react";
import { getAudio, isAmbienceOn, crossfadeTo, stopSectionAmbient } from "@/lib/sound";

/* ============================================================================
   AMBIENT SOUND — per-section soundscape controller.
   
   Uses IntersectionObserver to detect which section is currently in view,
   then crossfades to that section's unique ambient soundscape.
   
   Only active when the user has enabled ambience via the SoundToggle.
   Each section has a distinct procedural audio texture:
     - #gate   → Gateway:  Deep rumble + digital pulse
     - #origin → Core:     CPU hum + electronic oscillation
     - #domains→ Grounds:  Energy buzz + tension drone
     - #archive→ Vault:   Wind draft + crystalline tones
     - #people → Command:  Console hum + data stream
     - #portal → Portal:   Swirling energy + resonant sweep
   
   Respects prefers-reduced-motion: disables crossfading.
   ========================================================================== */

type SectionId = "gateway" | "core" | "grounds" | "vault" | "command" | "portal";

const SECTION_MAP: { id: string; sound: SectionId }[] = [
  { id: "gate", sound: "gateway" },
  { id: "origin", sound: "core" },
  { id: "domains", sound: "grounds" },
  { id: "archive", sound: "vault" },
  { id: "people", sound: "command" },
  { id: "portal", sound: "portal" },
];

export default function AmbientSound() {
  const activeSound = useRef<SectionId | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Don't set up if reduced motion is preferred
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Create IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Only act if ambience is enabled
        if (!isAmbienceOn()) return;

        // Find the most visible section
        let bestEntry: IntersectionObserverEntry | null = null;
        let bestRatio = 0;

        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestEntry = entry;
          }
        }

        if (!bestEntry) return;

        const sectionConfig = SECTION_MAP.find((s) => s.id === bestEntry!.target.id);
        if (!sectionConfig) return;

        // Only crossfade if it's a different section
        if (activeSound.current !== sectionConfig.sound) {
          activeSound.current = sectionConfig.sound;
          crossfadeTo(sectionConfig.sound);
        }
      },
      {
        // Trigger when section is 30% visible
        threshold: [0.1, 0.3, 0.5, 0.7],
        rootMargin: "-10% 0px -10% 0px",
      }
    );

    // Observe all section elements
    for (const section of SECTION_MAP) {
      const el = document.getElementById(section.id);
      if (el) observerRef.current.observe(el);
    }

    // Listen for ambience toggle events
    const onToggle = () => {
      if (!isAmbienceOn()) {
        stopSectionAmbient(1.2);
        activeSound.current = null;
      }
    };
    window.addEventListener("csau:ambience-toggle", onToggle);

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener("csau:ambience-toggle", onToggle);
    };
  }, []);

  // This component renders nothing — it's purely a side-effect controller
  return null;
}
