"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import type { TeamMember } from "@/app/team/members";
import { initials } from "@/app/team/members";

/* ============================================================
   TEAM CAROUSEL — Full-circle 3D ring of featured members.

   • Every member stands at the SAME height, evenly spaced
     around a complete circle — member i sits at i · (360°/N).
     With an even N the card directly behind the front card is
     exactly 180° opposite it.
   • Scrolling spins the whole ring; each member swings around
     to the front where it faces the camera dead-centre.
   • A vertical "CSAU" wordmark (Ethnocentric brand font)
     stands at the centre of the ring, inside the carousel.
   • role / name / dept / links crossfade beside the front panel.

   White stage — matches the site's light theme.
   ============================================================ */

interface TeamCarouselProps {
  members: TeamMember[];
}

/* Draw a member portrait (photo or initials card) onto a canvas →
   dataURL texture. Keeps photos crisp, avoids WebGL/CORS tainting. */
function portraitDataURL(member: TeamMember, size = 512): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size * 1.25; // portrait 4:5
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve("");

    const paintFallback = () => {
      const g = ctx.createLinearGradient(0, 0, size, size * 1.25);
      g.addColorStop(0, "#e8e7f1");
      g.addColorStop(1, "#dad9e3");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size * 1.25);
      ctx.fillStyle = "rgba(26,27,34,.28)";
      ctx.font = `700 ${size * 0.24}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initials(member.name), size / 2, size * 0.62);
      resolve(canvas.toDataURL("image/png"));
    };

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const s = Math.min(img.width, img.height);
        const sx = (img.width - s) / 2;
        const sy = (img.height - s) / 2;
        ctx.filter = "grayscale(.35) contrast(1.05)";
        ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
        ctx.filter = "none";
        // soft fade into the panel base
        ctx.fillStyle = "rgba(255,255,255,.18)";
        ctx.fillRect(0, size * 0.82, size, size * 0.43);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        paintFallback();
      }
    };
    img.onerror = paintFallback;
    img.src = member.photo;
  });
}

/* Vertical "CSAU" wordmark drawn onto a tall canvas → dataURL texture.
   Letters stack top-to-bottom so the brand stands vertically. */
function totemDataURL(size = 384): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size * 3;
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve("");

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const letters = "CSAU".split("");
      const lh = size * 0.6;
      const startY = (canvas.height - letters.length * lh) / 2 + lh * 0.78;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `900 ${lh * 0.86}px 'Ethnocentric', 'Sector034', 'Plus Jakarta Sans', sans-serif`;
      letters.forEach((ch, i) => {
        const y = startY + i * lh;
        ctx.save();
        ctx.shadowColor = "rgba(39,39,42,0.4)";
        ctx.shadowBlur = 22;
        ctx.lineWidth = Math.max(3, size * 0.022);
        ctx.strokeStyle = "rgba(26,27,34,0.95)";
        ctx.strokeText(ch, canvas.width / 2, y);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(251,248,255,0.14)";
        ctx.fillText(ch, canvas.width / 2, y);
        ctx.restore();
      });
      resolve(canvas.toDataURL("image/png"));
    };

    /* Make sure the brand font is loaded before drawing */
    if (document.fonts && typeof document.fonts.load === "function") {
      const f = document.fonts.load(`900 ${size}px 'Ethnocentric'`).catch(() => {});
      Promise.all([document.fonts.ready, f]).then(draw).catch(draw);
    } else {
      draw();
    }
  });
}

export default function TeamCarousel({ members }: TeamCarouselProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [textureUrls, setTextureUrls] = useState<string[]>([]);
  const [active, setActive] = useState(0);

  const N = members.length;

  /* Pre-generate the portrait textures (client-side canvases) */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const urls = await Promise.all(members.map((m) => portraitDataURL(m)));
      if (!cancelled) setTextureUrls(urls);
    })();
    return () => {
      cancelled = true;
    };
  }, [members]);

  const sceneReady = textureUrls.length === N && N > 0;

  /* Three.js scene — once textures are ready */
  useEffect(() => {
    if (!sceneReady) return;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      if (disposed || !stage || !canvas) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
      });
      renderer.setClearColor(0x000000, 0);
      if ("outputColorSpace" in THREE) renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
      camera.position.set(0, 0, 12.5);

      /* ── Geometry ────────────────────────────────────────────
         FULL CIRCLE: N members at the SAME height, evenly spaced
         around the axis — member i sits at i · (2π/N). With an
         even N the card behind the front card is exactly 180°
         opposite it.                                            */
      const RADIUS = 4.6; // ring already spans ~95% of the stage width
      const STEP_ANG = (2 * Math.PI) / N;
      const ARC = STEP_ANG * 0.88; // cards wrap wide, nearly touching
      const PANEL_H = 4.9; // front card fills ~90% of the visible height

      /* Ring group — rotates around Y; no vertical travel */
      const carousel = new THREE.Group();
      scene.add(carousel);

      /* Curved slice of the cylinder (registered Gallery look) */
      const geometry = new THREE.CylinderGeometry(
        RADIUS,
        RADIUS,
        PANEL_H,
        64,
        1,
        true,
        -ARC / 2,
        ARC
      );

      const makeTexture = (url: string) => {
        const t = new THREE.TextureLoader().load(url);
        if ("colorSpace" in THREE) t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        return t;
      };

      const textures = textureUrls.map(makeTexture);
      const materials = textures.map(
        (map) =>
          new THREE.MeshBasicMaterial({
            map,
            side: THREE.DoubleSide,
            toneMapped: false,
            transparent: true,
            opacity: 1,
          })
      );

      /* One panel per member, flat around the circle */
      const panels: THREE.Mesh[] = [];
      materials.forEach((material, i) => {
        const pivot = new THREE.Group();
        const panel = new THREE.Mesh(geometry, material.clone());
        pivot.rotation.y = i * STEP_ANG;
        pivot.add(panel);
        carousel.add(pivot);
        panels.push(panel);
      });

      /* ── Vertical CSAU wordmark at the centre of the ring ── */
      let totem: THREE.Mesh | null = null;
      let totemTex: THREE.Texture | null = null;
      let totemGeo: THREE.PlaneGeometry | null = null;
      const totemUrl = await totemDataURL();
      if (!disposed && totemUrl) {
        totemTex = makeTexture(totemUrl);
        totemGeo = new THREE.PlaneGeometry(2.4, 7.2);
        const totemMat = new THREE.MeshBasicMaterial({
          map: totemTex,
          transparent: true,
          depthWrite: true,
          toneMapped: false,
        });
        totem = new THREE.Mesh(totemGeo, totemMat);
        scene.add(totem);
      }

      /* ── Auto-rotate ────────────────────────────────────────
         After the user stops scrolling, the ring slowly spins on
         its own until the next scroll. Skipped for users who
         prefer reduced motion.                               */
      const AUTO_DELAY = 2500; // ms of no scrolling before rotating
      const AUTO_SPEED = 0.3; // members per second (~33s per lap)
      const HOLD_MS = 2000; // freeze the front image on each name change
      const HOLD_RAMP = 400; // ms to ease speed down/up around the freeze
      let idleTimer: ReturnType<typeof setTimeout> | undefined;
      let autoRotate = false;
      let holdStart = 0; // when the 2s freeze began
      let holdUntil = 0; // when the freeze ends
      let prevIdx = 0;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      /* Scroll progress → rotate the ring */
      let s = 0; // continuous member index
      let targetS = 0;
      const onScroll = () => {
        const holder = holderRef.current;
        if (!holder) return;
        const rect = holder.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        if (total <= 0) return;
        const p = Math.min(1, Math.max(0, -rect.top / total));
        targetS = p * (N - 1);

        /* stop auto-rotate and re-arm the idle timer */
        autoRotate = false;
        holdUntil = 0; // user takes over — cancel any name-change freeze
        if (idleTimer) clearTimeout(idleTimer);
        if (!reducedMotion) {
          idleTimer = setTimeout(() => {
            /* only spin when the stage is actually on screen */
            const r = holderRef.current?.getBoundingClientRect();
            const inView = !!r && r.bottom > 0 && r.top < window.innerHeight;
            if (inView) autoRotate = true;
          }, AUTO_DELAY);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      /* Pause auto-rotate while the pointer hovers the stage
         (only tracked on devices that actually support hover) */
      let hovering = false;
      const onPointerEnter = () => {
        hovering = true;
      };
      const onPointerLeave = () => {
        hovering = false;
      };
      if (window.matchMedia("(hover: hover)").matches) {
        stage.addEventListener("pointerenter", onPointerEnter);
        stage.addEventListener("pointerleave", onPointerLeave);
      }

      /* Pointer parallax — subtle, adds depth while scrolling */
      let px = 0;
      let py = 0;
      let tx = 0;
      let ty = 0;
      const onPointer = (e: PointerEvent) => {
        tx = (e.clientX / window.innerWidth - 0.5) * 1.4;
        ty = (e.clientY / window.innerHeight - 0.5) * 1.2;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      const resize = () => {
        const rect = stage.getBoundingClientRect();
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(stage);
      resize();

      let raf = 0;
      let lastT = performance.now();
      const animFrame = () => {
        if (disposed) return;
        const now = performance.now();
        const dt = Math.min(0.1, (now - lastT) / 1000); // clamp pauses
        lastT = now;

        /* auto-rotate advances the target; the speed factor ramps
           smoothly down to 0 before the freeze and back up after,
           so the card decelerates into the front position and
           accelerates away — no sudden changes in motion */
        let speed = 1;
        if (now < holdUntil) {
          const rampIn = Math.min(1, (now - holdStart) / HOLD_RAMP);
          const rampOut = Math.min(1, (holdUntil - now) / HOLD_RAMP);
          speed = Math.min(rampIn, rampOut);
        }
        if (autoRotate && !hovering) {
          targetS = (targetS + AUTO_SPEED * speed * dt) % N;
        }

        /* ease toward the target, taking the shortest way around
           so the loop wraps smoothly from member N-1 back to 0.
           The factor is normalised to frame time so the glide
           feels identical at 60 / 120 / 144 Hz. */
        let diff = targetS - s;
        diff -= N * Math.round(diff / N);
        const ease = 1 - Math.pow(1 - 0.09, dt * 60);
        s += diff * ease;
        s = ((s % N) + N) % N;
        const idx = Math.min(N - 1, Math.max(0, Math.round(s)));
        setActive(idx);

        /* when auto-rotate brings a new member to the front, glide the
           ring to dead-centre on it and freeze for 2s so the image
           and the dust fade have time to breathe */
        if (idx !== prevIdx) {
          prevIdx = idx;
          if (autoRotate) {
            targetS = idx;
            holdStart = now;
            holdUntil = now + HOLD_MS;
          }
        }

        /* ring rotation: member `s` swings to the front (angle 0) */
        carousel.rotation.y = -s * STEP_ANG;

        /* gentle camera parallax */
        px += (tx - px) * 0.04;
        py += (ty - py) * 0.04;
        camera.position.x = px * 0.7;
        camera.position.y = py * 0.5;
        camera.position.z = 12.5;
        camera.lookAt(0, 0, 0);

        /* centre wordmark always faces the camera */
        if (totem) totem.quaternion.copy(camera.quaternion);

        /* per-panel focus: opacity + size follow the card's angle,
           so cards glide in and out of the front smoothly — no
           hard switches when the active member changes */
        panels.forEach((panel, i) => {
          const mat = panel.material as THREE.MeshBasicMaterial;
          const ang = (i - s) * STEP_ANG; // world angle vs camera front
          const frontness = Math.max(0, Math.cos(ang)) ** 1.4;
          mat.opacity = Math.pow(frontness, 1.2);
          const scl = 0.8 + 0.26 * frontness;
          panel.scale.set(scl, scl, 1);
          panel.renderOrder = i === idx ? 10 : 0;
        });

        renderer.render(scene, camera);
        raf = requestAnimationFrame(animFrame);
      };
      raf = requestAnimationFrame(animFrame);

      cleanup = () => {
        disposed = true;
        cancelAnimationFrame(raf);
        if (idleTimer) clearTimeout(idleTimer);
        if (window.matchMedia("(hover: hover)").matches) {
          stage.removeEventListener("pointerenter", onPointerEnter);
          stage.removeEventListener("pointerleave", onPointerLeave);
        }
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pointermove", onPointer);
        ro.disconnect();
        carousel.clear();
        if (totem) scene.remove(totem);
        geometry.dispose();
        materials.forEach((m) => m.dispose());
        textures.forEach((t) => t.dispose());
        totemTex?.dispose();
        totemGeo?.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneReady, textureUrls]);

  const member = members[Math.min(active, N - 1)];

  /* Dust motes — deterministic per member (avoids SSR/hydration
     mismatches) and re-seeded whenever the active member changes,
     so the fade pattern shifts slightly with each name change */
  const dustMotes = useMemo(() => {
    const seeded = (a: number, b: number) => {
      const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: 14 }, (_, i) => ({
      left: 18 + seeded(active + 1, i) * 64,
      top: 22 + seeded(active + 2, i) * 56,
      size: 2 + seeded(active + 3, i) * 4,
      delay: seeded(active + 4, i) * 0.45,
      dur: 0.9 + seeded(active + 5, i) * 0.7,
    }));
  }, [active]);

  return (
    <div
      ref={holderRef}
      data-team-carousel
      style={{ height: `${N * 70}vh`, position: "relative" }}
    >
      <div
        ref={stageRef}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          background:
            "radial-gradient(ellipse at 50% 40%, #ffffff 0%, #f4f2fd 55%, #eeedf7 100%)",
        }}
      >
        {/* paper-grid backdrop */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(26,27,34,.1) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
            pointerEvents: "none",
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />

        {/* text overlay — desktop: role left / details right, vertically
            centred; mobile: pinned to the top corners of the photo */}
        <div className="tc-stage-overlay">
          {/* Left: role (designation) */}
          <div className="tc-role-block">
            <div
              data-wall-counter
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: ".3em",
                color: "var(--outline)",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
            </div>
            <div
              key={member.name + "-role"}
              style={{
                fontFamily: "'Ethnocentric', 'Sector034', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(15px, 2vw, 24px)",
                letterSpacing: ".06em",
                lineHeight: 1.2,
                color: "var(--on-surface)",
                animation: "tw-fade-in .6s ease both",
              }}
            >
              {member.role.toUpperCase()}
            </div>
          </div>

          {/* Right: name, dept, links (details) */}
          <div className="tc-detail-block">
            <div
              key={member.name + "-name"}
              style={{
                fontFamily: "'CremeEspana', 'Syne', sans-serif",
                fontSize: "clamp(30px, 4.4vw, 58px)",
                lineHeight: 1.05,
                color: "var(--on-surface)",
                animation: "tw-fade-in .6s ease .05s both",
              }}
            >
              {member.name}
            </div>
            <div
              key={member.name + "-dept"}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "var(--on-surface-variant)",
                marginTop: 12,
                animation: "tw-fade-in .6s ease .15s both",
              }}
            >
              {member.dept}
            </div>
            <div
              className="tc-links-row"
              style={{ animation: "tw-fade-in .6s ease .25s both" }}
            >
              {["X / TWITTER", "LINKEDIN", "GITHUB"].map((label) => (
                <span
                  key={label}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8.5,
                    letterSpacing: ".14em",
                    color: "var(--on-surface-variant)",
                    border: "1px solid var(--outline-variant)",
                    borderRadius: 999,
                    padding: "6px 12px",
                    whiteSpace: "nowrap",
                    transition: "color .3s ease, border-color .3s ease",
                    pointerEvents: "auto",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--on-surface)";
                    e.currentTarget.style.borderColor = "var(--primary-container)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--on-surface-variant)";
                    e.currentTarget.style.borderColor = "var(--outline-variant)";
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* dust motes — re-triggered on every member change */}
        <div key={`dust-${active}`} className="tc-dust" aria-hidden>
          {dustMotes.map((m, i) => (
            <span
              key={i}
              className="tc-dust-mote"
              style={{
                left: `${m.left}%`,
                top: `${m.top}%`,
                width: m.size,
                height: m.size,
                animationDelay: `${m.delay}s`,
                animationDuration: `${m.dur}s`,
              }}
            />
          ))}
        </div>

        {/* progress bar */}
        <div
          style={{
            position: "absolute",
            left: "5vw",
            right: "5vw",
            bottom: 34,
            height: 2,
            background: "rgba(26,27,34,.14)",
            borderRadius: 2,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: `${((active + 1) / N) * 100}%`,
              height: "100%",
              background: "var(--on-surface)",
              transition: "width .5s ease",
            }}
          />
        </div>

        <style>{`
          @keyframes tw-fade-in {
            from { opacity: 0; transform: translateY(14px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .tc-stage-overlay {
            position: absolute;
            inset: 0;
            pointer-events: none;
            padding: 9vh 5vw;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
          }
          .tc-role-block { width: 24%; min-width: 150px; }
          .tc-detail-block { width: 30%; min-width: 220px; text-align: right; }
          .tc-links-row {
            display: flex;
            gap: 10px;
            margin-top: 18px;
            justify-content: flex-end;
          }
          /* Mobile — the front card fills the screen, so pin the
             designation to the top-left of the photo and the
             details to the top-right of the photo */
          @media (max-width: 640px) {
            .tc-stage-overlay { padding: 0; display: block; }
            .tc-role-block {
              position: absolute;
              top: 7vh;
              left: 4vw;
              width: auto;
              min-width: 0;
            }
            .tc-detail-block {
              position: absolute;
              top: 7vh;
              right: 4vw;
              width: auto;
              min-width: 0;
            }
            .tc-role-block, .tc-detail-block {
              text-shadow: 0 1px 2px rgba(251,248,255,.85),
                           0 0 14px rgba(251,248,255,.55);
            }
            .tc-links-row { flex-wrap: wrap; }
          }
          /* Dust motes — drift upward and fade in/out on member change */
          .tc-dust {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 6;
          }
          .tc-dust-mote {
            position: absolute;
            border-radius: 50%;
            background: rgba(39, 39, 42, 0.55);
            box-shadow: 0 0 6px rgba(39, 39, 42, 0.25);
            opacity: 0;
            animation: tc-dust-float 1.2s ease-out forwards;
          }
          @keyframes tc-dust-float {
            0% { opacity: 0; transform: translateY(8px) scale(0.5); }
            20% { opacity: 0.75; }
            100% { opacity: 0; transform: translateY(-30px) scale(1.15); }
          }
        `}</style>
      </div>
    </div>
  );
}