"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import CursorBootPreloader from "./CursorBootPreloader";
import LandingPage from "./LandingPage";
import type { EarthOnScreen } from "./space/PowerOnIntro";
import HeroSection from "./HeroSection";
import Lenis from "lenis";
import { lockScroll } from "@/lib/scrollLock";
import StorySection, { STORY_HEIGHT } from "./story/StorySection";
import EventsPreview, { type PreviewEvent } from "./EventsPreview";
import { buildStops } from "./story/stops";
import type { PastEvent, UpcomingEvent } from "@/data/events";
import WhatsNew from "./WhatsNew";
import type { WhatsNewItem } from "@/lib/whatsNew";
import { setLenis } from "./story/lenis";

/* ============================================================
   HOME CLIENT - Deep Space Network Flow

   1. BootPreloader (the menu's planets light up as the site loads)
   2. LandingPage (3D power-on intro: board, traces, C S A U)
   3. Zoom transition → scrollable page:
      - Hero section (full viewport)
      - Scroll down reveals About Us section

   The landing is built under the preloader from the start, and the
   preloader follows it: it fills only once Earth has been drawn, then
   falls onto it, so there is no gap between the two.

   The preloader + landing gate plays ONCE per browser session.
   On refresh, the page goes straight to content with freshly
   loaded data (no boot/landing replay).
   ============================================================ */

type Phase = "boot" | "landing" | "content";

const GATE_KEY = "csau-gate-seen";

export default function HomeClient({
  whatsNew = [],
  preview,
  eventCount,
  storyPast,
  storyUpcoming,
}: {
  whatsNew?: WhatsNewItem[];
  /** the events preview strip and the total number of events */
  preview: PreviewEvent[];
  eventCount: number;
  /** the events the story visits (see story/stops.ts) */
  storyPast: PastEvent[];
  storyUpcoming: UpcomingEvent[];
}) {
  const stops = useMemo(() => buildStops(storyPast, storyUpcoming), [storyPast, storyUpcoming]);
  // Start with "boot" on both server and client to avoid hydration mismatch.
  // After mount, check sessionStorage to decide whether to skip the gate.
  const [phase, setPhase] = useState<Phase>("boot");
  const [zooming, setZooming] = useState(false);
  const initializedRef = useRef(false);
  /* A first visit: the landing is built under the preloader, which waits for its code and then for Earth. */
  const [landingUp, setLandingUp] = useState(false);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [earth, setEarth] = useState<EarthOnScreen | null>(null);
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

  /* The story's 3D scene is the heaviest thing on the page (large planet shaders). Mounting it the moment
     the flight hands off stalls the main thread right on the transition, so it waits until the hero has
     settled and the browser is idle. Its space is reserved (STORY_HEIGHT), so nothing shifts. */
  const [storyReady, setStoryReady] = useState(false);
  useEffect(() => {
    if (phase !== "content") return;
    let idle = 0;
    const ric: (cb: () => void) => number =
      "requestIdleCallback" in window
        ? (cb) => window.requestIdleCallback(cb, { timeout: 2500 })
        : (cb) => window.setTimeout(cb, 1);
    const t = window.setTimeout(() => {
      idle = ric(() => setStoryReady(true));
    }, 1500);
    return () => {
      clearTimeout(t);
      if (idle && "cancelIdleCallback" in window) window.cancelIdleCallback(idle);
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
      // Build the 3D intro under the boot preloader (it reports when Earth is drawn), and warm the
      // story's scene chunk too, so neither is fetched and parsed in the middle of the flight.
      setLandingUp(true);
      void import("./space/PowerOnIntro").then(
        () => setSceneLoaded(true),
        () => {} // the preloader's own time limit lets the visitor through
      );
      void import("./story/SpaceScene");
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
      {/* The landing mounts once, under the preloader, and stays mounted when the preloader lifts. */}
      {(phase === "landing" || (phase === "boot" && landingUp)) && (
        <div
          className="fixed inset-0 gate"
          inert={phase !== "landing"}
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
          <LandingPage onEnter={handleEnter} onReady={setEarth} />
        </div>
      )}

      {phase === "boot" && (
        <div className="gate">
          <CursorBootPreloader scene={sceneLoaded} earth={earth} onComplete={handleBootComplete} />
        </div>
      )}

      {phase === "content" && (
        <div style={{ background: "transparent", position: "relative" }}>
          <HeroSection />
          {/* rocket + flag in the hero's bottom-right corner */}
          <WhatsNew items={whatsNew} />
          {storyReady ? <StorySection stops={stops} /> : <div aria-hidden style={{ height: STORY_HEIGHT }} />}
          <EventsPreview items={preview} total={eventCount} />
        </div>
      )}
    </>
  );
}