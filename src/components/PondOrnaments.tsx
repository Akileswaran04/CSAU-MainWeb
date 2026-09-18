/* ============================================================
   POND ORNAMENTS — tiny pure-SVG / CSS pieces shared by the
   events, blog and 404 pages. Everything reads colour tokens.
   ============================================================ */

/** Hairline ripple line: a flat rule that breaks into three widening rings. */
export function RippleRule({ width = 220 }: { width?: number }) {
  return (
    <svg
      className="pond-rule"
      aria-hidden
      width={width}
      height="14"
      viewBox="0 0 220 14"
      fill="none"
      stroke="var(--pond-300)"
      strokeWidth="1"
      style={{ display: "block", maxWidth: "100%" }}
    >
      <path d="M0 7 H70" opacity=".55" />
      <ellipse cx="86" cy="7" rx="6" ry="2.2" opacity=".9" />
      <ellipse cx="86" cy="7" rx="14" ry="4.6" opacity=".55" />
      <ellipse cx="86" cy="7" rx="22" ry="6.6" opacity=".28" />
      <path d="M118 7 H220" opacity=".28" />
    </svg>
  );
}

/** Small koi seen from above, used as a bullet / ornament. */
export function KoiMark({ size = 30, flip = false }: { size?: number; flip?: boolean }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size * 0.5}
      viewBox="0 0 60 30"
      style={{ display: "block", transform: flip ? "scaleX(-1)" : undefined, flex: "none" }}
    >
      {/* tail */}
      <path d="M12 15 C6 11 3 7 0 5 C2 10 2 20 0 25 C3 23 6 19 12 15Z" fill="var(--signal)" opacity=".85" />
      {/* body */}
      <path d="M10 15 C18 6 38 6 52 13 C54 14 54 16 52 17 C38 24 18 24 10 15Z" fill="var(--foam)" />
      {/* vermilion patch */}
      <path d="M22 11 C28 9 36 10 40 13 C36 17 28 18 22 16 C20 14 20 12 22 11Z" fill="var(--signal)" />
      {/* pectoral fins */}
      <path d="M40 9 C43 4 47 3 49 4 C47 7 44 9 40 9Z" fill="var(--foam)" opacity=".6" />
      <path d="M40 21 C43 26 47 27 49 26 C47 23 44 21 40 21Z" fill="var(--foam)" opacity=".6" />
      <circle cx="48" cy="13" r="1" fill="var(--pond-950)" />
    </svg>
  );
}

/** Lily-pad bullet (a pad with a wedge notch). */
export function LilyPad({ size = 14 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 16 16" style={{ display: "block", flex: "none" }}>
      <path d="M8 8 L14.6 5.2 A7 7 0 1 1 8 1 Z" fill="var(--lily-600)" transform="rotate(30 8 8)" />
      <path d="M8 8 L14.6 5.2" stroke="var(--pond-950)" strokeWidth=".8" transform="rotate(30 8 8)" opacity=".6" />
    </svg>
  );
}

/** Shared pond-panel + ripple-hover CSS (scoped by class names). */
export const POND_PANEL_CSS = `
  .pond-panel {
    position: relative;
    overflow: hidden;
    background: color-mix(in srgb, var(--pond-950) 86%, transparent);
    border: 1px solid color-mix(in srgb, var(--foam) 22%, transparent);
    border-radius: var(--radius-md);
    transition: border-color var(--dur-base) var(--ease-out), background-color var(--dur-base) var(--ease-out);
  }
  .pond-panel:hover { border-color: var(--signal); background: color-mix(in srgb, var(--pond-950) 92%, transparent); }
  .pond-panel > * { position: relative; z-index: 1; }
  .pond-panel::before, .pond-panel::after {
    content: '';
    position: absolute;
    right: 28px; top: 34px;
    width: 20px; height: 20px;
    margin: -10px -10px 0 0;
    border-radius: 50%;
    border: 1px solid var(--pond-300);
    opacity: 0;
    pointer-events: none;
    z-index: 0;
  }
  .pond-panel:hover::before { animation: pond-ripple 1.6s var(--ease-out) 1 both; }
  .pond-panel:hover::after { animation: pond-ripple 1.6s var(--ease-out) .35s 1 both; }
  @keyframes pond-ripple {
    0% { transform: scale(.4); opacity: .5; }
    100% { transform: scale(14); opacity: 0; }
  }
  .pond-panel a, .pond-panel button { position: relative; }
  @media (prefers-reduced-motion: reduce) {
    .pond-panel::before, .pond-panel::after { display: none; }
    .pond-panel, .pond-panel:hover { transition: none; }
  }
`;
