import Link from "next/link";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";

/* ============================================================================
   SUBPAGE SHELL — shared chrome for all non-home routes.
   
   Each section gets its own atmosphere:
     - /about   → cyan core glow
     - /domains → magenta training grounds
     - /events  → cyan data vault
     - /journey → neon yellow journey
     - /team    → neon green command center
     - /join    → magenta portal
   ========================================================================== */

type SectionAtmosphere = {
  glowColor: string;   // primary glow
  glowColor2: string;  // secondary glow
  accentBorder: string; // accent for header border
};

const ATMOSPHERES: Record<string, SectionAtmosphere> = {
  "/about": { glowColor: "bg-cyan/5", glowColor2: "bg-cyan/3", accentBorder: "border-cyan/15" },
  "/domains": { glowColor: "bg-magenta/5", glowColor2: "bg-magenta/3", accentBorder: "border-magenta/15" },
  "/events": { glowColor: "bg-cyan/4", glowColor2: "bg-magenta/3", accentBorder: "border-cyan/12" },
  "/journey": { glowColor: "bg-neon-yellow/4", glowColor2: "bg-cyan/3", accentBorder: "border-neon-yellow/12" },
  "/team": { glowColor: "bg-neon-green/4", glowColor2: "bg-magenta/3", accentBorder: "border-neon-green/12" },
  "/join": { glowColor: "bg-magenta/5", glowColor2: "bg-cyan/3", accentBorder: "border-magenta/15" },
};

const DEFAULT_ATMOSPHERE: SectionAtmosphere = {
  glowColor: "bg-cyan/5",
  glowColor2: "bg-magenta/3",
  accentBorder: "border-cyan/12",
};

function getAtmosphere(pathname: string): SectionAtmosphere {
  // Match the start of the pathname to handle dynamic routes like /events/slug
  for (const [path, atm] of Object.entries(ATMOSPHERES)) {
    if (pathname.startsWith(path)) return atm;
  }
  return DEFAULT_ATMOSPHERE;
}

export default function SubpageShell({
  label,
  children,
  pathname,
}: {
  label: string;
  children: ReactNode;
  pathname?: string;
}) {
  // Use provided pathname or default to about (for SSR compat)
  const atm = pathname ? getAtmosphere(pathname) : DEFAULT_ATMOSPHERE;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-grid-lines opacity-20 pointer-events-none" aria-hidden />

      {/* Section-specific atmosphere glows */}
      <div
        className={`fixed top-1/4 left-1/4 w-[500px] h-[500px] ${atm.glowColor} rounded-full blur-3xl pointer-events-none`}
        aria-hidden
      />
      <div
        className={`fixed bottom-0 right-0 w-[400px] h-[400px] ${atm.glowColor2} rounded-full blur-3xl pointer-events-none`}
        aria-hidden
      />

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 glass border-b ${atm.accentBorder} py-3`}>
        <div className="w-full px-5 sm:px-8 lg:px-12 flex items-center justify-between">
          <Link href="/" data-cursor="ENTER" className="flex flex-col group">
            <span className="text-xl sm:text-2xl font-bold tracking-wider text-cyan glow-cyan font-[family-name:var(--font-display)]">
              CSAU
            </span>
            <span className="text-[10px] tracking-widest text-foreground/40 uppercase font-[family-name:var(--font-geist-mono)]">
              The Digital Realm
            </span>
          </Link>
          <Link
            href="/"
            data-cursor="ENTER"
            className="neon-underline text-xs tracking-[0.25em] uppercase text-foreground/50 hover:text-cyan transition-colors font-[family-name:var(--font-geist-mono)]"
          >
            ← Back to the realm
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main id="main" className="relative z-10 pt-28 pb-0">
        <p className="px-5 sm:px-8 lg:px-12 max-w-6xl mx-auto text-[10px] tracking-[0.35em] uppercase text-cyan/60 font-[family-name:var(--font-geist-mono)] mb-6">
          {label}
        </p>
        {children}
      </main>

      <Footer />
    </div>
  );
}
