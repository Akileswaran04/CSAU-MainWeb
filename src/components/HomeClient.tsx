"use client";

import HeroSection from "./HeroSection";
import AboutSection from "./AboutSection";

/* ============================================================
   HOME — Hero page (no boot / landing gate).

   The homepage IS the hero:
   - HeroSection fills the first viewport
   - Scroll down reveals the About section
   Navigation (laser button) + footer are always available.
   ============================================================ */

export default function HomeClient() {
  return (
    <div style={{ background: "var(--background)" }}>
      <HeroSection />
      <AboutSection />
    </div>
  );
}
