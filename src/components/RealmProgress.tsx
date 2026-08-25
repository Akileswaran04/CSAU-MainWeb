"use client";

import { useEffect, useState } from "react";

/* ============================================================================
   REALM PROGRESS — fixed right-side navigation rail (home page only).
   Shows 01–07 with the active realm illuminated, plus scroll percentage.
   Hidden on small screens and for reduced-motion users it still works but
   without smooth scrolling side effects.
   ========================================================================== */

const SECTIONS = [
  { index: "01", label: "GATE", anchor: "gate" },
  { index: "02", label: "ORIGIN", anchor: "origin" },
  { index: "03", label: "DOMAINS", anchor: "domains" },
  { index: "04", label: "ARCHIVE", anchor: "archive" },
  { index: "05", label: "JOURNEY", anchor: "journey" },
  { index: "06", label: "PEOPLE", anchor: "people" },
  { index: "07", label: "PORTAL", anchor: "portal" },
];

export default function RealmProgress() {
  const [active, setActive] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = SECTIONS.findIndex((s) => s.anchor === entry.target.id);
          if (i !== -1) setActive(i);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );

    for (const s of SECTIONS) {
      const el = document.getElementById(s.anchor);
      if (el) observer.observe(el);
    }

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.round((window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <nav
      aria-label="Realm progress"
      className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-4 pointer-events-none"
    >
      {/* current realm label */}
      <div className="text-right mb-1">
        <p className="text-[10px] tracking-[0.3em] text-foreground/30 font-[family-name:var(--font-geist-mono)]">
          CSAU / DIGITAL REALM
        </p>
        <p className="text-xs tracking-[0.25em] text-cyan font-[family-name:var(--font-geist-mono)] mt-1">
          {SECTIONS[active].index} / 07 — {SECTIONS[active].label}
        </p>
      </div>

      {/* rail */}
      <ul className="flex flex-col items-end gap-3">
        {SECTIONS.map((s, i) => (
          <li key={s.anchor} className="flex items-center gap-3">
            <span
              className={
                i === active
                  ? "text-[10px] tracking-[0.25em] text-cyan font-[family-name:var(--font-geist-mono)] transition-opacity duration-300"
                  : "text-[10px] tracking-[0.25em] text-foreground/25 font-[family-name:var(--font-geist-mono)] transition-opacity duration-300"
              }
            >
              {s.index} {s.label}
            </span>
            <a
              href={`#${s.anchor}`}
              aria-label={`Jump to ${s.label}`}
              className="pointer-events-auto relative flex items-center"
            >
              <span
                className={
                  i === active
                    ? "block h-px w-8 bg-cyan shadow-[0_0_8px_rgba(84,217,232,0.8)] transition-all duration-500"
                    : "block h-px w-4 bg-foreground/15 hover:bg-foreground/40 transition-all duration-300"
                }
              />
              <span
                className={
                  i === active
                    ? "ml-1 block w-2 h-2 rounded-full bg-cyan shadow-[0_0_10px_rgba(84,217,232,0.9)]"
                    : "ml-1 block w-1.5 h-1.5 rounded-full bg-foreground/20"
                }
              />
            </a>
          </li>
        ))}
      </ul>

      {/* percentage */}
      <p className="text-[10px] tracking-[0.3em] text-foreground/30 font-[family-name:var(--font-geist-mono)] mt-1 tabular-nums">
        {String(pct).padStart(3, "0")}%
      </p>
    </nav>
  );
}
