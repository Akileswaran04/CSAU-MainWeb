"use client";

import { useState, useCallback } from "react";

/* ============================================================
   TEAM CARD — Box-Reveal Animation (White Clay Theme)

   Flaps use /card-pattern.jpg (ornate embossed texture from
   the reference HTML). Flaps swing open on hover/tap to
   reveal the team photo.
   ============================================================ */

const CARD_IMG = "/card-pattern.jpg";

interface TeamCardProps {
  name: string;
  role: string;
  photo?: string;
}

export default function TeamCard({ name, role, photo }: TeamCardProps) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  const isOpen = open;

  return (
    <>
      <style>{`
        .tc-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .tc-card {
          perspective: 1200px;
          perspective-origin: 50% 50%;
          height: 420px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          position: relative;
          width: 100%;
        }
        .tc-stage {
          position: relative;
          width: 100%;
          height: 360px;
          overflow: hidden;
          border-radius: 8px;
        }

        /* Photo — revealed behind flaps */
        .tc-photo {
          position: absolute;
          left: 50%;
          bottom: 8px;
          width: 78%;
          height: 88%;
          border-radius: 3px;
          overflow: hidden;
          transform: translate(-50%, 10%) scale(0.9);
          opacity: 0;
          transition:
            transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) 0.16s,
            opacity 0.5s ease 0.16s;
          z-index: 2;
          background: #000;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.1);
        }
        .tc-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: grayscale(0.1) contrast(1.05);
        }
        .tc-photo::after {
          content: "";
          position: absolute;
          inset: 0;
          border: 1px solid var(--outline-variant, #c7c6cb);
          pointer-events: none;
        }
        .tc-card:hover .tc-photo,
        .tc-card.open .tc-photo {
          transform: translate(-50%, -14%) scale(1);
          opacity: 1;
        }

        /* Flaps — ornate embossed pattern, split left/right */
        .tc-flap {
          position: absolute;
          top: 0;
          width: 50%;
          height: 100%;
          background-repeat: no-repeat;
          background-size: 200% 100%;
          border: 1px solid #000;
          z-index: 3;
          backface-visibility: hidden;
          transition: transform 0.6s cubic-bezier(0.3, 0.7, 0.2, 1);
          transform-style: preserve-3d;
        }
        .tc-flap-l {
          left: 0;
          border-radius: 8px 0 0 8px;
          background-position: left top;
          transform-origin: left center;
          box-shadow: inset -2px 0 4px rgba(0, 0, 0, 0.15);
        }
        .tc-flap-r {
          right: 0;
          border-radius: 0 8px 8px 0;
          background-position: right top;
          transform-origin: right center;
        }
        .tc-card:hover .tc-flap-l,
        .tc-card.open .tc-flap-l {
          transform: rotateY(-140deg);
        }
        .tc-card:hover .tc-flap-r,
        .tc-card.open .tc-flap-r {
          transform: rotateY(140deg);
        }

        @media (prefers-reduced-motion: reduce) {
          .tc-flap, .tc-photo { transition: none; }
        }
      `}</style>

      <div className="tc-wrap">
        <div
          className={`tc-card${isOpen ? " open" : ""}`}
          onClick={toggle}
        >
          <div className="tc-stage">
            {/* Photo layer */}
            <div className="tc-photo">
              {photo ? (
                <img src={photo} alt={name} loading="lazy" />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(135deg, #e8e7f1, #c7c6cb)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: 48,
                    color: "var(--on-surface-variant, #46464b)",
                  }}
                >
                  {name.split(" ").map((w) => w[0]).join("")}
                </div>
              )}
            </div>

            {/* Left flap — background-image via inline style for reliable loading */}
            <div
              className="tc-flap tc-flap-l"
              style={{
                backgroundImage: `url(${CARD_IMG})`,
              }}
            />
            {/* Right flap */}
            <div
              className="tc-flap tc-flap-r"
              style={{
                backgroundImage: `url(${CARD_IMG})`,
              }}
            />
          </div>
        </div>

        {/* Info below card */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <p
            style={{
              fontFamily: "'CremeEspana', cursive",
              color: "var(--on-surface, #1a1b22)",
              fontSize: 24,
              fontWeight: 400,
              margin: 0,
            }}
          >
            {name}
          </p>
          <p
            style={{
              color: "var(--outline, #77767b)",
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: "3px 0 0",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500,
            }}
          >
            {role}
          </p>
        </div>
      </div>
    </>
  );
}
