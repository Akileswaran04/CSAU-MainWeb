import * as THREE from "three";

/* Runtime colour tokens for the three.js scenes. Every colour is read
   from the CSS custom properties, so re-theming the site re-paints the
   scenes with no code changes. The fallbacks are the documented values. */

export interface SpaceTokens {
  void: THREE.Color;
  hull: THREE.Color;
  hullLit: THREE.Color;
  dim: THREE.Color;
  starlight: THREE.Color;
  signal: THREE.Color;
  lit: THREE.Color;
}

export function readTokens(): SpaceTokens {
  const cs =
    typeof document !== "undefined" ? getComputedStyle(document.documentElement) : null;
  const c = (name: string, fallback: string) =>
    new THREE.Color(cs?.getPropertyValue(name).trim() || fallback);
  return {
    void: c("--void-950", "#0a0a0b"),
    hull: c("--hull-900", "#17181c"),
    hullLit: c("--hull-700", "#2f3238"),
    dim: c("--dim-300", "#a3a8b0"),
    starlight: c("--starlight", "#f6f1e4"),
    signal: c("--signal", "#ee5b3a"),
    lit: c("--lit", "#f0b73a"),
  };
}

export const isMobileViewport = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 820px)").matches;

export const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Small seeded RNG so scattered geometry is stable between renders. */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
