/* ============================================================
   SCROLL LOCK - one reference-counted lock for the whole site.

   The boot gate, the route loader and the nav overlay all need
   the page to stop scrolling for a while, and they overlap. Each
   caller takes a lock and returns its own release function; the
   page unlocks only when the last lock is released. Nothing
   writes body.style.overflow: the lock is a class on <html>
   (see .scroll-locked in globals.css), plus stop()/start() on the
   smooth-scroll driver, since programmatic scrolling ignores
   overflow: hidden.
   ============================================================ */

const CLASS = "scroll-locked";
let count = 0;

export interface ScrollDriver {
  stop(): void;
  start(): void;
}
let driver: ScrollDriver | null = null;

/** Register the smooth-scroll driver (Lenis) so it obeys the lock. */
export function setScrollDriver(d: ScrollDriver | null) {
  driver = d;
  if (d && count > 0) d.stop();
}

/** Take a lock. Returns an idempotent release function. */
export function lockScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  count += 1;
  if (count === 1) {
    document.documentElement.classList.add(CLASS);
    driver?.stop();
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    count = Math.max(0, count - 1);
    if (count === 0) {
      document.documentElement.classList.remove(CLASS);
      driver?.start();
    }
  };
}
