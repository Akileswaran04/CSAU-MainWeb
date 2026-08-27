"use client";

import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ============================================================================
   ROUTE TRANSITION — client wrapper placed in layout.tsx.
   
   Shows a brief hyperspace tunnel overlay ONLY on navigation between routes,
   not on the initial page load.
   ========================================================================== */

type SectionTheme = {
  color: string;
  label: string;
};

const THEMES: Record<string, SectionTheme> = {
  "/": { color: "rgba(0,240,255,0.4)", label: "RETURNING TO REALM" },
  "/about": { color: "rgba(0,240,255,0.4)", label: "ENTERING THE CORE" },
  "/domains": { color: "rgba(255,0,170,0.4)", label: "OPENING TRAINING GROUNDS" },
  "/events": { color: "rgba(0,240,255,0.35)", label: "ACCESSING DATA VAULT" },
  "/journey": { color: "rgba(255,230,0,0.35)", label: "SYNCING JOURNEY" },
  "/team": { color: "rgba(57,255,20,0.35)", label: "CONNECTING TO COMMAND" },
  "/join": { color: "rgba(255,0,170,0.4)", label: "OPENING PORTAL" },
};

const DEFAULT_THEME: SectionTheme = { color: "rgba(0,240,255,0.3)", label: "TRAVELING" };

function Overlay({ pathname }: { pathname: string }) {
  const theme = THEMES[pathname] ?? DEFAULT_THEME;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <motion.div
        className="absolute inset-0 bg-[#090714]"
        initial={{ opacity: 0.9 }}
        animate={{ opacity: 0.95 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />

      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{ borderColor: theme.color, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
          initial={{ width: 20 + i * 15, height: 20 + i * 15, opacity: 0.8 - i * 0.12, scale: 0.3 }}
          animate={{ width: 120 + i * 80, height: 120 + i * 80, opacity: [0, 0.7 - i * 0.1, 0], scale: [0.3, 1, 1.2] }}
          transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}

      <motion.div
        className="absolute w-3 h-3 rounded-full"
        style={{ background: theme.color, boxShadow: `0 0 30px ${theme.color}, 0 0 60px ${theme.color}` }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2.5, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      <motion.div
        className="absolute bottom-[15%] text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <p
          className="text-[10px] tracking-[0.4em] uppercase font-[family-name:var(--font-geist-mono)]"
          style={{ color: theme.color.replace(/[\d.]+\)$/, "0.7)") }}
        >
          {theme.label}
        </p>
        <div className="mt-3 w-32 h-px bg-foreground/10 overflow-hidden rounded-full mx-auto">
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-cyan to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 0.6, ease: "easeInOut", repeat: 1 }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---- Main export ---- */

export default function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const initialPath = useRef(pathname);
  const isInitial = pathname === initialPath.current;

  return (
    <>
      {/* Overlay only on navigation, not initial load */}
      {!isInitial && (
        <AnimatePresence mode="wait">
          <Overlay key={`overlay-${pathname}`} pathname={pathname} />
        </AnimatePresence>
      )}

      {/* Page content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
