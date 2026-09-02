"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   TEAM CAROUSEL — Scroll-Driven Vertical Card Reveal

   Cards slide upward as the user scrolls down.
   Each card has:
     - Left: Role / Title
     - Right: Name, Department, Social Links
   Text fades in sequentially as the card enters the viewport.
   ============================================================ */

export interface TeamMember {
  name: string;
  role: string;
  dept?: string;
  photo?: string;
  links?: { label: string; url: string }[];
}

interface TeamCarouselProps {
  members: TeamMember[];
  startDelay?: number;
}

export default function TeamCarousel({ members, startDelay = 0 }: TeamCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardRefs.current.forEach((card, i) => {
        if (!card) return;

        const roleEl = card.querySelector<HTMLElement>(".tc-role");
        const nameEl = card.querySelector<HTMLElement>(".tc-name");
        const deptEl = card.querySelector<HTMLElement>(".tc-dept");
        const linksEl = card.querySelector<HTMLElement>(".tc-links");
        const lineEl = card.querySelector<HTMLElement>(".tc-line");

        // Set initial states
        gsap.set(card, { y: 80, opacity: 0 });
        if (roleEl) gsap.set(roleEl, { x: -30, opacity: 0 });
        if (nameEl) gsap.set(nameEl, { y: 20, opacity: 0 });
        if (deptEl) gsap.set(deptEl, { y: 15, opacity: 0 });
        if (linksEl) gsap.set(linksEl, { y: 10, opacity: 0 });
        if (lineEl) gsap.set(lineEl, { scaleX: 0, opacity: 0 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            end: "top 40%",
            toggleActions: "play none none reverse",
          },
        });

        const delay = startDelay + i * 0.08;

        // Card slides up
        tl.to(card, {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          delay,
        });

        // Role slides in from left
        if (roleEl) {
          tl.to(roleEl, {
            x: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
          }, "-=0.4");
        }

        // Divider line grows
        if (lineEl) {
          tl.to(lineEl, {
            scaleX: 1,
            opacity: 1,
            duration: 0.4,
            ease: "power2.inOut",
          }, "-=0.3");
        }

        // Name fades in
        if (nameEl) {
          tl.to(nameEl, {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
          }, "-=0.3");
        }

        // Dept fades in
        if (deptEl) {
          tl.to(deptEl, {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: "power2.out",
          }, "-=0.25");
        }

        // Links fade in
        if (linksEl) {
          tl.to(linksEl, {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: "power2.out",
          }, "-=0.2");
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, [members, startDelay]);

  return (
    <>
      <style>{`
        .tc-carousel {
          position: relative;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 5%;
        }
        .tc-card {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 0;
          padding: 40px 0;
          border-bottom: 1px solid var(--outline-variant, #c7c6cb);
          will-change: transform, opacity;
        }
        .tc-card:first-child {
          border-top: 1px solid var(--outline-variant, #c7c6cb);
        }
        .tc-role {
          font-family: 'Ethnocentric', 'Sector034', sans-serif;
          font-size: clamp(11px, 1.4vw, 14px);
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--on-surface, #1a1b22);
          text-align: left;
          padding-right: 32px;
        }
        .tc-line {
          width: 1px;
          height: 48px;
          background: var(--outline-variant, #c7c6cb);
          transform-origin: top center;
        }
        .tc-info {
          padding-left: 32px;
          text-align: left;
        }
        .tc-name {
          font-family: 'CremeEspana', cursive;
          font-size: clamp(20px, 2.8vw, 30px);
          font-weight: 400;
          color: var(--on-surface, #1a1b22);
          margin: 0;
          line-height: 1.15;
        }
        .tc-dept {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--outline, #77767b);
          margin: 6px 0 0;
        }
        .tc-links {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }
        .tc-link {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--outline, #77767b);
          text-decoration: none;
          border: 1px solid var(--outline-variant, #c7c6cb);
          padding: 4px 10px;
          border-radius: 999px;
          transition: color 0.3s, border-color 0.3s, box-shadow 0.3s;
        }
        .tc-link:hover {
          color: var(--on-surface, #1a1b22);
          border-color: var(--primary-container, #27272a);
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }

        /* Responsive — stack vertically on small screens */
        @media (max-width: 640px) {
          .tc-card {
            grid-template-columns: 1fr;
            gap: 8px;
            padding: 28px 0;
          }
          .tc-role {
            padding-right: 0;
            text-align: left;
            font-size: 10px;
          }
          .tc-line {
            width: 32px;
            height: 1px;
            margin: 4px 0;
          }
          .tc-info {
            padding-left: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tc-card, .tc-role, .tc-name, .tc-dept, .tc-links, .tc-line {
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      <div ref={containerRef} className="tc-carousel">
        {members.map((member, i) => (
          <div
            key={member.name + i}
            ref={(el) => { if (el) cardRefs.current[i] = el; }}
            className="tc-card"
          >
            {/* Left: Role */}
            <div className="tc-role">{member.role}</div>

            {/* Center: Divider line */}
            <div className="tc-line" />

            {/* Right: Name, Dept, Links */}
            <div className="tc-info">
              <p className="tc-name">{member.name}</p>
              {member.dept && <p className="tc-dept">{member.dept}</p>}
              {member.links && member.links.length > 0 && (
                <div className="tc-links">
                  {member.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tc-link"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
