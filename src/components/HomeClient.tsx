"use client";

import { useState, useCallback, useEffect } from "react";
import CursorBootPreloader from "./CursorBootPreloader";
import LandingPage from "./LandingPage";
import HeroSection from "./HeroSection";
import AboutSection from "./AboutSection";

/* ============================================================
   HOME CLIENT — White Sculptural Tactility Flow

   1. BootPreloader (cursor draws diamond, types CSAU)
   2. LandingPage (clay rings, Sector034 CSAU, glitch, enter)
   3. Zoom transition → scrollable page:
      - Hero section (full viewport)
      - Scroll down reveals About Us section

   On initial load: boot → landing → scrollable page
   On re-navigation: skip boot, go straight to landing
   ============================================================ */

type Phase = "boot" | "landing" | "content";

export default function HomeClient() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [zooming, setZooming] = useState(false);

  // Skip preloader on client-side navigation
  useEffect(() => {
    if (sessionStorage.getItem("csau-boot-done")) {
      setPhase("landing");
    }
  }, []);

  const handleBootComplete = useCallback(() => {
    sessionStorage.setItem("csau-boot-done", "1");
    setPhase("landing");
  }, []);

  const handleEnter = useCallback(() => {
    setZooming(true);
    setTimeout(() => {
      setPhase("content");
      setZooming(false);
    }, 1300);
  }, []);

  return (
    <>
      {phase === "boot" && (
        <CursorBootPreloader onComplete={handleBootComplete} />
      )}

      {phase === "landing" && (
        <div
          className="fixed inset-0"
          style={{
            zIndex: 10,
            transition: "transform 1.3s cubic-bezier(.7,0,.15,1), opacity 1.1s ease",
            transform: zooming ? "scale(9)" : "scale(1)",
            opacity: zooming ? 0 : 1,
            backgroundColor: zooming ? "var(--background)" : undefined,
          }}
        >
          <LandingPage onEnter={handleEnter} />
        </div>
      )}

      {phase === "content" && (
        <div style={{ background: "var(--background)" }}>
          <HeroSection />
          <AboutSection />
        </div>
      )}
    </>
  );
}
