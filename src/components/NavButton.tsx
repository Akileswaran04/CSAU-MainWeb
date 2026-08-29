"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ============================================================
   NAV BUTTON — Premium floating pill (top-left) + Circular N
   (bottom-left). 

   Pill: subtle hover expand, click opens fullscreen overlay.
   N-circle: small circular control, hover expands slightly.

   Hidden on home page (/).
   ============================================================ */

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Team", href: "/team" },
  { label: "About", href: "/?view=description" },
];

export default function NavButton() {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [pillHovered, setPillHovered] = useState(false);
  const [nHovered, setNHovered] = useState(false);
  const pathname = usePathname();
  const [heroVisible, setHeroVisible] = useState(false);

  // Listen for hero content phase from HomeClient
  useEffect(() => {
    const handler = () => setHeroVisible(true);
    window.addEventListener("csau:hero-visible", handler);
    return () => window.removeEventListener("csau:hero-visible", handler);
  }, []);

  // Close overlay on Escape
  useEffect(() => {
    if (!overlayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOverlayOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [overlayOpen]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (overlayOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [overlayOpen]);

  // Hide on home page unless hero content is active
  if (pathname === "/" && !heroVisible) return null;

  return (
    <>
      <style>{`
        .nav-pill {
          position: fixed;
          top: 28px;
          left: 28px;
          z-index: 200;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: var(--on-surface, #1a1b22);
          background: var(--surface-container-lowest, #fff);
          border: 1px solid var(--outline-variant, #c7c6cb);
          padding: 10px 20px;
          border-radius: 999px;
          box-shadow:
            0 1px 3px rgba(0,0,0,0.03),
            0 4px 12px rgba(0,0,0,0.05);
          transition: all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
          user-select: none;
          text-decoration: none;
        }
        .nav-pill:hover {
          padding-right: 28px;
          box-shadow:
            0 2px 8px rgba(0,0,0,0.06),
            0 8px 24px rgba(0,0,0,0.08);
        }

        .nav-n {
          position: fixed;
          bottom: 28px;
          left: 28px;
          z-index: 200;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--on-surface, #1a1b22);
          background: var(--surface-container-lowest, #fff);
          border: 1px solid var(--outline-variant, #c7c6cb);
          border-radius: 50%;
          box-shadow:
            0 1px 3px rgba(0,0,0,0.03),
            0 4px 12px rgba(0,0,0,0.05);
          transition: all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
          text-decoration: none;
        }
        .nav-n:hover {
          width: 44px;
          height: 44px;
          box-shadow:
            0 2px 8px rgba(0,0,0,0.06),
            0 8px 24px rgba(0,0,0,0.08);
        }

        /* Fullscreen overlay */
        .nav-overlay {
          position: fixed;
          inset: 0;
          z-index: 190;
          background: var(--background, #fbf8ff);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 32px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .nav-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }
        .nav-overlay-link {
          font-family: 'Kenfolg', 'Syne', sans-serif;
          font-size: clamp(32px, 6vw, 56px);
          font-weight: 400;
          color: var(--on-surface, #1a1b22);
          text-decoration: none;
          letter-spacing: -0.01em;
          transition: opacity 0.25s ease;
          opacity: 0;
          transform: translateY(20px);
        }
        .nav-overlay.open .nav-overlay-link {
          opacity: 1;
          transform: translateY(0);
        }
        .nav-overlay.open .nav-overlay-link:nth-child(1) {
          transition-delay: 0.1s;
        }
        .nav-overlay.open .nav-overlay-link:nth-child(2) {
          transition-delay: 0.18s;
        }
        .nav-overlay.open .nav-overlay-link:nth-child(3) {
          transition-delay: 0.26s;
        }
        .nav-overlay-link:hover {
          opacity: 0.5;
        }

        .nav-close {
          position: absolute;
          top: 28px;
          right: 28px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: none;
          border: 1px solid var(--outline-variant, #c7c6cb);
          border-radius: 50%;
          color: var(--on-surface, #1a1b22);
          font-size: 18px;
          transition: all 0.25s ease;
        }
        .nav-close:hover {
          background: var(--surface-container, #eeedf7);
        }
      `}</style>

      {/* Floating pill — top left */}
      <div
        className="nav-pill"
        role="button"
        tabIndex={0}
        aria-label="Open navigation"
        onMouseEnter={() => setPillHovered(true)}
        onMouseLeave={() => setPillHovered(false)}
        onClick={() => setOverlayOpen(true)}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <line x1="0" y1="2" x2="14" y2="2" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="7" x2={pillHovered ? "14" : "10"} y2="7" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="12" x2={pillHovered ? "14" : "7"} y2="12" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span style={{ opacity: pillHovered ? 1 : 0, width: pillHovered ? "auto" : 0, transition: "all 0.3s ease", overflow: "hidden", whiteSpace: "nowrap" }}>
          NAV
        </span>
      </div>

      {/* Circular N — bottom left */}
      <a
        href="/"
        className="nav-n"
        aria-label="Go home"
        onMouseEnter={() => setNHovered(true)}
        onMouseLeave={() => setNHovered(false)}
      >
        N
      </a>

      {/* Fullscreen overlay */}
      <div className={`nav-overlay${overlayOpen ? " open" : ""}`}>
        <button
          className="nav-close"
          onClick={() => setOverlayOpen(false)}
          aria-label="Close navigation"
        >
          ✕
        </button>

        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="nav-overlay-link"
            onClick={() => setOverlayOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </>
  );
}
