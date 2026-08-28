"use client";

import Link from "next/link";
import TeamShowcase from "@/components/TeamShowcase";

export default function TeamShowcasePage() {
  return (
    <div className="min-h-screen" style={{ background: "#050507" }}>
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b py-3" style={{ borderColor: "rgba(0,240,255,0.08)" }}>
        <div className="w-full px-5 sm:px-8 lg:px-12 flex items-center justify-between">
          <Link href="/" className="flex flex-col group">
            <span
              className="text-xl sm:text-2xl font-bold tracking-wider"
              style={{ fontFamily: "'Zen Dots', sans-serif", color: "var(--cyan)", textShadow: "0 0 10px rgba(0,240,255,0.8)" }}
            >
              CSAU
            </span>
            <span
              className="text-[10px] tracking-widest uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: "rgba(205,211,239,0.4)" }}
            >
              The Digital Realm
            </span>
          </Link>
          <Link
            href="/?view=description"
            className="neon-underline text-xs tracking-[0.25em] uppercase transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: "rgba(205,211,239,0.5)" }}
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
