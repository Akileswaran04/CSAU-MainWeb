import type { GlyphKind } from "@/lib/destinations";

/* Small line-art glyph for a place in the network. `on` lights it in the signal amber. */
export default function DestGlyph({ kind, size = 44, on = true, orbit = false }: { kind: GlyphKind; size?: number; on?: boolean; orbit?: boolean }) {
  const c = on ? "var(--starlight)" : "var(--dim-300)";
  const hot = on ? "var(--lit)" : "var(--hull-700)";
  return (
    <svg className="dg" width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" aria-hidden style={{ flex: "none", overflow: "visible" }}>
      {kind === "earth" && (
        <>
          <circle cx="24" cy="24" r="11" />
          <path d="M13 24h22M24 13c5 6 5 16 0 22M24 13c-5 6-5 16 0 22" opacity=".6" />
          <ellipse cx="24" cy="24" rx="20" ry="7" transform="rotate(-24 24 24)" opacity=".7" />
          <circle cx="42" cy="17" r="2" fill={hot} stroke="none" />
        </>
      )}
      {kind === "station" && (
        <>
          <circle cx="24" cy="24" r="16" strokeDasharray="3 3" />
          <rect x="18" y="18" width="12" height="12" />
          <path d="M8 24h10M30 24h10M24 8v10M24 30v10" opacity=".7" />
          <circle cx="24" cy="24" r="2.4" fill={hot} stroke="none" />
        </>
      )}
      {kind === "comet" && (
        <>
          <circle cx="34" cy="14" r="5" fill={hot} stroke="none" />
          <path d="M30 18L6 42M32 20L14 42M36 19L26 42" opacity=".7" />
        </>
      )}
      {kind === "hole" && (
        <>
          <circle cx="24" cy="24" r="7" fill="var(--void-950)" />
          <ellipse cx="24" cy="24" rx="20" ry="7" />
          <ellipse cx="24" cy="24" rx="14" ry="4.5" opacity=".6" stroke={hot} />
        </>
      )}
      {kind === "constellation" && (
        <>
          <path d="M8 34L18 20 28 28 40 10" opacity=".7" />
          <circle cx="8" cy="34" r="2.2" fill={c} />
          <circle cx="18" cy="20" r="2.2" fill={c} />
          <circle cx="28" cy="28" r="2.2" fill={hot} stroke="none" />
          <circle cx="40" cy="10" r="2.2" fill={c} />
        </>
      )}
      {kind === "pulsar" && (
        <>
          <circle cx="24" cy="24" r="3" fill={hot} stroke="none" />
          <path d="M24 3v14M24 31v14" stroke={hot} />
          <path d="M9 24h10M29 24h10" opacity=".5" />
          <circle cx="24" cy="24" r="9" opacity=".5" strokeDasharray="2 3" />
        </>
      )}
      {orbit && (
        <g className="dg-orbit" style={{ transformOrigin: "24px 24px" }}>
          <circle cx="24" cy="-2" r="2" fill="var(--lit)" stroke="none" />
        </g>
      )}
    </svg>
  );
}
