"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import type { TeamMember } from "@/lib/team";
import { initials, memberMeta, photoUrl } from "@/lib/team";

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
   • role / name / dept / links crossfade beside the front panel; each
     card carries the member's name and department.
   • The ring does not loop: the first member has nobody before it,
     and the last nobody after it.
   • Restored 2026-10-17 as the very first carousel, without its
     continuous motion (owner): no idle auto-spin, no bobbing cards,
     no breathing floor or circling satellites. It moves only when
     you do, one member per scroll gesture or key (useStepScroll):
     a trackpad flick's momentum is swallowed, there is no hold,
     and scrolling outward at the first or last member leaves it.
   • The ring is sized from the member count: past ten members it
     grows so every card keeps the same width, and is pushed back
     so the front card stays where it was.

   Transparent stage - floats over the shared star-field backdrop.
   ============================================================ */

interface TeamCarouselProps {
  members: TeamMember[];
}

/* Ring geometry shared by the scene and the portrait canvases. The ring
   was drawn for ten members: a card is one tenth of that circle wide. */
const BASE_N = 10;
const BASE_RADIUS = 4.6;
const PANEL_H = 4.9; // front card fills ~90% of the visible height
const PANEL_ARC = ((2 * Math.PI) / BASE_N) * 0.88; // cards wrap wide, nearly touching
const PANEL_W = BASE_RADIUS * PANEL_ARC;
/* Portrait canvas: same proportions as the panel, so photos are never stretched. */
const CARD_W = 512;
const CARD_H = Math.round((CARD_W * PANEL_H) / PANEL_W);
/* The circular portrait on the card */
const PHOTO_D = CARD_W * 0.84;
const PHOTO_CX = CARD_W / 2;
const PHOTO_CY = CARD_H * 0.37;

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

/* Printed-card detail painted on every portrait (the heads' and office
   bearers' cards; owner, 2026-10-17): a faint grid, corner brackets,
   department and year across the top, a thin gold orbit round the
   portrait, the designation on a gold rank band under it, the name in
   the display face, and the running number. */
