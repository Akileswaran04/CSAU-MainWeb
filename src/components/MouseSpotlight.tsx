"use client";

import { useEffect, useRef } from "react";

/* ============================================================
   MOUSE SPOTLIGHT — A radial glow that follows the cursor.
   
   Creates an ambient light-following effect that makes the
   page feel alive and interactive. Only active on fine pointers
   (desktop) and respects prefers-reduced-motion.
   ============================================================ */

export default function MouseSpotlight() {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const accentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const spotlight = spotlightRef.current;
    const accent = accentRef.current;
    if (!spotlight || !accent) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    if (reduceMotion || !finePointer) {
      spotlight.style.display = "none";
      accent.style.display = "none";
      return;
    }

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      spotlight.style.transform = `translate(${currentX - 200}px, ${currentY - 200}px)`;
      accent.style.transform = `translate(${currentX - 60}px, ${currentY - 60}px)`;

      raf = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMouseMove);
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Main spotlight glow */}
      <div
        ref={spotlightRef}
        className="fixed top-0 left-0 w-[400px] h-[400px] pointer-events-none z-[5] opacity-30 mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle, rgba(0,240,255,0.08) 0%, rgba(0,240,255,0.03) 30%, transparent 70%)",
          willChange: "transform",
        }}
      />
      {/* Small accent dot */}
      <div
        ref={accentRef}
        className="fixed top-0 left-0 w-[120px] h-[120px] pointer-events-none z-[5] opacity-20 mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle, rgba(255,0,170,0.1) 0%, transparent 60%)",
          willChange: "transform",
        }}
      />
    </>
  );
}
