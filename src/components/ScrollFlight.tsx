"use client";

import { useEffect, useRef } from "react";

/* ==========================================================================
   SCROLL FLIGHT — intense cyberpunk scroll engine.
   Camera flies forward through a neon particle field with a city silhouette
   on the horizon, hyperspace streaks, and dramatic colour shifts per section.
   ========================================================================== */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function lingerEase(x: number, L: number) {
  x = clamp(x); L = clamp(L);
  const c = x - 0.5;
  return (1 - L) * x + L * (4 * c * c * c + 0.5);
}

/* cyberpunk accent palette */
const ACCENTS: [number, number, number][] = [
  [0, 240, 255],    // cyan — the gate
  [0, 240, 255],    // origin
  [0, 240, 255],    // domains
  [255, 0, 170],    // archive — magenta
  [255, 230, 0],    // journey — neon yellow
  [57, 255, 20],    // people — neon green
  [255, 0, 170],    // portal — magenta
];

function accentAt(f: number): [number, number, number] {
  const n = ACCENTS.length - 1;
  const x = clamp(f) * n;
  const i = Math.min(Math.floor(x), n - 1);
  const t = x - i;
  const a = ACCENTS[i]; const b = ACCENTS[i + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

interface Star { x: number; y: number; z: number }

export default function ScrollFlight() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let W = 0, H = 0, dpr = 1;

    const N_STARS = 350;
    const SPREAD = 1600;
    const DEPTH = 10000;
    const FOV = 520;
    const SECTIONS = 7;
    const LINGER = 0.35;

    const stars: Star[] = [];
    function spawn(): Star {
      return {
        x: (Math.random() - 0.5) * SPREAD,
        y: (Math.random() - 0.5) * SPREAD,
        z: Math.random() * (DEPTH + 4000),
      };
    }

    let camZ = 0, prevCamZ = 0;
    let smoothScroll = 0, targetScroll = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* city silhouette buildings (static data, drawn at horizon) */
    interface Building { x: number; w: number; h: number }
    const cityBuildings: Building[] = [];
    for (let i = 0; i < 40; i++) {
      cityBuildings.push({
        x: i * 50 - 10,
        w: 20 + Math.random() * 30,
        h: 30 + Math.random() * 120,
      });
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
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
      smoothScroll += (targetScroll - smoothScroll) * 0.06;

      const n = SECTIONS;
      const segF = smoothScroll * n;
      const i = Math.min(Math.floor(segF), n - 1);
      const local = lingerEase(segF - i, LINGER);
      const eased = (i + local) / n;

      prevCamZ = camZ;
      camZ = eased * DEPTH;
      const dz = camZ - prevCamZ;
      const speed = clamp(Math.abs(dz) / 30);

      const [r, g, b] = accentAt(smoothScroll);

      ctx.clearRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;

      /* ---- stars ---- */
      for (const s of stars) {
        s.z -= dz;
        if (s.z < camZ + 60) {
          s.z += DEPTH + Math.random() * 2000;
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

        const size = clamp(k * 2.5, 0.3, 4);
        const alpha = clamp((1 - rel / (DEPTH * 0.9)) * 0.95, 0.05, 0.95);

        if (speed > 0.05 && !reduceMotion) {
          /* hyperspace streak */
          const relPrev = rel + dz;
          const kPrev = FOV / Math.max(relPrev, 40);
          const streakLen = speed * 3;
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * Math.min(speed * 2, 1)})`;
          ctx.lineWidth = size * 0.8;
          ctx.beginPath();
          ctx.moveTo(cx + s.x * kPrev, cy + s.y * kPrev);
          ctx.lineTo(sx + (sx - (cx + s.x * kPrev)) * streakLen, sy + (sy - (cy + s.y * kPrev)) * streakLen);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(${Math.min(r + 100, 255)},${Math.min(g + 80, 255)},255,${alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* ---- horizon wireframe grid ---- */
      const horizonY = cy + 200;
      const gap = 400;
      const off = ((camZ % gap) + gap) % gap;
      ctx.lineWidth = 1;
      for (let row = 0; row < 16; row++) {
        const z = row * gap + gap - off;
        if (z < 80) continue;
        const y = horizonY + (FOV * 140) / z;
        if (y > H + 20) continue;
        const a = clamp((1 - row / 16) * 0.25, 0, 0.25);
        ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      for (let cIdx = -8; cIdx <= 8; cIdx++) {
        const wx = cIdx * 280;
        const xNear = cx + wx * (FOV / 450);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.1)`;
        ctx.beginPath();
        ctx.moveTo(cx + wx * (FOV / 6000), horizonY);
        ctx.lineTo(xNear, horizonY + (FOV * 140) / 450);
        ctx.stroke();
      }

      /* ---- city silhouette at horizon ---- */
      const cityAlpha = 0.15 + speed * 0.15;
      ctx.fillStyle = `rgba(${r},${g},${b},${cityAlpha * 0.3})`;
      ctx.strokeStyle = `rgba(${r},${g},${b},${cityAlpha * 0.6})`;
      ctx.lineWidth = 0.8;
      for (const bld of cityBuildings) {
        const bx = (bld.x / 2000) * W + W * 0.05;
        const bw = (bld.w / 2000) * W;
        const bh = bld.h * (0.8 + speed * 0.4);
        const by = horizonY - bh;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeRect(bx, by, bw, bh);
        /* neon window dots */
        for (let wy = by + 8; wy < horizonY - 5; wy += 10) {
          for (let wx = bx + 4; wx < bx + bw - 3; wx += 7) {
            if (Math.random() > 0.6) {
              ctx.fillStyle = `rgba(${r},${g},${b},${0.3 + Math.random() * 0.3})`;
              ctx.fillRect(wx, wy, 2, 3);
            }
          }
        }
      }

      /* ---- ambient glow ---- */
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.6);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.06)`);
      grad.addColorStop(1, "rgba(10,10,18,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      /* ---- vignette ---- */
      const vig = ctx.createRadialGradient(cx, cy, W * 0.3, cx, cy, W * 0.8);
      vig.addColorStop(0, "rgba(10,10,18,0)");
      vig.addColorStop(1, "rgba(10,10,18,0.4)");
      ctx.fillStyle = vig;
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