function paintOrnament(
  ctx: CanvasRenderingContext2D,
  member: TeamMember,
  index: number,
  total: number
) {
  const size = CARD_W;
  const W = CARD_W;
  const H = CARD_H;
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

  const photoBottom = PHOTO_CY + PHOTO_D / 2;
  const spacing = (px: number) => {
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px.toFixed(1)}px`;
  };

  // a thin gold orbit round the portrait, one lit point on it
  const orbit = PHOTO_D / 2 + size * 0.02;
  ctx.save();
  ctx.strokeStyle = tokenAlpha("--lit", 0.5, "#f0b73a");
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(PHOTO_CX, PHOTO_CY, orbit, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.arc(PHOTO_CX + Math.cos(-0.75) * orbit, PHOTO_CY + Math.sin(-0.75) * orbit, size * 0.013, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // department and year: a quiet readout across the top
  const meta = memberMeta(member).toUpperCase();
  if (meta) {
    ctx.save();
    ctx.font = `500 ${size * 0.03}px ${monoFamily()}, monospace`;
    spacing(size * 0.006);
    ctx.fillStyle = tokenAlpha("--starlight", 0.62, "#f6f1e4");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(meta, PHOTO_CX, m + size * 0.075, W * 0.7);
    ctx.restore();
  }

  // the designation: a gold rank band with notched ends, dark letters on it
  ctx.save();
  ctx.font = `700 ${size * 0.036}px ${monoFamily()}, monospace`;
  spacing(size * 0.006);
  const tag = member.role.toUpperCase();
  const bandH = size * 0.076;
  const notch = bandH * 0.42;
  const bandW = Math.min(W - 2 * m - size * 0.04, Math.max(W * 0.56, ctx.measureText(tag).width + notch * 2 + size * 0.1));
  const bandY = photoBottom + size * 0.105;
  const x0 = PHOTO_CX - bandW / 2;
  const x1 = PHOTO_CX + bandW / 2;
  ctx.beginPath();
  ctx.moveTo(x0, bandY - bandH / 2);
  ctx.lineTo(x1, bandY - bandH / 2);
  ctx.lineTo(x1 - notch, bandY);
  ctx.lineTo(x1, bandY + bandH / 2);
  ctx.lineTo(x0, bandY + bandH / 2);
  ctx.lineTo(x0 + notch, bandY);
  ctx.closePath();
  ctx.fillStyle = gold;
  ctx.fill();
  ctx.fillStyle = tokenColor("--hull-900", "#17181c");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tag, PHOTO_CX, bandY + 1, bandW - notch * 2 - size * 0.03);
  ctx.restore();

  // the name in the display face, under the band: one line if it fits, else two balanced ones, shrunk to fit
  ctx.save();
  ctx.fillStyle = foam;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const face = (px: number) => `400 ${px}px 'Ethnocentric', ${monoFamily()}, monospace`;
  const maxW = W * 0.8;
  const words = member.name.toUpperCase().split(/\s+/).filter(Boolean);
  let px = size * 0.06;
  ctx.font = face(px);
  const widest = (ls: string[]) => Math.max(...ls.map((l) => ctx.measureText(l).width));
  let lines = [words.join(" ")];
  if (widest(lines) > maxW && words.length > 1) {
    let best = lines;
    let bestW = Infinity;
    for (let k = 1; k < words.length; k++) {
      const pair = [words.slice(0, k).join(" "), words.slice(k).join(" ")];
      const w = widest(pair);
      if (w < bestW) [best, bestW] = [pair, w];
    }
    lines = best;
  }
  while (widest(lines) > maxW && px > size * 0.034) {
    px -= 1;
    ctx.font = face(px);
  }
  const nameY = photoBottom + size * 0.255;
  lines.forEach((line, i) => ctx.fillText(line, PHOTO_CX, nameY + i * px * 1.32, maxW));
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

}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* Sanity's CDN only answers cross-origin (canvas-readable) requests from
   the origins registered on the project. Anywhere else the same photo
   comes through this site's own image optimiser, which is same-origin. */
async function loadPortrait(member: TeamMember): Promise<HTMLImageElement | null> {
  if (!member.photo) return null;
  const sources = [
    photoUrl(member.photo, 640),
    `/_next/image?url=${encodeURIComponent(member.photo)}&w=640&q=75`,
  ];
  for (const src of sources) {
    try {
      return await loadImage(src);
    } catch {
      /* try the next source */
    }
  }
  return null;
}

async function portraitDataURL(member: TeamMember, index: number, total: number): Promise<string> {
  // the names are set in the display face: wait for it, or the first paint falls back to the mono
  await document.fonts?.load(`400 32px 'Ethnocentric'`).catch(() => undefined);
  const W = CARD_W;
  const H = CARD_H;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const finish = () => {
    paintOrnament(ctx, member, index, total);
    /* hairline starlight frame so the panel reads against the void */
    ctx.strokeStyle = tokenAlpha("--starlight", 0.35, "#f6f1e4");
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, W - 3, H - 3);
    return canvas.toDataURL("image/jpeg", 0.9);
  };

  const paintFallback = () => {
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, tokenColor("--surface-container-high", "#1c1d21"));
    g.addColorStop(1, tokenColor("--hull-900", "#17181c"));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = tokenAlpha("--starlight", 0.7, "#f6f1e4");
    ctx.font = `700 ${W * 0.24}px ${monoFamily()}, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials(member.name), PHOTO_CX, PHOTO_CY);
    return finish();
  };

  const img = await loadPortrait(member);
  if (!img) return paintFallback();

  try {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, tokenColor("--hull-900", "#17181c"));
    g.addColorStop(1, tokenColor("--void-950", "#0a0a0b"));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    /* the club's portraits are circular: clip every photo to the same
       disc so square and pre-masked uploads read alike */
    const r = PHOTO_D / 2;
    const s = Math.min(img.width, img.height);
    ctx.save();
    ctx.beginPath();
    ctx.arc(PHOTO_CX, PHOTO_CY, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = tokenColor("--void-950", "#0a0a0b");
    ctx.fillRect(PHOTO_CX - r, PHOTO_CY - r, PHOTO_D, PHOTO_D);
    ctx.filter = "grayscale(1) sepia(0.4) hue-rotate(-8deg) saturate(1.1) contrast(1.04)";
    ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, PHOTO_CX - r, PHOTO_CY - r, PHOTO_D, PHOTO_D);
    ctx.filter = "none";
    // void tint so the photo sits in the dark
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = tokenAlpha("--dim-300", 0.4, "#a3a8b0");
    ctx.fillRect(PHOTO_CX - r, PHOTO_CY - r, PHOTO_D, PHOTO_D);
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";

    /* orbit hairlines around the disc */
    ctx.lineWidth = 2;
    ctx.strokeStyle = tokenAlpha("--starlight", 0.5, "#f6f1e4");
    ctx.beginPath();
    ctx.arc(PHOTO_CX, PHOTO_CY, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = tokenAlpha("--dim-300", 0.35, "#a3a8b0");
    ctx.beginPath();
    ctx.arc(PHOTO_CX, PHOTO_CY, r + W * 0.03, 0, Math.PI * 2);
    ctx.stroke();
    return finish();
  } catch {
    return paintFallback();
  }
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

