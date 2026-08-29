"use client";

import { useState, useEffect, useRef } from "react";

type ModeToggleProps = {
  inverted: boolean;
  onToggle: () => void;
};

export default function ModeToggle({ inverted, onToggle }: ModeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prismatic shimmer animation on canvas
  useEffect(() => {
    if (!mounted || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame: number;
    let t = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Prismatic gradient that shifts
      const hue = inverted ? 0 : 200;
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, `hsla(${hue}, 60%, 95%, 0.6)`);
      grad.addColorStop(0.3, `hsla(${hue + 40}, 50%, 92%, 0.4)`);
      grad.addColorStop(0.6, `hsla(${hue + 80}, 45%, 93%, 0.5)`);
      grad.addColorStop(1, `hsla(${hue + 120}, 40%, 90%, 0.3)`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Shimmer sweep
      const sweepX = ((t * 0.8) % (w + 200)) - 100;
      const sweepGrad = ctx.createLinearGradient(sweepX - 60, 0, sweepX + 60, 0);
      sweepGrad.addColorStop(0, "rgba(255,255,255,0)");
      sweepGrad.addColorStop(0.5, "rgba(255,255,255,0.35)");
      sweepGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(0, 0, w, h);

      t += 1.2;
      frame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frame);
  }, [mounted, inverted]);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <button
        onClick={onToggle}
        aria-label={`Switch to ${inverted ? "hover" : "scroll"} mode`}
        style={{
          position: "relative",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 24px",
          height: 44,
          borderRadius: 22,
          border: "1.5px solid rgba(26,27,34,0.08)",
          background: inverted
            ? "linear-gradient(135deg, #1a1b22 0%, #2f3038 50%, #1a1b22 100%)"
            : "linear-gradient(135deg, rgba(251,248,255,0.95) 0%, rgba(244,242,253,0.9) 50%, rgba(251,248,255,0.95) 100%)",
          boxShadow: inverted
            ? "0 4px 20px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          transition: "all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
          overflow: "hidden",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase" as const,
          color: inverted ? "#ffffff" : "var(--on-surface, #1a1b22)",
          outline: "none",
        }}
      >
        {/* Prismatic shimmer canvas */}
        <canvas
          ref={canvasRef}
          width={200}
          height={44}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            borderRadius: "inherit",
            pointerEvents: "none",
            opacity: 0.6,
          }}
        />

        {/* Mode indicator dot */}
        <span
          style={{
            position: "relative",
            zIndex: 1,
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: inverted ? "#4ade80" : "var(--outline-variant, #c7c6cb)",
            boxShadow: inverted ? "0 0 8px rgba(74,222,128,0.5)" : "none",
            transition: "all 0.4s ease",
            flexShrink: 0,
          }}
        />

        {/* Toggle track */}
        <span
          style={{
            position: "relative",
            zIndex: 1,
            display: "inline-block",
            width: 28,
            height: 14,
            borderRadius: 7,
            background: inverted
              ? "rgba(74,222,128,0.25)"
              : "rgba(119,118,123,0.15)",
            border: `1px solid ${inverted ? "rgba(74,222,128,0.3)" : "rgba(119,118,123,0.2)"}`,
            transition: "all 0.4s ease",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 1,
              left: inverted ? 14 : 1,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: inverted ? "#4ade80" : "var(--outline, #77767b)",
              transition: "all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
              boxShadow: inverted ? "0 0 4px rgba(74,222,128,0.4)" : "none",
            }}
          />
        </span>

        {/* Mode label */}
        <span style={{ position: "relative", zIndex: 1, whiteSpace: "nowrap" }}>
          {inverted ? "SCROLL" : "HOVER"}
        </span>
      </button>

      {/* Subtle sub-label */}
      <div
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 8,
          fontWeight: 500,
          letterSpacing: "0.2em",
          textTransform: "uppercase" as const,
          color: "var(--outline-variant, #c7c6cb)",
          transition: "color 0.3s ease",
          textAlign: "center",
        }}
      >
        MODE
      </div>
    </div>
  );
}
