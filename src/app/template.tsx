"use client";

import type { ReactNode } from "react";

/* ============================================================================
   ROUTE TEMPLATE — lightweight wrapper for route-level concerns.
   
   Page transitions are handled by RouteTransition in layout.tsx.
   This template is kept minimal for any route-level setup.
   ========================================================================== */

export default function Template({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
