"use client";

import { useEffect, useRef } from "react";
import { drawPings, prefersReducedMotion, readPalette, type Ping } from "./space/space2d";

/* ============================================================
   SPACE BACKDROP - the star field every page floats on.

   One fixed 2D canvas behind all content: sparse real stars at
   three sizes on three depth layers, drifting slowly with scroll
   and pointer (parallax), and an occasional radar ping. No
   nebula, no gradients. Pages keep their own backgrounds
   transparent so it shows through.
   ============================================================ */

interface Star {
  x: number; // 0..1
  y: number; // 0..1
  z: number; // depth layer 0..2 - farther layers are smaller and slower
  ph: number; // twinkle phase
}

function makeStars(n: number): Star[] {
  let s = 20240819;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return Array.from({ length: n }, () => ({ x: rnd(), y: rnd(), z: Math.floor(rnd() * 3), ph: rnd() * 6.28 }));
}

const SIZE = [1, 1.4, 2];
const DEPTH = [0.012, 0.03, 0.065]; // px of drift per px scrolled
const ALPHA = [0.35, 0.55, 0.8];

export default function SpaceBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const reduced = prefersReducedMotion();
    const mobile = window.matchMedia("(max-width: 820px)").matches;
    const pal = readPalette();
    const stars = makeStars(mobile ? 70 : 130);
    const pings: Ping[] = [];
    const pointer = { x: 0, y: 0 };
    let W = 0;
    let H = 0;
    let raf = 0;
    let last = 0;
    let t = 0;
    let nextPing = 3;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) paint(0);
    };

    const paint = (time: number) => {
      ctx.fillStyle = pal.void;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = pal.starlight;
      const sy = window.scrollY;
      for (const st of stars) {
        const px = reduced ? 0 : pointer.x * DEPTH[st.z] * 60;
        const x = st.x * W + px;
        let y = st.y * H - sy * DEPTH[st.z];
        y = ((y % H) + H) % H;
        const tw = reduced ? 1 : 0.8 + 0.2 * Math.sin(time * 0.6 + st.ph);
        ctx.globalAlpha = ALPHA[st.z] * tw;
        ctx.fillRect(x, y, SIZE[st.z], SIZE[st.z]);
      }
      ctx.globalAlpha = 1;
      if (pings.length) drawPings(ctx, pings, time, pal.dim, 0.35);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      if (now - last < 40) return; // ~25fps is plenty for slow stars
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      t += dt;
      if (t >= nextPing) {
        nextPing = t + 6 + Math.random() * 6;
        pings.push({ x: Math.random() * W, y: Math.random() * H, born: t, max: 90 + Math.random() * 110, life: 4, strength: 1 });
      }
      paint(t);
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    resize();
    window.addEventListener("resize", resize);
    if (!reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      raf = requestAnimationFrame(frame);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
        background: "var(--space-black)",
      }}
    />
  );
}
