"use client";

import { useEffect, useRef } from "react";

/* ============================================================================
   SCROLL FLIGHT — a fixed canvas behind the whole page.
   Techniques ported from the "scroll-world" scrub engine (oso95/scroll-world):
     • scroll position scrubs a camera flying forward through a particle field
     • linger easing settles the camera mid-scene and moves quicker at seams
     • accent colour shifts per section (cyan → magenta → orange)
     • atmosphere: drifting particles + horizon grid, all in pure JS
   ========================================================================== */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/** linger easing from the scrub engine — f(0)=0, f(1)=1, settles mid-way */
function lingerEase(x: number, L: number) {
  x = clamp(x);
  L = clamp(L);
  const c = x - 0.5;
  return (1 - L) * x + L * (4 * c * c * c + 0.5);
}

/* accent stops across the page journey */
const ACCENTS: [number, number, number][] = [
  [84, 217, 232], // cyan    — the gate
  [84, 217, 232], // origin
  [84, 217, 232], // domains
  [215, 124, 203], // archive — sakura
  [215, 124, 203], // journey
  [240, 163, 91], // people  — warm
  [240, 163, 91], // portal
];
function accentAt(f: number): [number, number, number] {
  const n = ACCENTS.length - 1;
  const x = clamp(f) * n;
  const i = Math.min(Math.floor(x), n - 1);
  const t = x - i;
  const a = ACCENTS[i];
  const b = ACCENTS[i + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

interface Star {
  x: number; // world x (units)
  y: number;
  z: number; // depth ahead of camera
}

export default function ScrollFlight() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let W = 0;
    let H = 0;
    let dpr = 1;

    /* ---- config ---------------------------------------------------------- */
    const N_STARS = 260;
    const SPREAD = 1400; // world units wide/tall
    const DEPTH = 9000; // total flight length in world units
    const FOV = 520;
    const SECTIONS = 7;
    const LINGER = 0.35;

    const stars: Star[] = [];
    function spawn(s?: Star): Star {
      const st =
        s ??
        ({ x: 0, y: 0, z: 0 } as Star);
      st.x = (Math.random() - 0.5) * SPREAD;
      st.y = (Math.random() - 0.5) * SPREAD;
      st.z = DEPTH + Math.random() * 4000;
      return st;
    }

    let camZ = 0;
    let prevCamZ = 0;
    let smoothScroll = 0;
    let targetScroll = 0;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < N_STARS; i++) stars.push(spawn());

    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      targetScroll = max > 0 ? window.scrollY / max : 0;
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    function frame() {
      /* smoothed scroll → camera position with linger easing per section */
      smoothScroll += (targetScroll - smoothScroll) * 0.08;

      /* remap global progress through per-section linger so the camera
         dwells mid-section and moves quicker between sections */
      const n = SECTIONS;
      const segF = smoothScroll * n;
      const i = Math.min(Math.floor(segF), n - 1);
      const local = lingerEase(segF - i, LINGER);
      const eased = (i + local) / n;

      prevCamZ = camZ;
      camZ = eased * DEPTH;
      const dz = camZ - prevCamZ;
      const speed = clamp(Math.abs(dz) / 40); // 0..1 streak intensity

      const [r, g, b] = accentAt(smoothScroll);

      ctx.clearRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;

      /* ---- recede / recycle stars & draw ---- */
      for (const s of stars) {
        s.z -= dz;
        if (s.z < camZ + 60) {
          s.z += DEPTH + Math.random() * 1500;
          s.x = (Math.random() - 0.5) * SPREAD;
          s.y = (Math.random() - 0.5) * SPREAD;
        } else if (s.z > camZ + DEPTH + 6000) {
          s.z -= DEPTH + 2000;
        }

        const rel = s.z - camZ;
        if (rel < 40) continue;
        const k = FOV / rel;
        const sx = cx + s.x * k;
        const sy = cy + s.y * k;
        if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) continue;

        const size = clamp(k * 2.2, 0.3, 3.4);
        const alpha = clamp((1 - rel / (DEPTH * 0.9)) * 0.9, 0.04, 0.9);

        /* streak when scrolling fast — hyperspace feel */
        if (speed > 0.06 && !reduceMotion) {
          const relPrev = rel + dz;
          const kPrev = FOV / Math.max(relPrev, 40);
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * speed})`;
          ctx.lineWidth = size;
          ctx.beginPath();
          ctx.moveTo(cx + s.x * kPrev, cy + s.y * kPrev);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(${Math.min(r + 120, 255)},${Math.min(g + 100, 255)},255,${alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* ---- horizon wireframe grid flying beneath ---- */
      if (!reduceMotion || true) {
        const horizonY = cy + 190;
        const gap = 420;
        const off = ((camZ % gap) + gap) % gap;
        ctx.lineWidth = 1;
        for (let row = 0; row < 14; row++) {
          const z = row * gap + gap - off;
          const rel = z;
          if (rel < 80) continue;
          const y = horizonY + (FOV * 130) / rel;
          if (y > H + 20) continue;
          const a = clamp((1 - row / 14) * 0.22, 0, 0.22);
          ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
        /* converging verticals */
        for (let cIdx = -7; cIdx <= 7; cIdx++) {
          const wx = cIdx * 300;
          const xNear = cx + wx * (FOV / 500);
          const a = 0.12;
          ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
          ctx.beginPath();
          ctx.moveTo(cx + wx * (FOV / 6000), horizonY);
          ctx.lineTo(xNear, horizonY + (FOV * 130) / 500);
          ctx.stroke();
        }
      }

      /* ---- ambient glow that follows the active accent ---- */
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.55);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.05)`);
      grad.addColorStop(1, "rgba(9,7,20,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
