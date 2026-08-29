"use client";

import { useRef, useCallback, useEffect } from "react";

/* ============================================================
   TEAM CARD — Premium Editorial / Luxury Studio

   Embossed rectangular card with ornate pattern background.
   3D perspective tilt + lift on hover.
   autoOpen prop: opens flaps when card enters viewport.
   Size variants: large (president), medium (heads), small (deputies).
   ============================================================ */

const CARD_IMG = "/card-pattern.jpg";

interface TeamCardProps {
  name: string;
  role: string;
  photo?: string;
  index: number;
  size?: "large" | "medium" | "small";
  autoOpen?: boolean;
}

const SIZES = {
  large: { height: 460, nameSize: 26, roleSize: 12, borderRadius: 8 },
  medium: { height: 380, nameSize: 20, roleSize: 11, borderRadius: 6 },
  small: { height: 320, nameSize: 18, roleSize: 10, borderRadius: 5 },
};

export default function TeamCard({ name, role, photo, index, size = "medium", autoOpen = false }: TeamCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const s = SIZES[size];

  // Apply autoOpen class
  useEffect(() => {
    if (autoOpen && cardRef.current) {
      cardRef.current.classList.add("open");
    }
  }, [autoOpen]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
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

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;

    light.style.background = `radial-gradient(circle 200px at ${x}px ${y}px, rgba(255,255,255,0.15) 0%, transparent 70%)`;
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
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transform-style: preserve-3d;
          transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1),
                      box-shadow 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
          will-change: transform;
        }
        .te-card:hover {
          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.18),
            0 10px 24px rgba(0, 0, 0, 0.1),
            0 2px 6px rgba(0, 0, 0, 0.06);
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
            0 12px 40px rgba(0, 0, 0, 0.2),
            0 4px 12px rgba(0, 0, 0, 0.12);
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
          opacity: 0.35;
          filter: grayscale(0.5) brightness(0.7);
          transition: opacity 0.5s ease, filter 0.5s ease;
        }
        .te-card:hover .te-bg {
          opacity: 0.5;
          filter: grayscale(0.3) brightness(0.8);
        }

        .te-photo {
          position: absolute;
          inset: 0;
          z-index: 2;
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

        .te-flap {
          position: absolute;
          top: 0;
          width: 50%;
          height: 100%;
          background-repeat: no-repeat;
          background-size: 200% 100%;
          z-index: 4;
          backface-visibility: hidden;
          transition: transform 0.65s cubic-bezier(0.3, 0.7, 0.2, 1);
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
        .te-card:hover .te-flap-l,
        .te-card.open .te-flap-l {
          transform: rotateY(-145deg);
        }
        .te-card:hover .te-flap-r,
        .te-card.open .te-flap-r {
          transform: rotateY(145deg);
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
          .te-flap, .te-photo { transition: none; }
          .te-card { transition: none; }
        }
      `}</style>

      <div style={{ position: 'relative' }}>
        <div className="te-index">{idx}</div>

        <div
          ref={cardRef}
          className="te-card"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => {
            const el = cardRef.current;
            if (el) el.classList.toggle("open");
          }}
        >
          <div
            className="te-stage"
            style={{ height: s.height, borderRadius: s.borderRadius }}
          >
            <div
              className="te-bg"
              style={{ backgroundImage: `url(${CARD_IMG})` }}
            />
            <div ref={lightRef} className="te-light" />
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
            <div
              className="te-flap te-flap-l"
              style={{ backgroundImage: `url(${CARD_IMG})` }}
            />
            <div
              className="te-flap te-flap-r"
              style={{ backgroundImage: `url(${CARD_IMG})` }}
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
