"use client";

import dynamic from "next/dynamic";
import "@designcodeio/threeui/style.css";

const RectangleButtons = dynamic(
  () =>
    import("@designcodeio/threeui/components/RectangleButtons").then(
      (mod) => mod.RectangleButtons
    ) as Promise<React.ComponentType<any>>,
  { ssr: false }
);

type ModeToggleProps = {
  inverted: boolean;
  onToggle: () => void;
};

export default function ModeToggle({ inverted, onToggle }: ModeToggleProps) {
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
        gap: 6,
      }}
    >
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onToggle(); }}
        style={{
          cursor: "pointer",
          width: 200,
          height: 52,
          borderRadius: 12,
          overflow: "hidden",
          background: "rgba(251,248,255,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--outline-variant, #c7c6cb)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
          transition: "box-shadow 0.3s ease, border-color 0.3s ease",
        }}
        title={inverted ? "Switch to Hover Mode" : "Switch to Scroll Mode"}
      >
        <RectangleButtons
          variant="generate-button"
          mode="light"
          hue={0}
          saturation={0.85}
          brightness={1.0}
        />
      </div>
      {/* Mode label */}
      <div
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase" as const,
          color: inverted ? "var(--on-surface, #1a1b22)" : "var(--outline, #77767b)",
          whiteSpace: "nowrap",
          transition: "color 0.3s ease",
          textAlign: "center",
        }}
      >
        {inverted ? "SCROLL" : "HOVER"}
      </div>
    </div>
  );
}
