"use client";

import type { ReactNode } from "react";

/* ============================================================================
   ROUTE TEMPLATE - lightweight wrapper for route-level concerns.

   Page-to-page loading is handled by RouteLoadGate in layout.tsx
   (loader + staggered entrance for nav-bar / CTA navigation).
   This template is kept minimal for any route-level setup.
   ========================================================================== */

export default function Template({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
