"use client";

import Link from "next/link";
import TeamShowcase from "@/components/TeamShowcase";

export default function TeamShowcasePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Top nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 glass"
        style={{ borderBottom: "1px solid var(--outline-variant)" }}
      >
        <div className="w-full px-5 sm:px-8 lg:px-12 flex items-center justify-between" style={{ padding: "12px clamp(16px, 4vw, 40px)" }}>
          <Link href="/" className="flex flex-col group">
            <span
              className="text-xl sm:text-2xl font-bold tracking-wider"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                color: "var(--primary)",
              }}
            >
              CSAU
            </span>
            <span
              className="text-[10px] tracking-widest uppercase"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 500,
                color: "var(--outline)",
                letterSpacing: "0.1em",
              }}
            >
              The Digital Realm
            </span>
          </Link>
          <Link
            href="/?view=description"
            className="neon-underline text-xs tracking-widest uppercase transition-colors"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              color: "var(--outline)",
              letterSpacing: "0.1em",
              textDecoration: "none",
            }}
          >
            ← Back to who we are
          </Link>
        </div>
      </nav>

      <main className="pt-16">
        <TeamShowcase />
      </main>
    </div>
  );
}
