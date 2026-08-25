import Link from "next/link";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";

/* ============================================================================
   SUBPAGE SHELL — shared chrome for all non-home routes so every page keeps
   the Digital Realm visual universe: grid backdrop, atmosphere, header,
   footer. `label` is the realm micro-label shown at the top of the page.
   ========================================================================== */

export default function SubpageShell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-grid-lines opacity-20 pointer-events-none" aria-hidden />
      <div
        className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden
      />
      <div
        className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-magenta/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-cyan/10 py-3">
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
