"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { lockScroll } from "@/lib/scrollLock";
import LoadingOverlay from "./LoadingOverlay";

/* ============================================================
   ROUTE LOAD GATE - full-screen loader for page travel.

   Shows the LoadingOverlay only when navigating through the
   nav bar (.ln-link) or marked in-page CTAs ([data-route-load]).
   First visit / direct loads / back-forward are untouched.

   Timing: the loader plays for a fixed ~5s on every nav-bar / CTA
   trip (exit choreography included), so it reads like a deliberate
   loading sequence rather than a network wait. It never reveals
   before the destination route has painted.
     1. Trigger fires on the click (before navigation commits).
     2. The loader holds while the next route streams in.
     3. ~3.6s in, the loader runs its exit choreography while the
        page's top-level elements rise in with a staggered fade-up
        beneath the fade - overlay fully gone at ~5s.
   ============================================================ */

const TRIGGER_SELECTOR = "a[data-route-load], a.ln-link";
const TOTAL_LOAD_MS = 5000; // target total time the loader is visible
const EXIT_TOTAL_MS = 1400; // LoadingOverlay exit duration (x1→x3)
const HOLD_UNTIL_MS = TOTAL_LOAD_MS - EXIT_TOTAL_MS; // start exiting at 3.6s
const MAX_WAIT_MS = 8000; // safety net so the loader can never hang
/* Stagger 30–50ms per item: fast enough to read as one motion, slow
   enough to sequence. Above ~60ms it turns into a slideshow. */
const STAGGER_BASE_MS = 140;
const STAGGER_STEP_MS = 45;
const STAGGER_MAX_ITEMS = 12;

const normalize = (p: string) => (p.endsWith("/") && p.length > 1 ? p.slice(0, -1) : p);

export default function RouteLoadGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hostRef = useRef<HTMLDivElement>(null);
  const [request, setRequest] = useState<{ href: string; from: string; startedAt: number } | null>(null);
  const [exiting, setExiting] = useState(false);
  const revealHandledRef = useRef(false);

  const revealDestination = () => {
    if (revealHandledRef.current) return;
    revealHandledRef.current = true;

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    // Staggered fade-up of the freshly painted page elements.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const host = hostRef.current;
    if (host && !reduced) {
      gatherCandidates(host).forEach((el, i) => {
        el.animate(
          [
            { opacity: 0, transform: "translateY(8px)" },
            { opacity: 1, transform: "translateY(0px)" },
          ],
          {
            duration: 320,
            delay: STAGGER_BASE_MS + i * STAGGER_STEP_MS,
            easing: "cubic-bezier(.16,1,.3,1)",
            fill: "backwards",
          }
        );
      });
    }

    // Start the loader's exit choreography.
    setExiting(true);
    window.setTimeout(() => {
      setRequest(null);
      setExiting(false);
    }, EXIT_TOTAL_MS);
  };

  /* ---- Trigger: capture clicks on nav links & marked CTAs ---- */
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>(TRIGGER_SELECTOR);
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const target = normalize(url.pathname);
      const current = normalize(window.location.pathname);
      if (target === current) return; // same page (incl. in-page anchors)

      revealHandledRef.current = false;
      setRequest({ href: target, from: current, startedAt: Date.now() });
    };
    document.addEventListener("click", onDocClick, true);
    return () => document.removeEventListener("click", onDocClick, true);
  }, []);

  /* ---- Lock body scroll while the loader is up ---- */
  useEffect(() => {
    if (!request) return;
    return lockScroll();
  }, [request]);

  /* ---- Reveal once the destination has painted AND ~3.6s have passed ---- */
  useEffect(() => {
    if (!request || revealHandledRef.current) return;
    // Not arrived yet: keep waiting (covers streaming RSC pages).
    if (pathname === request.from && request.href !== normalize(pathname)) return;

    const hold = Math.max(0, HOLD_UNTIL_MS - (Date.now() - request.startedAt));
    const t = setTimeout(() => revealDestination(), hold);
    return () => clearTimeout(t);
  }, [request, pathname]);

  /* ---- Safety net: never let the loader hang ---- */
  useEffect(() => {
    if (!request || revealHandledRef.current) return;
    const t = setTimeout(() => revealDestination(), MAX_WAIT_MS);
    return () => clearTimeout(t);
  }, [request]);

  return (
    <>
      {request && (
        <LoadingOverlay phase={exiting ? "ending" : "loading"} href={request.href} />
      )}
      <div ref={hostRef} id="content">
        {children}
      </div>
    </>
  );
}

/* ---- Collect the top-level blocks worth staggering ---- */
function gatherCandidates(root: HTMLElement): HTMLElement[] {
  let level = Array.from(root.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el.tagName !== "STYLE" && el.tagName !== "SCRIPT"
  );

  // If the page nests everything under one structural wrapper, descend
  // into it so we stagger the real blocks (hero/about, header/grid/CTA…).
  let depth = 0;
  while (level.length === 1 && depth < 2) {
    const only = level[0];
    if (!["DIV", "MAIN", "SECTION"].includes(only.tagName)) break;
    const kids = Array.from(only.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.tagName !== "STYLE" && el.tagName !== "SCRIPT"
    );
    if (kids.length === 0) break;
    level = kids;
    depth++;
  }

  return level
    .filter((el) => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0)
    .slice(0, STAGGER_MAX_ITEMS);
}