/* One member per gesture (owner, 2026-10-17): a wheel or touchpad gesture, or an arrow / page key, moves the page to
   the next member's stop and no further. A gesture is a run of wheel events without a 220ms pause; small touchpad
   deltas add up, and once it has stepped, the rest of it (momentum) is swallowed, even at the ends, so it can't carry
   the page out. A full mouse notch re-arms 110ms after a step. A push mid-glide goes on from the glide's goal; there
   is no hold. At the first and last member, a new push outward leaves the ring as usual, and arriving from above or
   below stops on the first or last member. Any other scroll (a scrollbar drag) settles on the nearer member. */
function useStepScroll(holderRef: React.RefObject<HTMLDivElement | null>, N: number) {
  useEffect(() => {
    const holder = holderRef.current;
    if (!holder || N < 2) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const range = () => ({ top: holder.getBoundingClientRect().top + window.scrollY, total: holder.offsetHeight - window.innerHeight });
    const indexNow = () => {
      const { top, total } = range();
      return total > 0 ? ((window.scrollY - top) / total) * (N - 1) : 0;
    };
    let lockUntil = 0; // a step is gliding until then (no settle meanwhile)
    let goal = -1;
    let lastStep = 0;
    let lastWheel = 0;
    let acc = 0;
    let armed = true;
    const goStop = (k: number) => {
      const { top, total } = range();
      const idx = Math.min(N - 1, Math.max(0, k));
      goal = idx;
      lastStep = performance.now();
      lockUntil = lastStep + (reduced ? 200 : 650);
      window.scrollTo({ top: top + (idx / (N - 1)) * total, behavior: reduced ? "auto" : "smooth" });
    };
    const step = (dir: number) => {
      if (performance.now() < lockUntil && goal >= 0) return goStop(goal + dir);
      const t = indexNow();
      goStop(dir > 0 ? Math.floor(t + 0.02) + 1 : Math.ceil(t - 0.02) - 1);
    };
    const inside = (dir: number) => {
      const { top, total } = range();
      const into = window.scrollY - top;
      if (total <= 0 || into < -2 || into > total + 2) return false;
      const t = indexNow();
      return dir > 0 ? t < N - 1 - 0.02 : t > 0.02;
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch zoom
      const raw = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const dy = raw * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
      if (!dy) return;
      const { top, total } = range();
      const into = window.scrollY - top;
      // when the event was made, not when this busy page got round to it, so a slow frame can't split one gesture
      const now = e.timeStamp || performance.now();
      if (now - lastWheel > 220 || (now - lastStep > 110 && Math.abs(dy) >= 50)) {
        if (!armed) acc = 0;
        armed = true;
      }
      lastWheel = now;
      if (!armed && into >= -2 && into <= total + 2) {
        e.preventDefault();
        return;
      }
      if (into < -2 && into + dy > 0) {
        e.preventDefault();
        if (armed) {
          armed = false;
          goStop(0);
        }
        return;
      }
      if (into > total + 2 && into + dy < total) {
        e.preventDefault();
        if (armed) {
          armed = false;
          goStop(N - 1);
        }
        return;
      }
      if (!inside(Math.sign(dy))) return;
      e.preventDefault();
      if (!armed) return;
      acc += dy;
      if (Math.abs(acc) < 24) return;
      armed = false;
      step(Math.sign(acc));
      acc = 0;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || (e.target as Element).closest?.("input, textarea, select, [contenteditable]")) return;
      const dir = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, " ": e.shiftKey ? -1 : 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 }[e.key];
      if (!dir || !inside(dir)) return;
      e.preventDefault();
      step(dir);
    };
    let rest = 0;
    const settle = () => {
      if (reduced) return;
      const { top, total } = range();
      const into = window.scrollY - top;
      if (total <= 0 || into <= 0 || into >= total) return;
      const t = (into / total) * (N - 1);
      if (Math.abs(t - Math.round(t)) > 0.01) goStop(Math.round(t));
    };
    const onScroll = () => {
      clearTimeout(rest);
      if (performance.now() >= lockUntil) rest = window.setTimeout(settle, 180);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(rest);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [holderRef, N]);
}

