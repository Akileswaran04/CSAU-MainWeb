import type Lenis from "lenis";

/* Tiny holder so any component can scroll programmatically
   without fighting the smooth-scroll instance. */
let instance: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  instance = l;
}

export function scrollToY(y: number) {
  if (instance) instance.scrollTo(y, { duration: 1.4 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}
