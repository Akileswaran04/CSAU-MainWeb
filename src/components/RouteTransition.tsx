"use client";

import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ============================================================
   ROUTE TRANSITION — Sculptural Tactility version.
   Brief overlay on navigation between routes.
   ============================================================ */

function Overlay({ pathname }: { pathname: string }) {
  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ background: "var(--surface)" }}
        initial={{ opacity: 0.95 }}
        animate={{ opacity: 0.98 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />

      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            border: "1px solid var(--outline-variant)",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          initial={{ width: 20 + i * 15, height: 20 + i * 15, opacity: 0.3 - i * 0.06, scale: 0.3 }}
          animate={{ width: 100 + i * 60, height: 100 + i * 60, opacity: [0, 0.25 - i * 0.05, 0], scale: [0.3, 1, 1.2] }}
          transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}

      <motion.div
        className="absolute w-3 h-3 rounded-full"
        style={{ background: "var(--primary)" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2.5, 0], opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </motion.div>
  );
}

export default function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const initialPath = useRef(pathname);
  const isInitial = pathname === initialPath.current;

  return (
    <>
      {!isInitial && (
        <AnimatePresence mode="wait">
          <Overlay key={`overlay-${pathname}`} pathname={pathname} />
        </AnimatePresence>
      )}

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
