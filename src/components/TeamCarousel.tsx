"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import type { TeamMember } from "@/app/team/members";
import { initials } from "@/app/team/members";

/* ============================================================
   TEAM CAROUSEL - Full-circle 3D ring of featured members.

   • Every member stands at the SAME height, evenly spaced
     around a complete circle - member i sits at i · (360°/N).
     With an even N the card directly behind the front card is
     exactly 180° opposite it.
   • Scrolling spins the whole ring; each member swings around
     to the front where it faces the camera dead-centre.
   • A vertical "CSAU" wordmark (Ethnocentric brand font)
     stands at the centre of the ring, inside the carousel.
   • role / name / dept / links crossfade beside the front panel.

   Transparent stage - floats over the shared star-field backdrop.
   ============================================================ */

interface TeamCarouselProps {
  members: TeamMember[];
}

/* Draw a member portrait (photo or initials card) onto a canvas →
   dataURL texture. Keeps photos crisp, avoids WebGL/CORS tainting. */
/* Canvas 2D cannot resolve CSS variables, so read the tokens once and
   fall back to the documented literal if they are unavailable. */
function tokenColor(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** Resolved JetBrains Mono family (next/font hashes the name), for canvas. */
function monoFamily(): string {
  return tokenColor("--font-jetbrains", "'JetBrains Mono'");
}

/** Token colour at a given alpha, e.g. ink at 28%. */
function tokenAlpha(name: string, alpha: number, fallback: string): string {
  const hex = tokenColor(name, fallback).replace("#", "");
  if (hex.length !== 6) return fallback;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

/* A satellite seen from above - painted once and placed in orbit around
   the ring. Hull, panels and hairlines come from the site tokens. */
function drawSatelliteCanvas(): HTMLCanvasElement {
  const W = 512;
  const H = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const star = tokenColor("--starlight", "#f6f1e4");
  const dim = tokenColor("--dim-300", "#a3a8b0");
  const hull = tokenColor("--hull-900", "#17181c");
  const lit = tokenColor("--lit", "#f0b73a");
  const cx = W / 2;
  const cy = H / 2;
  g.lineWidth = 2;
  g.strokeStyle = dim;
  g.fillStyle = hull;
  // solar panels with a hairline grid
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? cx + 70 : cx - 70 - 170;
    g.beginPath();
    g.rect(x0, cy - 62, 170, 124);
    g.fill();
    g.stroke();
    g.beginPath();
    for (let k = 1; k < 5; k++) {
      g.moveTo(x0 + (170 * k) / 5, cy - 62);
      g.lineTo(x0 + (170 * k) / 5, cy + 62);
    }
    for (let k = 1; k < 3; k++) {
      g.moveTo(x0, cy - 62 + (124 * k) / 3);
      g.lineTo(x0 + 170, cy - 62 + (124 * k) / 3);
    }
    g.stroke();
    g.beginPath();
    g.moveTo(s > 0 ? cx + 40 : cx - 40, cy);
    g.lineTo(s > 0 ? cx + 70 : cx - 70, cy);
    g.stroke();
  }
  // body
  g.strokeStyle = star;
  g.beginPath();
  g.rect(cx - 44, cy - 50, 88, 100);
  g.fill();
  g.stroke();
  // dish
  g.strokeStyle = dim;
  g.beginPath();
  g.arc(cx, cy, 22, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = lit;
  g.beginPath();
  g.arc(cx + 30, cy - 34, 5, 0, Math.PI * 2);
  g.fill();
  return c;
}

/* Printed-card detail painted on every portrait: scale texture, corner
   brackets, a vermilion seal, the running number and a vertical role. */
function paintOrnament(
  ctx: CanvasRenderingContext2D,
  size: number,
  member: TeamMember,
  index: number,
  total: number
) {
  const W = size;
  const H = size * 1.25;
  const foam = tokenColor("--starlight", "#f6f1e4");
  const signal = tokenColor("--signal", "#ee5b3a");
  const gold = tokenColor("--lit", "#f0b73a");

  // faint survey grid
  ctx.save();
  ctx.strokeStyle = tokenAlpha("--starlight", 0.05, "#f6f1e4");
  ctx.lineWidth = 1;
  const gr = size * 0.1;
  ctx.beginPath();
  for (let x = gr; x < W; x += gr) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = gr; y < H; y += gr) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
  ctx.restore();

  // corner brackets
  const m = size * 0.045;
  const L = size * 0.09;
  ctx.strokeStyle = signal;
  ctx.lineWidth = Math.max(3, size * 0.006);
  ctx.lineCap = "square";
  const bracket = (x: number, y: number, sx: number, sy: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + sy * L);
    ctx.lineTo(x, y);
    ctx.lineTo(x + sx * L, y);
    ctx.stroke();
  };
  bracket(m, m, 1, 1);
  bracket(W - m, m, -1, 1);
  bracket(m, H - m, 1, -1);
  bracket(W - m, H - m, -1, -1);

  // vermilion seal (hanko) with initials
  const sealS = size * 0.17;
  ctx.save();
  ctx.translate(W - m - sealS * 0.75, H * 0.31);
  ctx.rotate(0.09);
  ctx.fillStyle = signal;
  ctx.fillRect(-sealS / 2, -sealS / 2, sealS, sealS);
  ctx.strokeStyle = tokenAlpha("--void-950", 0.55, "#0a0a0b");
  ctx.lineWidth = 2;
  ctx.strokeRect(-sealS / 2 + 5, -sealS / 2 + 5, sealS - 10, sealS - 10);
  ctx.fillStyle = tokenColor("--void-950", "#0a0a0b");
  ctx.font = `800 ${sealS * 0.42}px ${monoFamily()}, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials(member.name), 0, 2);
  ctx.restore();

  // running number, bottom-left
  const num = String(index + 1).padStart(2, "0");
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = foam;
  ctx.font = `800 ${size * 0.19}px ${monoFamily()}, monospace`;
  ctx.fillText(num, m + size * 0.02, H - m - size * 0.06);
  ctx.fillStyle = gold;
  ctx.fillRect(m + size * 0.02, H - m - size * 0.06 - size * 0.2, size * 0.07, 3);
  ctx.fillStyle = tokenAlpha("--starlight", 0.6, "#f6f1e4");
  ctx.font = `500 ${size * 0.03}px 'JetBrains Mono', monospace`;
  ctx.fillText(`/ ${String(total).padStart(2, "0")}`, m + size * 0.02 + size * 0.27, H - m - size * 0.06);

  // vertical role along the right edge
  ctx.save();
  ctx.translate(W - m - size * 0.02, H - m - size * 0.08);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = tokenAlpha("--starlight", 0.78, "#f6f1e4");
  ctx.font = `500 ${size * 0.03}px 'JetBrains Mono', monospace`;
  ctx.textAlign = "left";
  const role = member.role.toUpperCase().split("").join("\u200A");
  ctx.fillText(role, 0, 0);
  ctx.restore();
}

function portraitDataURL(member: TeamMember, index: number, total: number, size = 512): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size * 1.25; // portrait 4:5
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve("");

    /* hairline starlight frame so the panel reads against the void */
    const paintFrame = () => {
      ctx.strokeStyle = tokenAlpha("--starlight", 0.35, "#f6f1e4");
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, size - 3, size * 1.25 - 3);
    };
    const finish = () => {
      paintOrnament(ctx, size, member, index, total);
      paintFrame();
      resolve(canvas.toDataURL("image/png"));
    };

    const paintFallback = () => {
      const g = ctx.createLinearGradient(0, 0, size, size * 1.25);
      g.addColorStop(0, tokenColor("--surface-container-high", "#1c1d21"));
      g.addColorStop(1, tokenColor("--hull-900", "#17181c"));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size * 1.25);
      ctx.fillStyle = tokenAlpha("--starlight", 0.7, "#f6f1e4");
      ctx.font = `700 ${size * 0.24}px ${monoFamily()}, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initials(member.name), size / 2, size * 0.5);
      finish();
    };

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const s = Math.min(img.width, img.height);
        const sx = (img.width - s) / 2;
        const sy = (img.height - s) / 2;
        ctx.fillStyle = tokenColor("--void-950", "#0a0a0b");
        ctx.fillRect(0, 0, size, size * 1.25);
        ctx.filter = "grayscale(1) sepia(0.4) hue-rotate(-8deg) saturate(1.1) contrast(1.04)";
        ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
        ctx.filter = "none";
        // void tint so the photo sits in the dark, then a fade into the panel base
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = tokenAlpha("--dim-300", 0.55, "#a3a8b0");
        ctx.fillRect(0, 0, size, size);
        ctx.globalCompositeOperation = "source-over";
        const fade = ctx.createLinearGradient(0, size * 0.62, 0, size * 1.25);
        fade.addColorStop(0, tokenAlpha("--void-950", 0, "#0a0a0b"));
        fade.addColorStop(0.55, tokenAlpha("--void-950", 0.85, "#0a0a0b"));
        fade.addColorStop(1, tokenAlpha("--void-950", 0.96, "#0a0a0b"));
        ctx.fillStyle = fade;
        ctx.fillRect(0, size * 0.62, size, size * 0.63);
        finish();
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
      ctx.font = `900 ${lh * 0.86}px 'Ethnocentric', ${monoFamily()}, monospace`;
      letters.forEach((ch, i) => {
        const y = startY + i * lh;
        ctx.save();
        // Outline-only wordmark - no glow, no shadow bloom.
        ctx.lineWidth = Math.max(3, size * 0.022);
        ctx.strokeStyle = tokenAlpha("--signal", 0.95, "#c72f16");
        ctx.strokeText(ch, canvas.width / 2, y);
        ctx.fillStyle = tokenAlpha("--lit", 0.16, "#f0b73a");
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
      const urls = await Promise.all(members.map((m, i) => portraitDataURL(m, i, members.length)));
      if (!cancelled) setTextureUrls(urls);
    })();
    return () => {
      cancelled = true;
    };
  }, [members]);

  const sceneReady = textureUrls.length === N && N > 0;

  /* Three.js scene - once textures are ready */
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
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
      camera.position.set(0, 0, 12.5);

      /* ── Geometry ────────────────────────────────────────────
         FULL CIRCLE: N members at the SAME height, evenly spaced
         around the axis - member i sits at i · (2π/N). With an
         even N the card behind the front card is exactly 180°
         opposite it.                                            */
      const RADIUS = 4.6; // ring already spans ~95% of the stage width
      const STEP_ANG = (2 * Math.PI) / N;
      const ARC = STEP_ANG * 0.88; // cards wrap wide, nearly touching
      const PANEL_H = 4.9; // front card fills ~90% of the visible height

      /* Ring group - rotates around Y; no vertical travel */
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
        t.colorSpace = THREE.SRGBColorSpace;
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

      /* ── Orbit floor: breathing range rings, a ping on every name
         change, and two satellites circling the ring ─────────── */
      const floorY = -PANEL_H / 2 - 0.4;
      const ringGeo = new THREE.RingGeometry(0.985, 1, 160);
      const floorRings: THREE.Mesh[] = [];
      const ringColor = new THREE.Color(tokenColor("--dim-300", "#a3a8b0"));
      [RADIUS + 0.5, RADIUS + 1.5, RADIUS + 2.8, RADIUS + 4.2].forEach((r) => {
        const m = new THREE.Mesh(
          ringGeo,
          new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide })
        );
        m.rotation.x = -Math.PI / 2;
        m.position.y = floorY;
        m.scale.setScalar(r);
        m.userData.r = r;
        scene.add(m);
        floorRings.push(m);
      });
      const pulse = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({ color: new THREE.Color(tokenColor("--signal", "#ee5b3a")), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
      );
      pulse.rotation.x = -Math.PI / 2;
      pulse.position.y = floorY;
      pulse.visible = false;
      scene.add(pulse);
      let pingStart = -1e9;

      const satTex = new THREE.CanvasTexture(drawSatelliteCanvas());
      satTex.colorSpace = THREE.SRGBColorSpace;
      const satMat = new THREE.MeshBasicMaterial({ map: satTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
      const satellites = [
        { r: RADIUS + 0.9, speed: 0.12, dir: 1, ph: 0.6, sc: 1 },
        { r: RADIUS + 2.2, speed: 0.08, dir: -1, ph: 3.4, sc: 0.78 },
      ].map((cfg) => {
        const geo = new THREE.PlaneGeometry(2.2, 1.1, 1, 1);
                const group = new THREE.Group();
        const mesh = new THREE.Mesh(geo, satMat);
        mesh.rotation.x = -Math.PI / 2;
        group.add(mesh);
        group.scale.setScalar(cfg.sc);
        scene.add(group);
        return { ...cfg, geo, group };
      });

      const updateFloor = (t: number, calm: boolean) => {
        floorRings.forEach((m, i) => {
          const breathe = calm ? 0 : Math.sin(t * 0.5 + i * 1.1) * 0.05;
          m.scale.setScalar((m.userData.r as number) * (1 + breathe));
          (m.material as THREE.MeshBasicMaterial).opacity = 0.24 - i * 0.045;
        });
        const age = t - pingStart;
        const pm = pulse.material as THREE.MeshBasicMaterial;
        if (age >= 0 && age < 2.2) {
          pulse.visible = true;
          pulse.scale.setScalar(1.6 + age * 3.6);
          pm.opacity = (1 - age / 2.2) * 0.5;
        } else pulse.visible = false;

        satellites.forEach((f) => {
          const th = f.ph + (calm ? 0 : t) * f.speed * f.dir;
          const dx = -Math.sin(th) * f.dir;
          const dz = Math.cos(th) * f.dir;
          f.group.position.set(Math.cos(th) * f.r, floorY + 0.03, Math.sin(th) * f.r);
          f.group.rotation.y = Math.atan2(-dz, dx);
        });
      };

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
        holdUntil = 0; // user takes over - cancel any name-change freeze
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

      /* Pointer parallax - subtle, adds depth while scrolling */
      let px = 0;
      let py = 0;
      let tx = 0;
      let ty = 0;
      const onPointer = (e: PointerEvent) => {
        tx = (e.clientX / window.innerWidth - 0.5) * 1.4;
        ty = (e.clientY / window.innerHeight - 0.5) * 1.2;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      // Portrait screens pull the camera back so the front panel and its neighbours fit,
      // and lift the ring so the text block has the lower part of the screen.
      let camZ = 12.5;
      let lookY = 0;
      const resize = () => {
        const rect = stage.getBoundingClientRect();
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        const a = w / h;
        camZ = 12.5 + Math.min(1, Math.max(0, (1.15 - a) / 0.7)) * 6.5;
        lookY = a < 1 ? -1.9 : -0.75; // a little higher than dead centre
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
           accelerates away - no sudden changes in motion */
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
          pingStart = now / 1000;
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
        camera.position.y = 2.1 + py * 0.5;
        camera.position.z = camZ;
        camera.lookAt(0, lookY, 0);

        /* centre wordmark always faces the camera */
        if (totem) totem.quaternion.copy(camera.quaternion);

        /* per-panel focus: opacity + size follow the card's angle,
           so cards glide in and out of the front smoothly - no
           hard switches when the active member changes */
        panels.forEach((panel, i) => {
          const mat = panel.material as THREE.MeshBasicMaterial;
          const ang = (i - s) * STEP_ANG; // world angle vs camera front
          const frontness = Math.max(0, Math.cos(ang)) ** 1.4;
          mat.opacity = Math.pow(frontness, 1.2);
          const scl = 0.8 + 0.26 * frontness;
          panel.scale.set(scl, scl, 1);
          panel.renderOrder = i === idx ? 10 : 0;
          panel.position.y = reducedMotion ? 0 : Math.sin((now / 1000) * 0.9 + i * 1.3) * 0.05;
        });

        updateFloor(now / 1000, reducedMotion);

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
        ringGeo.dispose();
        floorRings.forEach((m) => (m.material as THREE.Material).dispose());
        (pulse.material as THREE.Material).dispose();
        satellites.forEach((f) => f.geo.dispose());
        satMat.dispose();
        satTex.dispose();
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

  /* Dust motes - deterministic per member (avoids SSR/hydration
     mismatches) and re-seeded whenever the active member changes,
     so the fade pattern shifts slightly with each name change */
  const dustMotes = useMemo(() => {
    const seeded = (a: number, b: number) => {
      const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    // rounded so server and browser float maths serialise identically
    const r2 = (n: number) => Math.round(n * 100) / 100;
    return Array.from({ length: 14 }, (_, i) => ({
      left: r2(18 + seeded(active + 1, i) * 64),
      top: r2(22 + seeded(active + 2, i) * 56),
      size: r2(2 + seeded(active + 3, i) * 4),
      delay: r2(seeded(active + 4, i) * 0.45),
      dur: r2(0.9 + seeded(active + 5, i) * 0.7),
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
          height: "100dvh",
          overflow: "hidden",
          background: "transparent",
        }}
      >
        {/* halftone backdrop */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(var(--outline-variant) 0.6px, transparent 0.7px)",
            backgroundSize: "22px 22px",
            opacity: 0.55,
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

        {/* text overlay - desktop: role left / details right, vertically
            centred; mobile: pinned to the top corners of the photo */}
        <div className="tc-stage-overlay">
          {/* Left: role (designation) */}
          <div className="tc-role-block">
            <div
              data-wall-counter
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: ".3em",
                color: "var(--signal)",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
            </div>
            <div
              key={member.name + "-role"}
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
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
                fontFamily: "var(--font-mono)",
                fontSize: "clamp(24px, 3.2vw, 44px)",
                lineHeight: 1.05,
                color: "var(--on-surface)",
                animation: "tw-fade-in .6s ease .05s both",
              }}
            >
              {member.name}
            </div>
            <svg
              key={member.name + "-wave"}
              className="tc-wave"
              viewBox="0 0 160 14"
              aria-hidden
            >
              <path d="M0 7 H160" />
            </svg>
            <div
              key={member.name + "-dept"}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                color: "var(--on-surface-variant)",
                marginTop: 10,
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
                  className="chip"
                  style={{
                    fontSize: 8.5,
                    letterSpacing: ".14em",
                    pointerEvents: "auto",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* dust motes - re-triggered on every member change */}
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
            height: 1,
            background: "var(--outline-variant)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: `${((active + 1) / N) * 100}%`,
              height: "100%",
              background: "var(--signal)",
              transition: "width .5s ease",
            }}
          />
          {/* a small probe rides the head of the bar */}
          <svg
            aria-hidden
            viewBox="0 0 34 14"
            style={{
              position: "absolute",
              top: -6,
              left: `${((active + 1) / N) * 100}%`,
              width: 34,
              height: 14,
              transform: "translateX(-100%)",
              transition: "left .5s ease",
            }}
          >
            <rect x="2" y="0.5" width="12" height="4.5" fill="var(--hull-900)" stroke="var(--dim-300)" strokeWidth=".7" />
            <rect x="2" y="9" width="12" height="4.5" fill="var(--hull-900)" stroke="var(--dim-300)" strokeWidth=".7" />
            <path d="M33 7 L8 2.5 L8 11.5 Z" fill="var(--hull-900)" stroke="var(--starlight)" strokeWidth=".9" strokeLinejoin="round" />
            <circle cx="16" cy="7" r="1.5" fill="var(--lit)" />
          </svg>
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
          .tc-role-block, .tc-detail-block {
            text-shadow: 0 1px 2px color-mix(in srgb, var(--void-950) 90%, transparent),
                         0 0 12px color-mix(in srgb, var(--void-950) 75%, transparent);
          }
          .tc-role-block { width: 24%; min-width: 150px; }
          .tc-detail-block { width: 30%; min-width: 220px; text-align: right; }
          .tc-role-block {
            border-left: 2px solid var(--signal);
            padding-left: 14px;
          }
          .tc-wave {
            display: block;
            width: 120px;
            height: 11px;
            margin: 12px 0 0 auto;
            overflow: visible;
          }
          .tc-wave path {
            fill: none;
            stroke: var(--lit);
            stroke-width: 1.6;
            stroke-linecap: round;
            stroke-dasharray: 190;
            stroke-dashoffset: 190;
            animation: tc-wave-draw 0.9s ease 0.2s forwards;
          }
          @keyframes tc-wave-draw { to { stroke-dashoffset: 0; } }
          @media (prefers-reduced-motion: reduce) {
            .tc-wave path { animation: none; stroke-dashoffset: 0; }
          }
          .tc-links-row {
            display: flex;
            gap: 10px;
            margin-top: 18px;
            justify-content: flex-end;
          }
          /* Mobile - the front card fills the screen, so pin the
             designation to the top-left of the photo and the
             details to the top-right of the photo */
          @media (max-width: 640px) {
            .tc-stage-overlay {
              padding: 0 20px 76px;
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              justify-content: flex-end;
              gap: 14px;
            }
            .tc-role-block, .tc-detail-block { width: 100%; min-width: 0; text-align: left; }
            .tc-wave { margin-left: 0; }
            .tc-links-row { flex-wrap: wrap; justify-content: flex-start; margin-top: 14px; }
          }
          .tc-links-row a, .tc-links-row span { min-height: 44px; display: inline-flex; align-items: center; }
          /* Dust motes - drift upward and fade in/out on member change */
          .tc-dust {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 6;
          }
          .tc-dust-mote {
            position: absolute;
            background: var(--lit);
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