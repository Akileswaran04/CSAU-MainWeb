/* ============================================================
   NAV STATE - what the rest of the page needs to know about the
   fullscreen menu, so it can stop doing work nobody can see.

     html[data-nav-open]     the menu is open or opening or closing:
                             the page's own animations pause, the star
                             canvas and the story's 3D scene stop drawing
     html[data-nav-covered]  the menu is fully open and opaque: the
                             page underneath is not painted at all

   Listeners get a csau:nav-state event with { open, covered }.
   ============================================================ */

export interface NavState {
  open: boolean;
  covered: boolean;
}

const state: NavState = { open: false, covered: false };

export function setNavState(next: Partial<NavState>) {
  if (typeof document === "undefined") return;
  Object.assign(state, next);
  const root = document.documentElement;
  if (state.open) root.dataset.navOpen = "true";
  else delete root.dataset.navOpen;
  if (state.covered) root.dataset.navCovered = "true";
  else delete root.dataset.navCovered;
  window.dispatchEvent(new CustomEvent<NavState>("csau:nav-state", { detail: { ...state } }));
}
