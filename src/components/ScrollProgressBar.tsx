"use client";

import { useEffect, useRef } from "react";

/* Scroll progress bar at the very top of the viewport */
export default function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let raf = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = `scaleX(${pct})`;
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={barRef}
      className="fixed top-0 left-0 w-full h-[2px] z-[9999] origin-left"
      style={{
        background: "linear-gradient(90deg, #00f0ff, #ff00aa)",
        boxShadow: "0 0 10px #00f0ff, 0 0 20px #ff00aa",
        transform: "scaleX(0)",
      }}
      aria-hidden
    />
  );
}
