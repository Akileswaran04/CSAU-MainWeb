"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { lockScroll } from "@/lib/scrollLock";
import LoadingOverlay from "./LoadingOverlay";

/* ============================================================
   ROUTE LOAD GATE - full-screen loader for page travel.

   Shows the LoadingOverlay for every link to another page of the
   site: the nav bar, the CTAs, the brand mark, the 404's way home.
   It is also in the first HTML of every page, so a direct load or
   a refresh never shows the page before its loader. The home page's
   first visit is the exception both ways: its boot preloader is the
   loader there (hidden before paint in globals.css, and a link home
   skips this one). Back-forward is untouched.

   It follows real loading, not a clock, and opens only once the
   destination has its elements:
     1. Trigger fires on the click (before navigation commits).
     2. The loader holds while the next route streams in.
     3. When the route has arrived it waits for the page itself:
        no streaming skeleton or busy part left ([aria-busy]),
        fonts in, every image on the first screen loaded and
        decoded, then two frames so canvases have painted. The
        charge bar fills as each of these lands.
     4. It runs its exit choreography while the page's top-level
        elements rise in with a staggered fade-up beneath the fade.
   It shows for at least MIN_MS so the trip reads, and never longer
   than MAX_WAIT_MS whatever is still pending.
   ============================================================ */

const MIN_MS = 1400; // the scene never shows for less than this, so the trip reads
const EXIT_TOTAL_MS = 1400; // LoadingOverlay exit duration (x1→x3)
const MAX_WAIT_MS = 8000; // safety net so the loader can never hang
const ARRIVED = 0.25; // the share of the charge bar the route itself is worth; the page's elements fill the rest
/* Stagger 30–50ms per item: fast enough to read as one motion, slow
   enough to sequence. Above ~60ms it turns into a slideshow. */
const STAGGER_BASE_MS = 140;
const STAGGER_STEP_MS = 45;
const STAGGER_MAX_ITEMS = 12;

const normalize = (p: string) => (p.endsWith("/") && p.length > 1 ? p.slice(0, -1) : p);

/* HomeClient's flag: the home page's boot preloader has played this session */
const homeBoots = () => {
  try {
    return sessionStorage.getItem("csau-gate-seen") !== "true";
  } catch {
    return false;
  }
};

export default function RouteLoadGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hostRef = useRef<HTMLDivElement>(null);
  /* from "" is the first load: the loader is up from the first paint */
  const [request, setRequest] = useState<{ href: string; from: string; startedAt: number } | null>(() => ({
    href: normalize(pathname),
    from: "",
    startedAt: Date.now(),
  }));
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const revealHandledRef = useRef(false);

  const revealDestination = () => {
    if (revealHandledRef.current) return;
    revealHandledRef.current = true;

    if (request?.from) window.scrollTo({ top: 0, left: 0, behavior: "auto" }); // a first load keeps its place (refresh, #anchor)

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

    // Start the loader's exit choreography; a page with its own intro (events) starts it now.
    setExiting(true);
    window.dispatchEvent(new Event("route-reveal"));
    window.setTimeout(() => {
      setRequest(null);
      setExiting(false);
    }, EXIT_TOTAL_MS);
  };

  /* ---- Trigger: capture clicks on any link to another page of the site ---- */
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const target = normalize(url.pathname);
      const current = normalize(window.location.pathname);
      if (target === current) return; // same page (incl. in-page anchors)
      if (target === "/" && homeBoots()) return; // the home's boot preloader is the loader there

      revealHandledRef.current = false;
      setProgress(0);
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

  /* ---- Reveal once the destination has arrived AND has its elements (and MIN_MS has passed) ---- */
  useEffect(() => {
    if (!request || revealHandledRef.current || !hostRef.current) return;
    // Not arrived yet: keep waiting (covers streaming RSC pages).
    if (pathname === request.from && request.href !== normalize(pathname)) return;
    // The home page's first visit: its boot preloader is up instead (this one was hidden before paint).
    if (!request.from && request.href === "/" && document.documentElement.dataset.gate !== "seen") {
      revealHandledRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- only the browser knows the gate flag; one render on load
      setRequest(null);
      return;
    }

    let live = true;
    let t = 0;
    if (request.from) window.scrollTo({ top: 0, left: 0, behavior: "auto" }); // the first screen is the one it waits for
    void pageReady(hostRef.current, () => live, (p) => live && setProgress(p)).then(() => {
      if (!live) return;
      t = window.setTimeout(revealDestination, Math.max(0, MIN_MS - (Date.now() - request.startedAt)));
    });
    return () => {
      live = false;
      clearTimeout(t);
    };
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
        <div className={request.from ? undefined : request.href === "/" ? "rl-first rl-boot" : "rl-first"}>
          <LoadingOverlay phase={exiting ? "ending" : "loading"} href={request.href} progress={progress} />
        </div>
      )}
      <div ref={hostRef} id="content">
        {children}
      </div>
    </>
  );
}

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/* an image is in once it has loaded (or failed) and been decoded, so it paints whole on the first frame */
const imageIn = (img: HTMLImageElement) =>
  (img.complete
    ? Promise.resolve()
    : new Promise<void>((r) => {
        img.addEventListener("load", () => r(), { once: true });
        img.addEventListener("error", () => r(), { once: true });
      })
  )
    .then(() => img.decode())
    .catch(() => {});

/* ---- Wait until the arrived page has its elements, reporting progress (0..1) as each lands ---- */
async function pageReady(host: HTMLElement, live: () => boolean, report: (p: number) => void) {
  report(ARRIVED);
  await frame(); // effects that swap a page's first render (the home gate, client-only parts) commit first
  /* a loading.tsx skeleton, or a part still building itself (the team carousel), marks itself aria-busy */
  while (host.querySelector('[aria-busy="true"]')) {
    if (!live()) return;
    await frame();
  }
  await document.fonts?.ready;
  const vh = window.innerHeight;
  const imgs = [...host.querySelectorAll("img")].filter((img) => {
    const r = img.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < vh;
  });
  let done = 0;
  const step = () => report(ARRIVED + ((1 - ARRIVED) * ++done) / (imgs.length + 1));
  await Promise.all(imgs.map((img) => imageIn(img).then(step)));
  await frame();
  await frame(); // canvases and the decoded images are on screen
  step();
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
