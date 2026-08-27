"use client";

import dynamic from "next/dynamic";

/* ============================================================
   HOME — THE DIGITAL REALM (Client Component)
   
   Uses dynamic import with ssr:false to lazy-load all
   heavy client-side components (Three.js, GSAP, etc.)
   ============================================================ */

const HomeClient = dynamic(() => import("@/components/HomeClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#090714] flex items-center justify-center">
      <div className="text-center">
        <h1
          className="text-6xl font-bold tracking-tighter glow-cyan mb-4"
          style={{ fontFamily: "'Kenfolg', 'Centrion', sans-serif" }}
        >
          CSAU
        </h1>
        <p className="text-xs tracking-[0.4em] uppercase text-cyan/40 font-[family-name:var(--font-geist-mono)]">
          The Digital Realm
        </p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <HomeClient />;
}
