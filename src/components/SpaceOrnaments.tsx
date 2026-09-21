/* ============================================================
   SPACE ORNAMENTS - tiny pure-SVG pieces used by the arena pages.
   Everything reads colour tokens.
   ============================================================ */


/** Small probe seen from above, used as a bullet / ornament. */
export function ProbeMark({ size = 30, flip = false }: { size?: number; flip?: boolean }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size * 0.5}
      viewBox="0 0 60 30"
      style={{ display: "block", transform: flip ? "scaleX(-1)" : undefined, flex: "none" }}
    >
      {/* solar panels */}
      <rect x="10" y="2" width="20" height="9" fill="var(--hull-900)" stroke="var(--dim-300)" strokeWidth="1" />
      <rect x="10" y="19" width="20" height="9" fill="var(--hull-900)" stroke="var(--dim-300)" strokeWidth="1" />
      <path d="M20 2V11M20 19V28" stroke="var(--dim-300)" strokeWidth=".8" opacity=".7" />
      {/* hull */}
      <path d="M56 15 L14 6 L14 24 Z" fill="var(--hull-900)" stroke="var(--starlight)" strokeWidth="1.2" strokeLinejoin="round" />
      {/* indicator */}
      <circle cx="26" cy="15" r="2" fill="var(--lit)" />
    </svg>
  );
}

/** Waypoint bullet: a hairline ring with a centre dot. */
export function NodeMark({ size = 14 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 16 16" style={{ display: "block", flex: "none" }}>
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="var(--dim-300)" strokeWidth="1" />
      <circle cx="8" cy="8" r="2" fill="var(--lit)" />
    </svg>
  );
}
