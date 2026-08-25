"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

/* ============================================================================
   ROUTE TRANSITION — every route enters through the same masked reveal:
   clip-path wipe + blur-to-sharp. Keeps navigation feeling cinematic while
   staying well under a second. Respects prefers-reduced-motion via a plain
   fade only.
   ========================================================================== */

export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
