"use client";

import { useRef, useCallback } from "react";

/* ============================================================
   TEAM CARD — Premium Editorial / Luxury Studio

   Two modes:
   - Normal: hover opens flaps, mouse leave closes
   - Inverted: scrollProgress drives flap opening, hover inverts brightness

   The ornamental back physically rotates away via rotateY to
   reveal the member photograph underneath.
   ============================================================ */

const CARD_IMG = "/card-pattern.svg";

interface TeamCardProps {
  name: string;
  role: string;
  photo?: string;
  index: number;
  size?: "large" | "medium" | "small";
  scrollProgress?: number;
  inverted?: boolean;
}

const SIZES = {
  large: { height: 460, nameSize: 26, roleSize: 12, borderRadius: 8 },
  medium: { height: 300, nameSize: 20, roleSize: 11, borderRadius: 6 },
  small: { height: 320, nameSize: 18, roleSize: 10, borderRadius: 5 },
};

export default function TeamCard({
  name,
  role,
  photo,
  index,
  size = "medium",
  scrollProgress = 0,
  inverted = false,
}: TeamCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const s = SIZES[size];

  // Scroll-driven open amount (only used when inverted=true)
  const p = Math.max(0, Math.min(1, scrollProgress));
  const scrollFlapAngle = p * 145;
  const scrollPhotoOpacity = Math.max(0, (p - 0.3) / 0.7);

  // Hover handlers — for normal mode (open/close on hover)
  const handleMouseEnter = useCallback(() => {
    if (inverted) return; // inverted mode uses scroll, not hover for opening
    const el = cardRef.current;
    if (el) el.classList.add("open");
  }, [inverted]);

  const handleMouseLeave = useCallback(() => {
    // Close flaps in hover mode
    if (!inverted) {
      const el = cardRef.current;
      if (el) el.classList.remove("open");
    }
    // Reset tilt
    const card = cardRef.current;
    const light = lightRef.current;
    if (card) card.style.transform = "";
    if (light) light.style.opacity = "0";
  }, [inverted]);

  // 3D tilt — works in both modes when card is open
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      const light = lightRef.current;
      if (!card || !light) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      const rotateY = ((x - cx) / cx) * 4;
      const rotateX = ((cy - y) / cy) * 3;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale(1.02)`;

      light.style.background = `radial-gradient(circle 200px at ${x}px ${y}px, rgba(255,255,255,0.18) 0%, transparent 70%)`;
      light.style.opacity = "1";
    },
    []
  );

  const handleMouseMoveReset = useCallback(() => {
    const card = cardRef.current;
    const light = lightRef.current;
    if (card) card.style.transform = "";
    if (light) light.style.opacity = "0";
  }, []);

  const idx = String(index).padStart(2, "0");

  // Compute flap angle and photo opacity based on mode
  let flapAngle: number;
  let photoOpacity: number;
  let bgBrightness: number;

  if (inverted) {
    // Scroll-driven
    flapAngle = scrollFlapAngle;
    photoOpacity = scrollPhotoOpacity;
    bgBrightness = 0.5 + p * 0.3;
  } else {
    // Hover-driven — handled via CSS .open class, so we use 0 for closed
    // and let CSS transitions do the work
    flapAngle = 0; // CSS handles this
    photoOpacity = 0; // CSS handles this
    bgBrightness = 0.6;
  }

  return (
    <>
      <style>{`
        .te-card {
          position: relative;
          width: 100%;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transform-style: preserve-3d;
          transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1),
                      box-shadow 0.5s cubic-bezier(0.2, 0.8, 0.2, 1),
                      filter 0.4s ease;
          will-change: transform;
        }
        .te-card:hover {
          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.2),
            0 10px 24px rgba(0, 0, 0, 0.12),
            0 2px 6px rgba(0, 0, 0, 0.08);
        }

        .te-stage {
          position: relative;
          width: 100%;
          overflow: hidden;
          border-radius: inherit;
          background: #0a0908;
          box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.12),
            0 1px 4px rgba(0, 0, 0, 0.08);
          transition: box-shadow 0.5s ease;
        }
        .te-card:hover .te-stage {
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.22),
            0 4px 12px rgba(0, 0, 0, 0.14);
        }

        .te-light {
          position: absolute;
          inset: 0;
          z-index: 12;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.4s ease;
          mix-blend-mode: soft-light;
        }

        .te-index {
          position: absolute;
          top: -26px;
          left: 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: var(--outline, #77767b);
          z-index: 1;
        }

        .te-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background-repeat: no-repeat;
          background-size: cover;
          background-position: center;
          transition: opacity 0.5s ease, filter 0.5s ease;
        }

        /* Photo — CSS-driven for hover mode */
        .te-photo {
          position: absolute;
          inset: 0;
          z-index: 2;
          filter: grayscale(0.12) contrast(1.06) brightness(0.96);
        }
        .te-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        /* Hover mode: photo fades in via .open class */
        .te-mode-hover.te-card .te-photo {
          opacity: 0;
          transition: opacity 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.12s;
        }
        .te-mode-hover.te-card.open .te-photo {
          opacity: 1;
        }

        /* Flaps — CSS-driven for hover mode */
        .te-flap {
          position: absolute;
          top: 0;
          width: 50%;
          height: 100%;
          background-repeat: no-repeat;
          background-size: 200% 100%;
          z-index: 4;
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }
        .te-flap-l {
          left: 0;
          border-radius: inherit 0 0 inherit;
          background-position: left top;
          transform-origin: left center;
          box-shadow: inset -2px 0 8px rgba(0, 0, 0, 0.35);
        }
        .te-flap-r {
          right: 0;
          border-radius: 0 inherit inherit 0;
          background-position: right top;
          transform-origin: right center;
          box-shadow: inset 2px 0 8px rgba(0, 0, 0, 0.15);
        }
        /* Hover mode: flaps animate via CSS transition */
        .te-mode-hover.te-card .te-flap {
          transition: transform 0.65s cubic-bezier(0.3, 0.7, 0.2, 1);
        }
        .te-mode-hover.te-card.open .te-flap-l {
          transform: rotateY(-145deg);
        }
        .te-mode-hover.te-card.open .te-flap-r {
          transform: rotateY(145deg);
        }
        /* Inverted mode: flaps driven by inline style (scroll), no CSS transition */
        .te-mode-scroll.te-card .te-flap {
          transition: none;
        }

        /* Hover mode: bg brightens on open */
        .te-mode-hover.te-card .te-bg {
          opacity: 0.35;
          filter: grayscale(0.5) brightness(0.6);
          transition: opacity 0.5s ease, filter 0.5s ease;
        }
        .te-mode-hover.te-card.open .te-bg {
          opacity: 0.5;
          filter: grayscale(0.3) brightness(0.8);
        }

        .te-stage::after {
          content: '';
          position: absolute;
          inset: 0;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: inherit;
          z-index: 6;
          pointer-events: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .te-flap, .te-photo, .te-card { transition: none !important; }
        }
      `}</style>

      <div style={{ position: "relative" }}>
        <div className="te-index">{idx}</div>

        <div
          ref={cardRef}
          className={`te-card ${inverted ? "te-mode-scroll" : "te-mode-hover"}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
          <div
            className="te-stage"
            style={{ height: s.height, borderRadius: s.borderRadius }}
          >
            {/* Background pattern */}
            <div
              className="te-bg"
              style={
                inverted
                  ? {
                      backgroundImage: `url(${CARD_IMG})`,
                      opacity: 0.3 + (1 - p) * 0.3,
                      filter: `grayscale(0.5) brightness(${bgBrightness})`,
                    }
                  : { backgroundImage: `url(${CARD_IMG})` }
              }
            />

            {/* Cursor radial light — only in inverted mode when open */}
            <div ref={lightRef} className="te-light" />

            {/* Photo */}
            <div
              className="te-photo"
              style={inverted ? { opacity: photoOpacity } : undefined}
            >
              {photo ? (
                <img src={photo} alt={name} loading="lazy" />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(135deg, #2a2a2e, #1a1a1e)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: 48,
                    color: "#555",
                  }}
                >
                  {name.split(" ").map((w) => w[0]).join("")}
                </div>
              )}
            </div>

            {/* Left flap */}
            <div
              className="te-flap te-flap-l"
              style={
                inverted
                  ? { backgroundImage: `url(${CARD_IMG})`, transform: `rotateY(${-scrollFlapAngle}deg)` }
                  : { backgroundImage: `url(${CARD_IMG})` }
              }
            />
            {/* Right flap */}
            <div
              className="te-flap te-flap-r"
              style={
                inverted
                  ? { backgroundImage: `url(${CARD_IMG})`, transform: `rotateY(${scrollFlapAngle}deg)` }
                  : { backgroundImage: `url(${CARD_IMG})` }
              }
            />
          </div>
        </div>

        {/* Name + Role */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <p
            style={{
              fontFamily: "'CremeEspana', cursive",
              color: "var(--on-surface, #1a1b22)",
              fontSize: s.nameSize,
              fontWeight: 400,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {name}
          </p>
          <p
            style={{
              color: "var(--outline, #77767b)",
              fontSize: s.roleSize,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              margin: "5px 0 0",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {role}
          </p>
        </div>
      </div>
    </>
  );
}
