/* ============================================================================
   REALM LOADER — shared route loading identity.
   
   Shows a thematic loading animation per section:
     - Concentric rings spinning
     - Section-specific color accent
     - Pulsing status text
     - Animated progress bar
   
   Pure CSS + inline styles so it works from server components (loading.tsx).
   ========================================================================== */

type LoaderTheme = {
  accent: string;
  ringColor: string;
  icon: string;
};

const THEMES: Record<string, LoaderTheme> = {
  "Opening archive": { accent: "text-cyan", ringColor: "border-cyan/25", icon: "📡" },
  "Connecting people": { accent: "text-neon-green", ringColor: "border-neon-green/25", icon: "🖥" },
  "Opening portal": { accent: "text-magenta", ringColor: "border-magenta/25", icon: "🌀" },
  "Syncing journey": { accent: "text-neon-yellow", ringColor: "border-neon-yellow/25", icon: "⚡" },
  "Loading": { accent: "text-cyan", ringColor: "border-cyan/20", icon: "◇" },
};

const DEFAULT_THEME: LoaderTheme = { accent: "text-cyan", ringColor: "border-cyan/20", icon: "◇" };

export default function RealmLoader({ label }: { label: string }) {
  const theme = THEMES[label] ?? DEFAULT_THEME;

  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#090714]"
    >
      {/* Spinning portal rings */}
      <div className="relative w-24 h-24">
        {/* Ring 1 - outermost */}
        <div
          className={`absolute inset-0 rounded-full border ${theme.ringColor}`}
          style={{ animation: "portal-spin 8s linear infinite" }}
        />
        {/* Ring 2 */}
        <div
          className={`absolute inset-2 rounded-full border ${theme.ringColor}`}
          style={{ animation: "portal-spin-reverse 6s linear infinite" }}
        />
        {/* Ring 3 - innermost */}
        <div
          className={`absolute inset-4 rounded-full border ${theme.ringColor}`}
          style={{ animation: "portal-spin 4s linear infinite" }}
        />
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl" style={{ animation: "portal-pulse 2s ease-in-out infinite" }}>
            {theme.icon}
          </span>
        </div>
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className={`text-xs tracking-[0.35em] uppercase ${theme.accent} font-[family-name:var(--font-geist-mono)] animate-pulse`}>
          {label}...
        </p>
        <p className="text-[9px] tracking-[0.25em] text-foreground/20 uppercase font-[family-name:var(--font-geist-mono)] mt-2">
          MAINTAINING SIGNAL
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-56 h-px bg-foreground/10 overflow-hidden rounded-full">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-cyan to-transparent loader-line" />
      </div>
    </div>
  );
}
