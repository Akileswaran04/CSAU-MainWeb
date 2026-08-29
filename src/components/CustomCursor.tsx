"use client";

import { useEffect, useRef } from "react";

/* ============================================================================
   CUSTOM CURSOR — Sculptural Tactility version.
   Desktop-only (fine pointers + no reduced-motion).
   States driven by [data-cursor] attribute:
     • default              → small dot
     • hovering link/button → larger ring
     • data-cursor="TEXT"   → ring with label
   Falls back to the native cursor everywhere else and never blocks clicks.
   ========================================================================== */

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine =
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const label = labelRef.current!;

    let mx = -100;
    let my = -100;
    let rx = -100;
    let ry = -100;
    let raf = 0;
    let visible = false;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
      const target = (e.target as HTMLElement | null)?.closest(
        "[data-cursor], a, button"
      ) as HTMLElement | null;
      if (target) {
        const text = target.getAttribute("data-cursor");
        ring.dataset.state = text ? "label" : "ring";
        label.textContent = text ?? "";
      } else {
        ring.dataset.state = "";
        label.textContent = "";
      }
    };

    const onLeave = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    document.documentElement.classList.add("csau-custom-cursor");

    function frame() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("csau-custom-cursor");
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="fixed top-0 left-0 z-[100] pointer-events-none w-1.5 h-1.5 rounded-full opacity-0 transition-opacity duration-200 hidden [@media(pointer:fine)]:block"
        style={{ background: "var(--primary)" }}
      />
      <div
        ref={ringRef}
        aria-hidden
        data-state=""
        className="fixed top-0 left-0 z-[99] pointer-events-none opacity-0 transition-opacity duration-200 hidden [@media(pointer:fine)]:flex items-center justify-center rounded-full w-10 h-10 data-[state=ring]:w-14 data-[state=ring]:h-14 data-[state=label]:w-20 data-[state=label]:h-20 transition-[width,height] duration-300"
        style={{
          border: "1.5px solid var(--outline)",
          background: "rgba(251,248,255,0.5)",
          backdropFilter: "blur(8px)",
        }}
      >
        <span
          ref={labelRef}
          className="text-[9px] tracking-widest font-semibold"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "var(--primary)",
          }}
        />
      </div>
    </>
  );
}
