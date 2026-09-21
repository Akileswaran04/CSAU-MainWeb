"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import CursorBootPreloader from "./CursorBootPreloader";
import LandingPage from "./LandingPage";
import HeroSection from "./HeroSection";
import Lenis from "lenis";
import { lockScroll } from "@/lib/scrollLock";
import StorySection from "./story/StorySection";
import { setLenis } from "./story/lenis";

/* ============================================================
   HOME CLIENT - Deep Space Network Flow

   1. BootPreloader (cursor draws diamond, types CSAU)
   2. LandingPage (3D power-on intro: board, traces, C S A U)
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
  // Smooth scrolling for the story, once the gate has cleared.
  useEffect(() => {
    if (phase !== "content") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    setLenis(lenis);
    let raf = requestAnimationFrame(function tick(t) {
      lenis.raf(t);
      raf = requestAnimationFrame(tick);
    });
    return () => {
      cancelAnimationFrame(raf);
      setLenis(null);
      lenis.destroy();
    };
  }, [phase]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const seen = sessionStorage.getItem(GATE_KEY) === "true";
    if (seen) {
      setPhase("content");
    } else {
      sessionStorage.setItem(GATE_KEY, "true");
      // Warm the 3D intro chunk while the boot preloader plays.
      void import("./space/PowerOnIntro");
    }
  }, []);

  // Lock scroll and reset to top while the boot/landing gate covers
  // the page, so the hero is what you land on after entering.
  useEffect(() => {
    if (phase === "content") return;
    window.scrollTo(0, 0);
    return lockScroll();
  }, [phase]);

  const handleBootComplete = useCallback(() => {
    setPhase("landing");
  }, []);

  const handleEnter = useCallback(() => {
    // Reduced motion: no dive, just cross to the content.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("content");
      return;
    }
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
            // Handoff: the wordmark rushes up and sinks into the void.
            transition:
              "transform 1.3s cubic-bezier(.5,0,.2,1), opacity .9s ease .4s, background-color .7s ease",
            transform: zooming ? "scale(2.8)" : "scale(1)",
            opacity: zooming ? 0 : 1,
            backgroundColor: zooming ? "var(--void-950)" : "transparent",
          }}
        >
          <LandingPage onEnter={handleEnter} />
        </div>
      )}

      {phase === "content" && (
        <div style={{ background: "transparent" }}>
          <HeroSection />
          <StorySection />
        </div>
      )}
    </>
  );
}