"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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

   The preloader + landing gate plays ONCE per browser session.
   On refresh, the page goes straight to content with freshly
   loaded data (no boot/landing replay).
   ============================================================ */

type Phase = "boot" | "landing" | "content";

const GATE_KEY = "csau-gate-seen";

export default function HomeClient() {
  // Start with "boot" on both server and client to avoid hydration mismatch.
  // After mount, check sessionStorage to decide whether to skip the gate.
  const [phase, setPhase] = useState<Phase>("boot");
  const [zooming, setZooming] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const seen = sessionStorage.getItem(GATE_KEY) === "true";
    if (seen) {
      setPhase("content");
    } else {
      sessionStorage.setItem(GATE_KEY, "true");
    }
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