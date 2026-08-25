"use client";

import { useEffect, useState } from "react";

/**
 * True only after the Preloader begins its exit ("gate open").
 * Listens for the csau:entered event broadcast by Preloader, and also
 * honours the window.__csauEntered flag if the event fired before mount.
 */
export function useEntered() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as Window & { __csauEntered?: boolean };
    if (w.__csauEntered) {
      setReady(true);
      return;
    }
    const on = () => {
      w.__csauEntered = true;
      setReady(true);
    };
    window.addEventListener("csau:entered", on);
    return () => window.removeEventListener("csau:entered", on);
  }, []);
  return ready;
}
