import type Lenis from "lenis";
import { setScrollDriver } from "@/lib/scrollLock";

/* Tiny holder so any component can scroll programmatically
   without fighting the smooth-scroll instance. The instance is also
   registered with the scroll lock so overlays can stop it. */
let instance: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  instance = l;
  setScrollDriver(l);
}

export function scrollToY(y: number) {
  if (instance) instance.scrollTo(y, { duration: 1.4 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}
