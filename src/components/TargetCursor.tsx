import { useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import "./TargetCursor.css";

/* ============================================================
   TARGET CURSOR — Rotating Reticle

   Custom cursor: circle ring + 4 directional arrows + crosshair.
   Continuously rotates. Color is controlled externally via props.
   ============================================================ */

interface TargetCursorProps {
  spinDuration?: number;
  hideDefaultCursor?: boolean;
  color?: string;
}

const TargetCursor = ({
  spinDuration = 3,
  hideDefaultCursor = true,
  color = "#1a1b22",
}: TargetCursorProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const spinTl = useRef<gsap.core.Timeline | null>(null);
  const colorRef = useRef(color);

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    const hasTouchScreen =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    const ua = (navigator.userAgent || "").toLowerCase();
    const isMobileUA = /android|iphone|ipad|ipod/i.test(ua);
    return (hasTouchScreen && isSmallScreen) || isMobileUA;
  }, []);

  // React to color changes
  useEffect(() => {
    colorRef.current = color;
    // Update SVG stroke/fill attributes live
    if (!wrapperRef.current) return;
    const svgEls = wrapperRef.current.querySelectorAll("svg");
    svgEls.forEach((svg) => {
      svg.querySelectorAll("[stroke]").forEach((el) => {
        el.setAttribute("stroke", color);
      });
      svg.querySelectorAll("[fill]:not([fill='none'])").forEach((el) => {
        el.setAttribute("fill", color);
      });
    });
    const dot = wrapperRef.current.querySelector(".reticle-dot") as HTMLElement;
    if (dot) dot.style.backgroundColor = color;
  }, [color]);

  useEffect(() => {
    if (isMobile || !wrapperRef.current) return;

    const originalCursor = document.body.style.cursor;
    if (hideDefaultCursor) {
      document.body.style.cursor = "none";
    }

    const el = wrapperRef.current;

    gsap.set(el, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    spinTl.current = gsap
      .timeline({ repeat: -1 })
      .to(el, { rotation: "+=360", duration: spinDuration, ease: "none" });

    const moveHandler = (e: MouseEvent) => {
      gsap.to(el, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: "power3.out",
      });
    };
    window.addEventListener("mousemove", moveHandler);

    const downHandler = () => {
      gsap.to(el, { scale: 0.85, duration: 0.15 });
    };
    const upHandler = () => {
      gsap.to(el, { scale: 1, duration: 0.2 });
    };
    window.addEventListener("mousedown", downHandler);
    window.addEventListener("mouseup", upHandler);

    return () => {
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mousedown", downHandler);
      window.removeEventListener("mouseup", upHandler);
      spinTl.current?.kill();
      document.body.style.cursor = originalCursor;
    };
  }, [spinDuration, hideDefaultCursor, isMobile]);

  if (isMobile || typeof document === "undefined") return null;

  return createPortal(
    <div ref={wrapperRef} className="target-reticle">
      {/* Outer circle ring */}
      <svg className="reticle-ring" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="1.5" strokeDasharray="3 5" opacity="0.6" />
        <circle cx="24" cy="24" r="14" stroke={color} strokeWidth="1" opacity="0.3" />
      </svg>

      {/* 4 triangular arrows */}
      <svg className="reticle-arrows" viewBox="0 0 48 48" fill="none">
        <polygon points="24,2 20,10 28,10" fill={color} opacity="0.8" />
        <polygon points="24,46 20,38 28,38" fill={color} opacity="0.8" />
        <polygon points="2,24 10,20 10,28" fill={color} opacity="0.8" />
        <polygon points="46,24 38,20 38,28" fill={color} opacity="0.8" />
      </svg>

      {/* Crosshair */}
      <svg className="reticle-cross" viewBox="0 0 48 48" fill="none">
        <line x1="24" y1="19" x2="24" y2="29" stroke={color} strokeWidth="1.5" />
        <line x1="19" y1="24" x2="29" y2="24" stroke={color} strokeWidth="1.5" />
      </svg>

      {/* Center dot */}
      <div className="reticle-dot" style={{ backgroundColor: color }} />
    </div>,
    document.body
  );
};

export default TargetCursor;