export default function TeamCarousel({ members }: TeamCarouselProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [textureUrls, setTextureUrls] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  /* the route loader holds until the ring's first frame is drawn (aria-busy below) */
  const [drawn, setDrawn] = useState(false);

  const N = members.length;
  useStepScroll(holderRef, N);

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
      const RADIUS = BASE_RADIUS * Math.max(1, N / BASE_N); // ten cards span ~95% of the stage width
      const STEP_ANG = (2 * Math.PI) / N;
      const ARC = PANEL_ARC * (BASE_RADIUS / RADIUS); // same card width at any ring size
      /* a card's focus falls off as if the ring still held ten */
      const FOCUS_STEP = Math.max(STEP_ANG, (2 * Math.PI) / BASE_N);

      /* Everything that orbits lives in one group, pushed back so the
         front card stays at the same depth however large the ring is */
      const ring = new THREE.Group();
      ring.position.z = BASE_RADIUS - RADIUS;
      scene.add(ring);

      /* Ring group - rotates around Y; no vertical travel */
      const carousel = new THREE.Group();
      ring.add(carousel);

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
        ring.add(m);
        floorRings.push(m);
      });
      const pulse = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({ color: new THREE.Color(tokenColor("--signal", "#ee5b3a")), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
      );
      pulse.rotation.x = -Math.PI / 2;
      pulse.position.y = floorY;
      pulse.visible = false;
      ring.add(pulse);
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
        ring.add(group);
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
        ring.add(totem);
      }

      /* No auto-rotate (owner, 2026-10-17): the ring turns only when the page scrolls. */
      let prevIdx = 0;

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
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

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
      let firstDrawn = false;
      let lastT = performance.now();
      const animFrame = () => {
        if (disposed) return;
        const now = performance.now();
        const dt = Math.min(0.1, (now - lastT) / 1000); // clamp pauses
        lastT = now;

        /* ease toward the target. The factor is normalised to frame
           time so the glide feels identical at 60 / 120 / 144 Hz. */
        const ease = 1 - Math.pow(1 - 0.09, dt * 60);
        s += (targetS - s) * ease;
        const idx = Math.min(N - 1, Math.max(0, Math.round(s)));
        setActive(idx);

        /* a new member at the front: one ping from the floor */
        if (idx !== prevIdx) {
          prevIdx = idx;
          pingStart = now / 1000;
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
          const off = i - s; // cards away from the front; no wrap, so the last card never shows before the first
          const frontness = Math.max(0, Math.cos(Math.min(Math.PI / 2, Math.abs(off) * FOCUS_STEP))) ** 1.4;
          mat.opacity = Math.pow(frontness, 1.2);
          const scl = 0.8 + 0.26 * frontness;
          panel.scale.set(scl, scl, 1);
          panel.renderOrder = i === idx ? 10 : 0;
          panel.position.y = 0;
        });

        updateFloor(now / 1000, true); // calm: the floor rings and satellites hold still

        renderer.render(scene, camera);
        if (!firstDrawn) {
          firstDrawn = true;
          setDrawn(true);
        }
        raf = requestAnimationFrame(animFrame);
      };
      raf = requestAnimationFrame(animFrame);

      cleanup = () => {
        disposed = true;
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pointermove", onPointer);
        ro.disconnect();
        carousel.clear();
        ring.clear();
        scene.remove(ring);
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

  /* Step the ring from the arrow buttons: scroll to that member's stop,
     since scroll position is what drives the ring. */
  const goTo = (i: number) => {
    const holder = holderRef.current;
    if (!holder || N < 2) return;
    const idx = Math.min(N - 1, Math.max(0, i));
    const top = holder.getBoundingClientRect().top + window.scrollY;
    const total = holder.offsetHeight - window.innerHeight;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: top + (idx / (N - 1)) * total, behavior: reduced ? "auto" : "smooth" });
  };

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
      aria-busy={!drawn}
      style={{ height: `${Math.min(N * 70, 840)}vh`, position: "relative" }}
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
            <div className="tc-counter">
              <button
                type="button"
                className="tm-step"
                aria-label="Previous member"
                disabled={active === 0}
                onClick={() => goTo(active - 1)}
              >
                ←
              </button>
              <span data-wall-counter className="tabular">
                {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
              </span>
              <button
                type="button"
                className="tm-step"
                aria-label="Next member"
                disabled={active === N - 1}
                onClick={() => goTo(active + 1)}
              >
                →
              </button>
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
              {memberMeta(member)}
            </div>
            <div
              key={member.id + "-links"}
              className="tc-links-row"
              style={{ animation: "tw-fade-in .6s ease .25s both" }}
            >
              {member.link && (
                <a
                  className="btn btn-ghost"
                  href={member.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on ${member.link.label}. Opens in a new tab.`}
                >
                  {member.link.label} ↗
                </a>
              )}
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
          /* the neighbouring cards pass behind the copy: a flat void plate
             keeps it readable over their photos */
          .tc-role-block, .tc-detail-block {
            width: fit-content;
            padding: 14px 16px;
            background: color-mix(in srgb, var(--void-950) 80%, transparent);
          }
          .tc-role-block { max-width: 24%; min-width: 150px; }
          .tc-detail-block { max-width: 30%; min-width: 220px; text-align: right; }
          .tc-role-block { border-left: 2px solid var(--signal); }
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
            .tc-role-block, .tc-detail-block { width: 100%; max-width: none; min-width: 0; text-align: left; background: none; }
            .tc-role-block { padding: 0 0 0 14px; }
            .tc-detail-block { padding: 0; }
            .tc-wave { margin-left: 0; }
            .tc-links-row { flex-wrap: wrap; justify-content: flex-start; margin-top: 14px; }
          }
          .tc-links-row .btn { pointer-events: auto; text-shadow: none; }
          .tc-links-row .btn:not(.btn-ghost) { background: color-mix(in srgb, var(--void-950) 70%, transparent); }
          .tc-links-row .btn:not(.btn-ghost):hover { background: var(--on-surface); }
          .tc-counter {
            display: flex;
            align-items: center;
            gap: 4px;
            margin: 0 0 6px -12px;
            font-family: var(--font-mono);
            font-size: 12px;
            letter-spacing: .24em;
            color: var(--signal);
          }
          .tc-counter .tm-step { pointer-events: auto; }
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