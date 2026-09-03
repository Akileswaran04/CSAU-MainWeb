"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type * as THREE from "three";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ============================================================
   LASER NAV — fullscreen navigation over a Three.js glass field.

   Unified white theme (matches the rest of the site):
     • surface (white) background
     • translucent glass columns floating at different heights —
       one column per nav link, rising like a 3D colonnade
     • the field gently tilts with the mouse (parallax)
     • hovering a nav link lifts its column toward the text
     • nav text sits CENTRED on the white stage
   ============================================================ */

const NAV_LINKS = [
  { label: "HOME", href: "/" },
  { label: "EVENTS", href: "/events" },
  { label: "BLOG", href: "/blog" },
  { label: "CRACKIT", href: "/crackit" },
  { label: "TEAM", href: "/team" },
  { label: "QUICK CODE", href: "/quick-code" },
];

export default function LaserNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{ hover: (index: number | null) => void } | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll while the overlay is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleClose = useCallback(() => setOpen(false), []);

  /* ── Three.js glass-column scene (runs only while open) ── */
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      if (disposed || !canvas) return;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setClearColor(0x000000, 0);
      if ("outputColorSpace" in THREE) renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
      camera.position.set(0, 0, 12);

      /* Lights — soft key + rim so the glass reads on white */
      const ambient = new THREE.AmbientLight(0xffffff, 0.55);
      scene.add(ambient);
      const key = new THREE.DirectionalLight(0xffffff, 0.9);
      key.position.set(4, 8, 6);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xd9d4ff, 0.5);
      rim.position.set(-6, -2, -4);
      scene.add(rim);

      const group = new THREE.Group();
      scene.add(group);

      /* One translucent column per nav link — staggered heights */
      const sizes = [2.6, 3.8, 5.4, 6.6, 4.9, 3.2]; // different heights
      const xs = [-5.6, -3.35, -1.15, 1.15, 3.35, 5.6];
      const zs = [0.8, -1.4, 0.4, -1.1, 0.6, -1.6]; // depth stagger
      const holders: THREE.Group[] = [];

      NAV_LINKS.forEach((_, i) => {
        const w = 1.05;
        const h = sizes[i];
        const d = 1.05;
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.22,
          roughness: 0.12,
          metalness: 0.02,
          depthWrite: false,
          side: THREE.DoubleSide,
          clearcoat: 1,
          clearcoatRoughness: 0.2,
        });
        const mesh = new THREE.Mesh(geo, mat);

        const edgeMat = new THREE.LineBasicMaterial({
          color: 0x1a1b22,
          transparent: true,
          opacity: 0.4,
        });
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);

        // slim inner rod — dark, reads as the column's "core"
        const rodMat = new THREE.MeshBasicMaterial({
          color: 0x1a1b22,
          transparent: true,
          opacity: 0.18,
        });
        const rodGeo = new THREE.BoxGeometry(w * 0.12, h, d * 0.12);
        const rod = new THREE.Mesh(rodGeo, rodMat);

        const holder = new THREE.Group();
        holder.add(mesh, edges, rod);
        holder.position.x = xs[i];
        holder.position.z = zs[i];
        holders.push(holder);

        group.add(holder);
      });

      let frame = 0;
      let hoverIdx: number | null = null;
      let lift = 0;

      sceneRef.current = {
        hover: (index: number | null) => {
          hoverIdx = index;
        },
      };

      /* pointer parallax */
      let px = 0;
      let py = 0;
      let tx = 0;
      let ty = 0;
      const onPointer = (e: PointerEvent) => {
        tx = (e.clientX / window.innerWidth - 0.5) * 2;
        ty = (e.clientY / window.innerHeight - 0.5) * 1.6;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.floor(w * dpr));
        canvas.height = Math.max(1, Math.floor(h * dpr));
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener("resize", resize);

      const tick = () => {
        if (disposed) return;

        /* ease hover lift */
        lift += ((hoverIdx !== null ? 1 : 0) - lift) * 0.08;

        const t = performance.now() * 0.001;
        holders.forEach((holder, i) => {
          const base = -4.6 + (sizes[i] - 2.6) * 0.3 + (hoverIdx === i ? 1.1 : 0) * lift;
          const bob = Math.sin(t * 0.7 + i * 1.3) * 0.08;
          holder.position.y = base + bob;
          holder.position.z = zs[i] + Math.sin(t * 0.4 + i) * 0.06;
          const mesh = holder.children[0] as THREE.Mesh;
          const glow = hoverIdx === i ? 1 : 0.5;
          (mesh.material as THREE.MeshPhysicalMaterial).opacity =
            0.22 + glow * 0.12 * lift;
        });

        /* mouse tilt of the whole field */
        px += (tx - px) * 0.05;
        py += (ty - py) * 0.05;
        group.rotation.y = px * 0.06;
        group.rotation.x = -py * 0.04;
        group.position.y = py * 0.2;

        renderer.render(scene, camera);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);

      cleanup = () => {
        disposed = true;
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onPointer);
        group.traverse((obj) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const m = (obj as any).material;
          if (m) {
            if (Array.isArray(m)) m.forEach((x: THREE.Material) => x.dispose());
            else m.dispose();
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const g = (obj as any).geometry;
          if (g) g.dispose();
        });
        scene.clear();
        renderer.dispose();
        sceneRef.current = null;
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [open]);

  const handleLinkHover = useCallback((index: number) => {
    sceneRef.current?.hover(index);
  }, []);

  const handleLinkLeave = useCallback(() => {
    sceneRef.current?.hover(null);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <style>{`
        /* ── Floating button (light theme) ── */
        .ln-toggle {
          position: fixed;
          top: 22px;
          left: 22px;
          z-index: 400;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 9px 18px 9px 16px;
          border-radius: 999px;
          border: 1px solid var(--outline-variant, #c7c6cb);
          background: rgba(255,255,255,.72);
          color: var(--on-surface, #1a1b22);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 6px 20px rgba(0,0,0,.06);
          transition: background-color .3s ease, border-color .3s ease, box-shadow .3s ease;
          user-select: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .ln-toggle:hover {
          background: rgba(255,255,255,.95);
          border-color: var(--outline, #77767b);
          box-shadow: 0 2px 8px rgba(0,0,0,.06), 0 10px 28px rgba(0,0,0,.1);
        }
        .ln-toggle .ln-lines {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ln-toggle .ln-lines span {
          display: block;
          width: 16px;
          height: 1.5px;
          background: currentColor;
          border-radius: 2px;
          transition: width .3s cubic-bezier(.2,.8,.2,1);
        }
        .ln-toggle:hover .ln-lines span:nth-child(1) { width: 20px; }
        .ln-toggle:hover .ln-lines span:nth-child(3) { width: 12px; }
        .ln-toggle .ln-word {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .22em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* ── Fullscreen glass overlay (surface) ── */
        .ln-overlay {
          position: fixed;
          inset: 0;
          z-index: 500;
          background: var(--surface);
          opacity: 0;
          pointer-events: none;
          transition: opacity .45s cubic-bezier(.2,.8,.2,1);
          overflow: hidden;
        }
        .ln-overlay.open { opacity: 1; pointer-events: auto; }
        .ln-canvas {
          position: absolute;
          inset: 0;
          display: block;
        }
        .ln-close {
          position: absolute;
          top: 20px;
          right: 22px;
          z-index: 2;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid var(--outline-variant, #c7c6cb);
          background: rgba(255,255,255,.7);
          color: var(--on-surface, #1a1b22);
          font-size: 17px;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: background-color .25s ease, transform .25s ease;
        }
        .ln-close:hover {
          background: var(--surface-container, #eeedf7);
          transform: rotate(90deg);
        }
        .ln-list {
          position: relative;
          z-index: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(8px, 2.2vh, 22px);
          padding: 8vh 6vw 8vh 12vw;
        }
        .ln-link {
          position: relative;
          text-decoration: none;
          color: rgba(26,27,34,.85);
          font-family: 'Ethnocentric', 'Sector034', sans-serif;
          font-weight: 900;
          font-size: clamp(30px, 6vw, 68px);
          letter-spacing: .06em;
          line-height: 1.12;
          padding: 2px 8px;
          text-align: center;
          transition: color .3s ease, transform .3s ease;
        }
        .ln-link::after {
          content: "";
          position: absolute;
          left: 50%;
          transform: translateX(-50%) scaleX(0);
          bottom: -6px;
          width: 70%;
          height: 2px;
          border-radius: 2px;
          background: var(--on-surface, #1a1b22);
          opacity: 0;
          transition: transform .34s cubic-bezier(.2,.8,.2,1), opacity .25s ease;
          box-shadow: 0 0 14px rgba(26,27,34,.4);
        }
        .ln-link:hover, .ln-link.is-active { color: var(--on-surface); }
        .ln-link:hover { transform: translateX(10px); }
        .ln-link:hover::after, .ln-link.is-active::after {
          transform: translateX(-50%) scaleX(1);
          opacity: 1;
        }
        @media (max-width: 640px) {
          .ln-list { padding: 10vh 6vw 10vh 14vw; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ln-overlay { transition: none; }
          .ln-link::after { transition: none; }
          .ln-link:hover { transform: none; }
        }
      `}</style>

      {/* Floating button */}
      <button
        type="button"
        className="ln-toggle"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="ln-lines" aria-hidden>
          <span />
          <span />
          <span />
        </span>
        <span className="ln-word">NAV</span>
      </button>

      {/* Fullscreen glass navigation */}
      <div className={`ln-overlay${open ? " open" : ""}`}>
        <canvas ref={canvasRef} className="ln-canvas" aria-hidden />

        <button
          type="button"
          className="ln-close"
          aria-label="Close navigation"
          onClick={handleClose}
        >
          ✕
        </button>

        <nav aria-label="Primary" className="ln-list">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className={`ln-link${isActive(link.href) ? " is-active" : ""}`}
              aria-current={isActive(link.href) ? "page" : undefined}
              onClick={handleClose}
              onMouseEnter={() => handleLinkHover(i)}
              onMouseLeave={handleLinkLeave}
              style={{
                opacity: open ? 1 : 0,
                transform: open ? "none" : "translateY(18px)",
                transition: `opacity .5s ease ${0.05 * i + 0.12}s, transform .5s ease ${0.05 * i + 0.12}s, color .3s ease`,
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}