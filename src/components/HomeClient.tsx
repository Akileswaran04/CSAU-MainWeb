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

   The gate replays on EVERY full page load (opening or refreshing
   the site). The module-level flag below survives client-side
   navigation but resets on every full load, so navigating between
   routes never replays the boot + landing gate.
   ============================================================ */

type Phase = "boot" | "landing" | "content";

let gateSeen = false;

export default function HomeClient() {
  const [phase, setPhase] = useState<Phase>(() =>
    gateSeen ? "content" : "boot"
  );
  const [zooming, setZooming] = useState(false);

  // Mark the gate as seen on first mount so client-side navigation
  // back to the home page skips straight to content.
  useEffect(() => {
    gateSeen = true;
  }, []);

  // Lock scroll and reset to top while the boot/landing gate covers
  // the page, so the hero is what you land on after entering.
  useEffect(() => {
    if (phase === "content") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  const handleBootComplete = useCallback(() => {
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
            zIndex: 600,
            transition:
              "transform 1.3s cubic-bezier(.7,0,.15,1), opacity 1.1s ease",
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