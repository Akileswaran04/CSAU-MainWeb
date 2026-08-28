"use client";

import { useState, useCallback, useEffect } from "react";
import CursorBootPreloader from "./CursorBootPreloader";
import LandingPage from "./LandingPage";
import DescriptionPage from "./DescriptionPage";

/* ============================================================
   HOME CLIENT — Flow from cursor-character.html:
   
   1. BootPreloader (SVG cursor draws diamond, types CSAU)
   2. LandingPage (rotating rings, brand text, enter button)
   3. DescriptionPage (typewriter about CSAU)
   
   Transitions:
   - Boot → Landing: fade out preloader
   - Landing → Description: zoom-into-circle effect
   ============================================================ */

type Phase = "boot" | "landing" | "description";

export default function HomeClient() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [zooming, setZooming] = useState(false);

  // Check if navigated with ?view=description — skip boot and landing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "description") {
      setPhase("description");
      // Clean the URL so refresh doesn't replay it
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleBootComplete = useCallback(() => {
    setPhase("landing");
  }, []);

  const handleEnter = useCallback(() => {
    // Zoom-into-circle transition (from cursor-character.html)
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
      {/* Boot preloader */}
      {phase === "boot" && (
        <CursorBootPreloader onComplete={handleBootComplete} />
      )}

      {/* Landing page */}
      {phase === "landing" && (
        <div
          className="fixed inset-0"
          style={{
            zIndex: 10,
            transition: "transform 1.3s cubic-bezier(.7,0,.15,1), opacity 1.1s ease",
            transform: zooming ? "scale(9)" : "scale(1)",
            opacity: zooming ? 0 : 1,
            backgroundColor: zooming ? "#000" : undefined,
          }}
        >
          <LandingPage onEnter={handleEnter} />
        </div>
      )}

      {/* Description page */}
      {phase === "description" && (
        <DescriptionPage onBack={handleBack} />
      )}
    </>
  );
}
