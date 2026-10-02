"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import DestGlyph from "./DestGlyph";
import { NAV_DESTINATIONS } from "@/lib/destinations";
import { lockScroll } from "@/lib/scrollLock";
import { setNavState } from "@/lib/navState";
import { usePathname } from "next/navigation";

/* ============================================================
   LASER NAV - fullscreen navigation over the void.

   One quiet screen: the destinations as a ruled list on the
   left, and a single scope on the right that shows the glyph of
   whichever destination is hovered or focused (the current page
   when nothing is). No drifting craft, no stray pings - the
   scope's two slow rings are the only ambient motion.

     • links are >=56px rows: name left, sector call right
     • the current page carries a signal bar and "You are here"
     • Esc or the close button dismisses it; focus moves in on
       open and back to the NAV button on close; the overlay is
       inert while closed
   ============================================================ */

const NAV_LINKS = NAV_DESTINATIONS;

export default function LaserNav() {
  const [open, setOpen] = useState(false);
  /* the destination being pointed at (hover or keyboard focus) */
  const [pointed, setPointed] = useState<number | null>(null);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll while the overlay is open
  useEffect(() => {
    if (!open) return;
    return lockScroll();
  }, [open]);

  /* Tell the rest of the page when the menu covers it, so it can stop drawing what nobody can see
     (see lib/navState.ts): open at once, covered once the overlay has faded in, both cleared on close. */
  useEffect(() => {
    if (!open) return;
    setNavState({ open: true, covered: false });
    const t = window.setTimeout(() => setNavState({ covered: true }), 320);
    return () => {
      clearTimeout(t);
      setNavState({ covered: false }); // the page is shown again as soon as the menu starts to leave
    };
  }, [open]);
  useEffect(() => {
    if (open) return;
    const t = window.setTimeout(() => setNavState({ open: false }), 300); // after the fade-out
    return () => clearTimeout(t);
  }, [open]);

  // Focus moves into the overlay on open, and back to the button on close
  useEffect(() => {
    if (open) closeRef.current?.focus();
    else if (wasOpen.current) toggleRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setPointed(null);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const activeIndex = NAV_LINKS.findIndex((l) => isActive(l.href));
  const shown = NAV_LINKS[pointed ?? (activeIndex >= 0 ? activeIndex : 0)];

  return (
    <>
      <style>{`
        /* ── Floating button - squared, hairline, inverts on hover ── */
        .ln-toggle {
          position: fixed;
          top: max(20px, env(safe-area-inset-top));
          left: max(20px, env(safe-area-inset-left));
          z-index: 400;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 44px;
          padding: 9px 14px;
          touch-action: manipulation;
          border-radius: 2px;
          border: 1px solid var(--on-surface, #101a1a);
          background: var(--surface-container-lowest, #fffdf8);
          color: var(--on-surface, #101a1a);
          cursor: pointer;
          transition: background-color 90ms ease, color 90ms ease;
          user-select: none;
          font-family: var(--font-mono);
        }
        .ln-brand {
          display: none;
          position: fixed;
          z-index: 399;
          top: max(20px, env(safe-area-inset-top));
          left: max(20px, env(safe-area-inset-left));
          min-height: 44px;
          align-items: center;
          font-family: var(--font-display);
          font-size: 18px;
          letter-spacing: .1em;
          color: var(--starlight);
          text-decoration: none;
        }
        .ln-brand:focus-visible { outline: 2px solid var(--signal); outline-offset: 4px; }
        @media (max-width: 820px) {
          .ln-brand { display: inline-flex; }
          .ln-toggle { left: auto; right: max(16px, env(safe-area-inset-right)); }
        }
        .ln-toggle:hover {
          background: var(--on-surface, #101a1a);
          color: var(--background, #f1ebde);
        }
        .ln-toggle .ln-lines {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ln-toggle .ln-lines span {
          display: block;
          width: 16px;
          height: 1px;
          background: currentColor;
          transition: width 120ms ease;
        }
        .ln-toggle:hover .ln-lines span:nth-child(1) { width: 20px; }
        .ln-toggle:hover .ln-lines span:nth-child(3) { width: 12px; }
        .ln-toggle .ln-word {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .2em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* ── Fullscreen overlay (void) ── */
        .ln-overlay {
          position: fixed;
          inset: 0;
          z-index: 500;
          background: var(--hull-900);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity .28s ease, visibility 0s linear .28s;
          overflow-y: auto;
        }
        .ln-overlay.open { opacity: 1; visibility: visible; pointer-events: auto; transition: opacity .28s ease, visibility 0s; }

        /* one frame: header, list + scope, footer */
        .ln-frame {
          min-height: 100%;
          display: grid;
          grid-template-rows: auto 1fr auto;
          padding: max(20px, env(safe-area-inset-top)) clamp(20px, 6vw, 88px) max(20px, env(safe-area-inset-bottom));
        }
        .ln-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 44px;
        }
        .ln-mark {
          font-family: var(--font-display);
          font-size: 18px;
          letter-spacing: .1em;
          color: var(--starlight);
        }
        .ln-close {
          width: 44px;
          height: 44px;
          touch-action: manipulation;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          border: 1px solid var(--dim-300);
          background: var(--void-950);
          color: var(--starlight);
          font-family: var(--font-mono);
          font-size: 14px;
          line-height: 1;
          cursor: pointer;
          transition: background-color 90ms ease, color 90ms ease, border-color 90ms ease;
        }
        .ln-close:hover {
          background: var(--signal-700);
          border-color: var(--signal-700);
          color: var(--starlight);
        }

        .ln-body {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          align-items: center;
          gap: clamp(32px, 7vw, 120px);
          padding: clamp(20px, 5vh, 56px) 0;
        }
        .ln-list { display: flex; flex-direction: column; width: 100%; max-width: 620px; padding: 0; }
        .ln-eyebrow { margin-bottom: 14px; }

        /* a destination: name on the left, sector call on the right */
        .ln-link {
          position: relative;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          flex-wrap: wrap; /* a long sector call drops under the name rather than overflowing */
          gap: 4px 20px;
          min-height: 56px;
          padding: 14px 0 12px 18px;
          border-top: 1px solid var(--hull-700);
          text-decoration: none;
          color: var(--dim-300);
          transition: color .16s ease;
        }
        .ln-link:last-child { border-bottom: 1px solid var(--hull-700); }
        .ln-label {
          font-family: var(--font-display);
          font-weight: 400;
          font-size: clamp(20px, min(3.2vw, 4.6vh), 36px);
          letter-spacing: .05em;
          line-height: 1.1;
          transition: transform .22s cubic-bezier(.2,.8,.2,1);
        }
        .ln-cap {
          flex: none;
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: var(--outline);
          transition: color .16s ease;
        }
        /* the marker bar: signal on the current page, amber on the pointed one */
        .ln-link::before {
          content: "";
          position: absolute;
          left: 0;
          top: 14px;
          bottom: 12px;
          width: 2px;
          background: var(--lit);
          transform: scaleY(0);
          transform-origin: top;
          transition: transform .18s ease;
        }
        .ln-link:hover, .ln-link:focus-visible, .ln-link.is-active { color: var(--starlight); }
        .ln-link:hover .ln-label, .ln-link:focus-visible .ln-label { transform: translateX(6px); }
        .ln-link:hover .ln-cap, .ln-link:focus-visible .ln-cap { color: var(--lit); }
        .ln-link:hover::before, .ln-link:focus-visible::before, .ln-link.is-active::before { transform: scaleY(1); }
        .ln-link.is-active::before { background: var(--signal); }
        .ln-link.is-active .ln-cap { color: var(--signal); }
        .ln-link:focus-visible { outline: 2px solid var(--lit); outline-offset: 2px; }

        /* the scope: one glyph, two slow rings */
        .ln-preview { display: none; }
        .ln-scope {
          position: relative;
          width: min(30vw, 340px);
          aspect-ratio: 1 / 1;
          display: grid;
          place-items: center;
          border: 1px solid var(--hull-700);
          border-radius: 50%;
        }
        .ln-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid var(--dim-300);
          opacity: 0;
        }
        .ln-overlay.open .ln-ring { animation: lnPing 8s cubic-bezier(.2,.6,.3,1) infinite; }
        .ln-overlay.open .ln-ring + .ln-ring { animation-delay: 4s; }
        @keyframes lnPing {
          0% { transform: scale(.35); opacity: 0; }
          14% { opacity: .35; }
          100% { transform: scale(1); opacity: 0; }
        }
        .ln-glyph { animation: lnGlyphIn .32s cubic-bezier(.2,.8,.2,1); }
        @keyframes lnGlyphIn {
          from { opacity: 0; transform: scale(.9); }
          to { opacity: 1; transform: none; }
        }
        .ln-preview-cap {
          margin-top: 22px;
          text-align: center;
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: var(--dim-300);
        }

        .ln-foot {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 8px 24px;
          padding-top: 14px;
          border-top: 1px solid var(--hull-700);
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: var(--outline);
        }

        @media (min-width: 900px) {
          .ln-body { grid-template-columns: minmax(0, 1fr) auto; }
          .ln-preview { display: block; padding-right: clamp(0px, 4vw, 64px); }
        }
        @media (max-width: 820px) {
          .ln-mark { visibility: hidden; } /* the phone header's wordmark already sits here */
          .ln-label { font-size: clamp(22px, 6.4vw, 30px); }
          .ln-link { padding-left: 14px; }
        }
        @media (hover: none) { .ln-foot-hint { display: none; } }
        @media (prefers-reduced-motion: reduce) {
          .ln-overlay, .ln-overlay.open { transition: none; }
          .ln-label, .ln-link::before { transition: none; }
          .ln-link:hover .ln-label, .ln-link:focus-visible .ln-label { transform: none; }
          .ln-overlay.open .ln-ring { animation: none; opacity: .2; }
          .ln-overlay.open .ln-ring + .ln-ring { inset: 16%; }
          .ln-glyph { animation: none; }
        }
      `}</style>

      {/* Phone header: the wordmark links home; the menu button sits on the thumb side */}
      <Link href="/" className="ln-brand" aria-label="CSAU home">
        CSAU
      </Link>

      {/* Floating button */}
      <button
        ref={toggleRef}
        type="button"
        className="ln-toggle"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="ln-lines" aria-hidden>
          <span />
          <span />
          <span />
        </span>
        <span className="ln-word">NAV</span>
      </button>

      {/* Fullscreen void navigation */}
      <div
        className={`ln-overlay${open ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        inert={!open}
      >
        <div className="ln-frame">
          <div className="ln-head">
            <span className="ln-mark" aria-hidden>
              CSAU
            </span>
            <button
              ref={closeRef}
              type="button"
              className="ln-close"
              aria-label="Close navigation"
              onClick={handleClose}
            >
              ✕
            </button>
          </div>

          <div className="ln-body">
            <nav aria-label="Primary" className="ln-list">
              <div className="eyebrow ln-eyebrow">Navigate</div>
              {NAV_LINKS.map((link, i) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`ln-link${active ? " is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    onClick={handleClose}
                    onMouseEnter={() => setPointed(i)}
                    onMouseLeave={() => setPointed(null)}
                    onFocus={() => setPointed(i)}
                    onBlur={() => setPointed(null)}
                    style={{
                      opacity: open ? 1 : 0,
                      transform: open ? "none" : "translateY(10px)",
                      transition: `opacity .3s ease ${0.03 * i + 0.06}s, transform .3s ease ${0.03 * i + 0.06}s, color .16s ease`,
                    }}
                  >
                    <span className="ln-label">{link.label}</span>
                    <span className="ln-cap">{active ? "You are here" : link.sector}</span>
                  </Link>
                );
              })}
            </nav>

            {/* the scope: the glyph of the destination being pointed at */}
            <div className="ln-preview" aria-hidden>
              <div className="ln-scope">
                <span className="ln-ring" />
                <span className="ln-ring" />
                <span key={shown.href} className="ln-glyph">
                  <DestGlyph kind={shown.glyph} size={132} />
                </span>
              </div>
              <div className="ln-preview-cap">{shown.sector}</div>
            </div>
          </div>

          <div className="ln-foot">
            <span>Computer Society of Anna University</span>
            <span className="ln-foot-hint">Esc to close</span>
          </div>
        </div>
      </div>
    </>
  );
}
