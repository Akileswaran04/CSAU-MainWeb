"use client";

import { useRef, useCallback } from "react";

/* ============================================================
   TEAM CARD — Premium Editorial / Luxury Studio

   Embossed rectangular card with ornate pattern flaps.
   Cursor-following radial light reveals embossing on hover.
   Subtle 3D perspective tilt + 8-12px lift on hover.
   Index number positioned at top-left of card.
   ============================================================ */

const CARD_IMG = "/card-pattern.jpg";

interface TeamCardProps {
  name: string;
  role: string;
  photo?: string;
  index: number;
}

export default function TeamCard({ name, role, photo, index }: TeamCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    const light = lightRef.current;
    if (!card || !light) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // 3D tilt: max ~4deg
    const rotateY = ((x - cx) / cx) * 4;
    const rotateX = ((cy - y) / cy) * 3;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;

    // Radial light position
    light.style.background = `radial-gradient(circle 180px at ${x}px ${y}px, rgba(255,255,255,0.12) 0%, transparent 70%)`;
    light.style.opacity = "1";
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    const light = lightRef.current;
    if (card) card.style.transform = "";
    if (light) light.style.opacity = "0";
  }, []);

  const idx = String(index).padStart(2, "0");

  return (
    <>
      <style>{`
        .te-card {
          position: relative;
          width: 100%;
          height: 420px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transform-style: preserve-3d;
          transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1),
                      box-shadow 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
          will-change: transform;
        }
        .te-card:hover {
          box-shadow:
            0 20px 50px rgba(0, 0, 0, 0.15),
            0 8px 20px rgba(0, 0, 0, 0.08);
        }

        .te-stage {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 6px;
          overflow: hidden;
          background: #0a0908;
        }

        /* Radial light overlay */
        .te-light {
          position: absolute;
          inset: 0;
          z-index: 10;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.4s ease;
          mix-blend-mode: soft-light;
        }

        /* Index number */
        .te-index {
          position: absolute;
          top: -28px;
          left: 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: var(--outline, #77767b);
          z-index: 1;
        }

        /* Photo — revealed behind flaps */
        .te-photo {
          position: absolute;
          inset: 0;
          z-index: 1;
          opacity: 0;
          transition: opacity 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) 0.12s,
                      filter 0.6s ease 0.12s;
          filter: grayscale(0.15) contrast(1.08) brightness(0.95);
        }
        .te-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .te-card:hover .te-photo,
        .te-card.open .te-photo {
          opacity: 1;
        }

        /* Flaps — ornate embossed pattern */
        .te-flap {
          position: absolute;
          top: 0;
          width: 50%;
          height: 100%;
          background-repeat: no-repeat;
          background-size: 200% 100%;
          z-index: 3;
          backface-visibility: hidden;
          transition: transform 0.65s cubic-bezier(0.3, 0.7, 0.2, 1);
          transform-style: preserve-3d;
        }
        .te-flap-l {
          left: 0;
          border-radius: 6px 0 0 6px;
          background-position: left top;
          transform-origin: left center;
          box-shadow: inset -2px 0 6px rgba(0, 0, 0, 0.3);
        }
        .te-flap-r {
          right: 0;
          border-radius: 0 6px 6px 0;
          background-position: right top;
          transform-origin: right center;
          box-shadow: inset 2px 0 6px rgba(0, 0, 0, 0.1);
        }
        .te-card:hover .te-flap-l,
        .te-card.open .te-flap-l {
          transform: rotateY(-145deg);
        }
        .te-card:hover .te-flap-r,
        .te-card.open .te-flap-r {
          transform: rotateY(145deg);
        }

        /* Card border — subtle emboss feel */
        .te-stage::after {
          content: '';
          position: absolute;
          inset: 0;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          z-index: 5;
          pointer-events: none;
        }

        /* Info */
        @media (prefers-reduced-motion: reduce) {
          .te-flap, .te-photo { transition: none; }
          .te-card { transition: none; }
        }
      `}</style>

      <div style={{ position: 'relative' }}>
        {/* Index number */}
        <div className="te-index">{idx}</div>

        <div
          ref={cardRef}
          className={`te-card`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => {
            const el = cardRef.current;
            if (el) el.classList.toggle("open");
          }}
        >
          <div className="te-stage">
            {/* Cursor radial light */}
            <div ref={lightRef} className="te-light" />

            {/* Photo */}
            <div className="te-photo">
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
              style={{ backgroundImage: `url(${CARD_IMG})` }}
            />
            {/* Right flap */}
            <div
              className="te-flap te-flap-r"
              style={{ backgroundImage: `url(${CARD_IMG})` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
