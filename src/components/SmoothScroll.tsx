"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/* ============================================================================
   SMOOTH SCROLL — Lenis-driven inertia scrolling for the whole realm.
   • Disabled entirely under prefers-reduced-motion (native scrolling stays).
   • Intercepts same-page anchor clicks and initial #hashes so navigation
     glides instead of jumping. Other routes keep native behaviour.
   • ScrollFlight / RealmProgress read window.scrollY, which Lenis keeps
     in sync — no changes needed there.
   ========================================================================== */

export default function SmoothScroll() {
  useEffect(() => {
    /* reduced motion → never hijack scrolling */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.1, // inertia amount
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const scrollToEl = (el: HTMLElement) => {
      lenis.scrollTo(el, { offset: -72, duration: 1.4 });
    };

    /* glide to same-page anchors instead of jumping */
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const a = (e.target as HTMLElement | null)?.closest(
        'a[href*="#"]'
      ) as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const el = document.getElementById(url.hash.slice(1));
      if (!el) return;
      e.preventDefault();
      history.pushState(null, "", url.hash);
      scrollToEl(el);
    };
    document.addEventListener("click", onClick);

    /* handle a hash present on first load (e.g. arriving at /#domains) */
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) requestAnimationFrame(() => requestAnimationFrame(() => scrollToEl(el)));
    }

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
    };
  }, []);

  return null;
}
