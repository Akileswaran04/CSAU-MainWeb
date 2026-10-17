"use client";

import VaultScene from "./VaultScene";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { prefersReducedMotion, startCanvasLoop } from "./space/space2d";

/* only the warp loader flies the ship, so only it loads three.js (already cached from the story) */
const WarpShip = dynamic(() => import("./WarpShip"), { ssr: false });

/* ============================================================
   LOADING OVERLAY - the jump between pages

   Travelling from one route to another: a ship corridor facing a
   round vault door that opens with the real loading of the next page
   (progress, from RouteLoadGate), one segment at a time so each is
   seen, onto Earth (VaultScene, all compositor animations, so it
   never stutters).

   When the destination has its elements the overlay is told to end
   (phase === "ending"): READY, the view pushes in through the door
   and the whole thing fades over ~1.2s.

   From the story's end (warp) it is the story's warp tunnel instead,
   drawn in 2D: blue-white streaks rushing past in a dark shell
   toward the light at its end, then the story's own 3D warp over it
   (WarpShip: the armoured ship, the same camera and tunnel clock, the
   cockpit's canopy when it came from the cockpit). It is readied unseen
   as the story's warp starts, so it takes over with no seam, and flies
   on until the page is in; the charge is one thin bright line.

   Reduced motion: one still frame of the field, no movement.
   ============================================================ */

const SEGMENTS = 12;
const SEGMENT_MS = 80; // the bar lights at most one segment per this, so a fast page still shows it filling

export default function LoadingOverlay({
  phase,
  // href: the page being loaded (the vault scene does not name it)
  progress = 0,
  warp,
  standby = false,
}: {
  phase: "loading" | "ending";
  href?: string;
  /** how much of the next page has loaded, 0..1 */
  progress?: number;
  /** the story's end sent it ("warp", or "cockpit" from the cockpit): its warp instead of the jump scene */
  warp?: string;
  /** readied unseen while the story's warp runs (RouteLoadGate warpPrep): built, drawn once, then idle */
  standby?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speed = useRef(1);
  const [charge, setCharge] = useState(0);

  useEffect(() => {
    speed.current = phase === "ending" ? 0.1 : 1;
  }, [phase]);

  /* charge bar: it climbs toward the real progress one segment at a time, and completes when it ends */
  const target = phase === "ending" ? SEGMENTS : Math.floor(progress * SEGMENTS);
  useEffect(() => {
    if (charge >= target) return;
    const id = window.setTimeout(() => setCharge((c) => c + 1), SEGMENT_MS);
    return () => clearTimeout(id);
  }, [charge, target]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!warp) return;
    const reduced = prefersReducedMotion();
    let s = 12345;
    const rnd = () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
    return startCanvasLoop(canvas, warpTunnel(), { still: reduced });

    /* the story's WarpTunnel (SpaceScene) in 2D: same colours (blue to white as a streak nears), same dark shell
       and glow at the end; it is handed over at full speed, so there is no ramp */
    function warpTunnel() {
      const n = window.innerWidth < 760 ? 260 : 620;
      const streaks = Array.from({ length: n }, () => ({ a: rnd() * Math.PI * 2, z: rnd(), r: 0.35 + rnd() * 0.65 }));
      return (ctx: CanvasRenderingContext2D, W: number, H: number, _t: number, dt: number) => {
        const cx = W / 2;
        const cy = H * (warp === "cockpit" ? 0.56 : 0.5); // the seat looks a little up, so the way ahead sits low
        const R = Math.hypot(W, H) * 0.5;
        ctx.fillStyle = "rgb(0, 3, 8)";
        ctx.fillRect(0, 0, W, H);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.45);
        g.addColorStop(0, `rgba(191, 230, 255, ${0.35 + 0.4 * speed.current})`);
        g.addColorStop(1, "rgba(191, 230, 255, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        const v = reduced ? 0 : 0.15 + 0.85 * speed.current;
        for (const s of streaks) {
          s.z += dt * v * 0.9;
          if (s.z > 1) {
            s.z -= 1;
            s.a = rnd() * Math.PI * 2;
          }
          /* perspective: far streaks crowd the centre, near ones fly out past the edges */
          const head = (s.r * 0.08) / Math.max(0.04, 1.02 - s.z);
          const tail = (s.r * 0.08) / Math.max(0.04, 1.02 - Math.max(0, s.z - 0.04 - 0.12 * v));
          if (tail * R > R * 1.3) continue;
          const k = Math.min(1, s.z * 1.4); // brightness: 0 far, 1 near
          const c = Math.cos(s.a);
          const sn = Math.sin(s.a);
          ctx.strokeStyle = `rgba(${64 + 191 * k * k | 0}, ${179 + 76 * k * k | 0}, 255, ${(0.35 + 0.65 * k) * k})`;
          ctx.lineWidth = 0.5 + k * 1.8;
          ctx.beginPath();
          ctx.moveTo(cx + c * tail * R, cy + sn * tail * R);
          ctx.lineTo(cx + c * head * R, cy + sn * head * R);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
      };
    }
  }, [warp]);

  const ending = phase === "ending";
  const shownCharge = charge;

  return (
    <div
      className="rl-root"
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 650,
        background: warp ? "rgb(0, 3, 8)" : "var(--space-black)",
        opacity: ending ? 0 : 1,
        transition: ending ? "opacity 1.1s ease .2s" : "none",
        overflow: "hidden",
      }}
    >
      <style>{`
        .rl-line { position: absolute; left: 50%; bottom: max(36px, env(safe-area-inset-bottom)); width: min(280px, 56vw); height: 3px;
          transform: translateX(-50%); background: rgba(191, 230, 255, .32); border-radius: 2px; overflow: hidden; pointer-events: none; }
        .rl-line i { display: block; height: 100%; background: #e8f6ff; box-shadow: 0 0 8px #7cc8ff, 0 0 2px #fff;
          transform-origin: left; transition: transform .25s ease; }
      `}</style>

      {warp && <canvas ref={canvasRef} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />}

      {warp ? (
        <>
          <WarpShip view={warp} ending={ending} live={!standby} />
          {warp === "cockpit" && (
            <div className="ck-frame" aria-hidden>
              <svg className="ck-canopy" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 0H100V4.5C76 1.6 24 1.6 0 4.5Z" />
                <path d="M13.5 3.4L16.5 3.1L4.2 100H0.4Z" />
                <path d="M86.5 3.4L83.5 3.1L95.8 100H99.6Z" />
              </svg>
            </div>
          )}
          <div className="rl-line" aria-hidden>
            <i style={{ transform: `scaleX(${shownCharge / SEGMENTS})` }} />
          </div>
        </>
      ) : (
        <VaultScene progress={shownCharge / SEGMENTS} ending={ending} />
      )}

      <span className="sr-only">Loading the next page</span>
    </div>
  );
}
