"use client";

import { useRef, useState, useCallback } from "react";

/* ============================================================
   MAGNETIC CARD — A card that tilts in 3D towards the mouse
   cursor with a holographic glow effect following the pointer.
   Award-winning interaction pattern used by Awwwards sites.
   ============================================================ */

interface MagneticCardProps {
  children: React.ReactNode;
  className?: string;
  /** Maximum tilt angle in degrees */
  maxTilt?: number;
  /** Glow color */
  glowColor?: string;
  /** Whether the effect is enabled */
  enabled?: boolean;
}

export default function MagneticCard({
  children,
  className = "",
  maxTilt = 12,
  glowColor = "#00f0ff",
  enabled = true,
}: MagneticCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Tilt calculations
      const tiltX = (y - 0.5) * maxTilt * -1; // Vertical mouse → X rotation
      const tiltY = (x - 0.5) * maxTilt; // Horizontal mouse → Y rotation

      setTilt({ x: tiltX, y: tiltY });
      setGlowPos({ x: x * 100, y: y * 100 });
    },
    [enabled, maxTilt]
  );

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setIsHovering(false);
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1000px",
      }}
    >
      <div
        className="relative w-full h-full transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>

      {/* Glow effect following mouse */}
      {isHovering && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl z-10 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${glowColor}15, transparent 50%)`,
            opacity: isHovering ? 1 : 0,
          }}
        />
      )}

      {/* Top highlight following mouse */}
      {isHovering && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl z-10"
          style={{
            background: `linear-gradient(${135 + tilt.y * 2}deg, ${glowColor}08, transparent 40%)`,
          }}
        />
      )}
    </div>
  );
}
