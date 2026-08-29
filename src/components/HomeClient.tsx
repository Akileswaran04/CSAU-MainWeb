"use client";

import { useState, useCallback, useEffect } from "react";
import CursorBootPreloader from "./CursorBootPreloader";
import LandingPage from "./LandingPage";
import DescriptionPage from "./DescriptionPage";

/* ============================================================
   HOME CLIENT — White Sculptural Tactility Flow

   1. BootPreloader (cursor draws diamond, types CSAU)
   2. LandingPage (clay rings, Sector034 CSAU, glitch, enter)
   3. DescriptionPage (typewriter about CSAU)

   On initial load: boot → landing → description
   On re-navigation: skip boot, go straight to landing
   ============================================================ */

type Phase = "boot" | "landing" | "description";

export default function HomeClient() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [zooming, setZooming] = useState(false);

  // Skip preloader on client-side navigation (after mount, no hydration mismatch)
  useEffect(() => {
    if (sessionStorage.getItem("csau-boot-done")) {
      setPhase("landing");
    }
  }, []);

  // Check if navigated with ?view=description — skip to description
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "description") {
      setPhase("description");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleBootComplete = useCallback(() => {
    sessionStorage.setItem("csau-boot-done", "1");
    setPhase("landing");
  }, []);

  const handleEnter = useCallback(() => {
    setZooming(true);
    setTimeout(() => {
      setPhase("description");
      setZooming(false);
    }, 1300);
  }, []);

  const handleBack = useCallback(() => {
    setPhase("landing");
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

      {phase === "description" && (
        <DescriptionPage onBack={handleBack} />
      )}
    </>
  );
}
