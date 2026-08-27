/* ============================================================================
   REALM LOADER — shared route loading identity. A thin cyan line grows
   across the screen under the route's status label. Pure CSS so it can be
   used from server components (loading.tsx).
   ========================================================================== */

export default function RealmLoader({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[#090714]"
    >
      <p className="text-xs tracking-[0.35em] uppercase text-cyan/70 font-[family-name:var(--font-geist-mono)] animate-pulse">
        {label}...
      </p>
      <div className="w-56 h-px bg-foreground/10 overflow-hidden rounded-full">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-cyan to-transparent loader-line" />
      </div>
    </div>
  );
}
