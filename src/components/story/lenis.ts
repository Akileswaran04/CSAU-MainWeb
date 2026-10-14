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

/** the smooth-scroll instance, once the home has made it (the story's autoplay drives it) */
export const getLenis = () => instance;

/** ends the story's autoplay (a locked programmatic scroll), handing the scroll back where it is */
export function endAutoplay() {
  if (!instance?.isLocked) return;
  instance.stop(); // stopping resets it: the animation and the lock
  instance.start();
}

export function scrollToY(y: number) {
  endAutoplay(); // a jump (the rail) ends the story's autoplay
  if (instance) instance.scrollTo(y, { duration: 1.4, userData: { jump: true } }); // jump: the autoplay leaves it be
  else window.scrollTo({ top: y, behavior: "smooth" });
}
