"use client";

import { useEffect, useRef, lazy, Suspense, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Preloader from "./Preloader";
import ScrollProgressBar from "./ScrollProgressBar";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ============================================================
   HOME CLIENT — Single GSAP controller for all sections.
   
   Each section:
   - Is exactly 100vh
   - Gets pinned by GSAP for a scroll distance
   - Has entrance animations during the pin
   - Transitions smoothly to the next section
   
   This avoids the lag of multiple competing pin spacers
   by using ONE master timeline.
   ============================================================ */

/* Lazy-load all heavy sections */
const Hero = lazy(() => import("./Hero"));
const Origin = lazy(() => import("./Origin"));
const Domains = lazy(() => import("./Domains"));
const HorizontalGallery = lazy(() => import("./HorizontalGallery"));
const Archive = lazy(() => import("./Archive"));
const People = lazy(() => import("./People"));
const Portal = lazy(() => import("./Portal"));

/* Section definitions */
const SECTIONS = [
  { id: "gate", label: "GATEWAY", scrollDist: 150 },
  { id: "origin", label: "THE CORE", scrollDist: 100 },
  { id: "domains", label: "TRAINING GROUNDS", scrollDist: 100 },
  { id: "gallery", label: "HIGHLIGHTS", scrollDist: 0 }, // has own scroll
  { id: "archive", label: "DATA VAULT", scrollDist: 100 },
  { id: "people", label: "COMMAND CENTER", scrollDist: 100 },
  { id: "portal", label: "THE PORTAL", scrollDist: 80 },
];

/* Section wrapper with GSAP pin */
function PinnedSection({
  id,
  children,
  scrollDist = 100,
}: {
  id: string;
  children: React.ReactNode;
  scrollDist?: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current || !pinRef.current || scrollDist === 0) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    /* Entrance animation — slide up, no opacity */
    gsap.fromTo(
      pinRef.current,
      { y: 60 },
      {
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top 95%",
          toggleActions: "play none none reverse",
        },
      }
    );

    /* Pin the section */
    const st = ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: "top top",
      end: `+=${scrollDist}%`,
      pin: pinRef.current,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    });

    return () => st.kill();
  }, [scrollDist]);

  return (
    <div
      ref={wrapperRef}
      id={id}
      className="relative"
      style={{ height: scrollDist === 0 ? "auto" : `${100 + scrollDist}vh` }}
    >
      <div
        ref={pinRef}
        className="relative w-full h-screen overflow-hidden"
      >
        {children}
      </div>
    </div>
  );
}

/* Section label overlay */
function SectionLabel({ label, index }: { label: string; index: number }) {
  return (
    <div className="absolute top-6 left-6 z-30 pointer-events-none">
      <p className="text-[10px] tracking-[0.3em] text-cyan/30 font-[family-name:var(--font-geist-mono)]">
        {String(index + 1).padStart(2, "0")} / {String(SECTIONS.length).padStart(2, "0")}
      </p>
      <p className="text-[10px] tracking-[0.2em] text-foreground/15 font-[family-name:var(--font-geist-mono)] mt-0.5">
        {label}
      </p>
    </div>
  );
}

export default function HomeClient() {
  const [loaded, setLoaded] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const handlePreloaderComplete = useCallback(() => {
    setLoaded(true);
  }, []);

  /* Refresh ScrollTrigger when all lazy sections load */
  useEffect(() => {
    if (loaded) {
      /* Wait for lazy sections to render */
      const timer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  return (
    <>
      <Preloader onComplete={handlePreloaderComplete} />
      <ScrollProgressBar />

      <div ref={mainRef}>
        {/* 1. HERO — special: has its own internal pin + gate animation */}
        <PinnedSection id="gate" scrollDist={SECTIONS[0].scrollDist}>
          <SectionLabel label={SECTIONS[0].label} index={0} />
          <Suspense fallback={<SectionSkeleton />}>
            <Hero />
          </Suspense>
        </PinnedSection>

        {/* 2. ORIGIN */}
        <PinnedSection id="origin" scrollDist={SECTIONS[1].scrollDist}>
          <SectionLabel label={SECTIONS[1].label} index={1} />
          <Suspense fallback={<SectionSkeleton />}>
            <Origin />
          </Suspense>
        </PinnedSection>

        {/* 3. DOMAINS */}
        <PinnedSection id="domains" scrollDist={SECTIONS[2].scrollDist}>
          <SectionLabel label={SECTIONS[2].label} index={2} />
          <Suspense fallback={<SectionSkeleton />}>
            <Domains />
          </Suspense>
        </PinnedSection>

        {/* 4. GALLERY — no pin, has own horizontal scroll */}
        <div id="gallery">
          <SectionLabel label={SECTIONS[3].label} index={3} />
          <Suspense fallback={<SectionSkeleton />}>
            <HorizontalGallery />
          </Suspense>
        </div>

        {/* 5. ARCHIVE */}
        <PinnedSection id="archive" scrollDist={SECTIONS[4].scrollDist}>
          <SectionLabel label={SECTIONS[4].label} index={4} />
          <Suspense fallback={<SectionSkeleton />}>
            <Archive />
          </Suspense>
        </PinnedSection>

        {/* 6. PEOPLE */}
        <PinnedSection id="people" scrollDist={SECTIONS[5].scrollDist}>
          <SectionLabel label={SECTIONS[5].label} index={5} />
          <Suspense fallback={<SectionSkeleton />}>
            <People />
          </Suspense>
        </PinnedSection>

        {/* 7. PORTAL */}
        <PinnedSection id="portal" scrollDist={SECTIONS[6].scrollDist}>
          <SectionLabel label={SECTIONS[6].label} index={6} />
          <Suspense fallback={<SectionSkeleton />}>
            <Portal />
          </Suspense>
        </PinnedSection>
      </div>
    </>
  );
}

/* Loading skeleton while sections lazy-load */
function SectionSkeleton() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#090714]">
      <div className="text-center">
        <div className="w-8 h-8 border border-cyan/20 border-t-cyan/60 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[9px] tracking-[0.3em] text-foreground/20 font-[family-name:var(--font-geist-mono)]">
          LOADING...
        </p>
      </div>
    </div>
  );
}
