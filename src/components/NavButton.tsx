"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ============================================================
   NAV BUTTON — Fixed top-left navigation trigger.
   Hidden on the home page (/).
   Visible on About and Team pages with same nav links.
   ============================================================ */

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Team", href: "/team" },
  { label: "About", href: "/?view=description" },
];

export default function NavButton() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Hide on home page (after all hooks)
  if (pathname === "/") return null;

  return (
    <div className="fixed top-4 left-4 z-[100]" style={{ pointerEvents: "none" }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="flex items-center gap-2 cursor-pointer"
        style={{
          pointerEvents: "auto",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: open ? "var(--on-primary)" : "var(--on-surface)",
          background: open ? "var(--primary)" : "var(--surface-container-lowest)",
          border: "1px solid var(--outline-variant)",
          padding: "10px 18px",
          borderRadius: 999,
          boxShadow: open
            ? "0 2px 8px rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)"
            : "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)",
          transition: "all 0.25s ease",
        }}
      >
        <span className="flex flex-col justify-center items-center" style={{ width: 14, height: 14 }}>
          <span style={{ display: "block", width: open ? 12 : 14, height: 2, background: "currentColor", borderRadius: 2, transition: "all 0.25s ease", transform: open ? "rotate(45deg) translateY(0)" : "none" }} />
          <span style={{ display: "block", width: open ? 0 : 10, height: 2, background: "currentColor", borderRadius: 2, marginTop: open ? 0 : 3, transition: "all 0.2s ease", opacity: open ? 0 : 1 }} />
          <span style={{ display: "block", width: open ? 12 : 14, height: 2, background: "currentColor", borderRadius: 2, marginTop: open ? -2 : 3, transition: "all 0.25s ease", transform: open ? "rotate(-45deg) translateY(0)" : "none" }} />
        </span>
        <span style={{ marginLeft: 4 }}>NAV</span>
      </button>

      <div
        ref={menuRef}
        className="absolute"
        style={{
          top: "calc(100% + 8px)",
          left: 0,
          minWidth: 180,
          background: "var(--surface-container-lowest)",
          border: "1px solid var(--outline-variant)",
          borderRadius: "1rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.02)",
          padding: "8px",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.95)",
          pointerEvents: open ? "auto" : "none",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className="block"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--on-surface)",
              textDecoration: "none",
              padding: "10px 16px",
              borderRadius: "0.75rem",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-container)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
