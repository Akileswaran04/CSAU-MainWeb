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
        width: 220,
        height: 56,
      }}
    >
      <div
        onClick={onToggle}
        style={{ cursor: "pointer", width: "100%", height: "100%" }}
        title={inverted ? "Switch to Hover Mode" : "Switch to Scroll Mode"}
      >
        <RectangleButtons
          variant="generate-button"
          mode="dark"
          hue={inverted ? 0 : 0}
          saturation={inverted ? 0.0 : 0.0}
          brightness={1.0}
        />
      </div>
      {/* Mode label overlay */}
      <div
        style={{
          position: "absolute",
          bottom: -22,
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase" as const,
          color: inverted ? "#4ade80" : "#999",
          whiteSpace: "nowrap",
          transition: "color 0.3s ease",
        }}
      >
        {inverted ? "● SCROLL MODE" : "○ HOVER MODE"}
      </div>
    </div>
  );
}
