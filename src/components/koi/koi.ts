/* ============================================================
   KOI — shared 2D-canvas drawing kit for the boot / landing /
   route-loader / nav scenes.

   A koi is drawn dorsal-view from a SPINE (head -> tail points).
   A travelling sine wave displaces the spine (amplitude grows
   toward the tail), the body outline is built from a width
   profile along that spine, and the caudal fin is a translucent
   forked fan. White body, vermilion patches, all colours from
   the design tokens.
   ============================================================ */

export type Pt = { x: number; y: number };

export interface KoiPalette {
  body: string;
  patch: string;
  patchDeep: string;
  eye: string;
  ripple: string;
  water: string;
  lily: string;
  lotus: string;
  gold: string;
}

export function readPalette(): KoiPalette {
  const cs = getComputedStyle(document.documentElement);
  const g = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
  return {
    body: g("--foam", "#f6f1e4"),
    patch: g("--signal", "#ee5b3a"),
    patchDeep: g("--signal-700", "#c9391b"),
    eye: g("--pond-950", "#061a1d"),
    ripple: g("--pond-300", "#7fb5ad"),
    water: g("--pond-950", "#061a1d"),
    lily: g("--lily-600", "#3f7d5c"),
    lotus: g("--lotus-300", "#f2a7a0"),
    gold: g("--marker", "#f0b73a"),
  };
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- canvas loop: DPR cap 1.5, pauses when hidden ---------- */
export function startCanvasLoop(
  canvas: HTMLCanvasElement,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number) => void,
  opts: { still?: boolean } = {},
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  let w = 0;
  let h = 0;
  let raf = 0;
  let last = 0;
  let t = 0;
  let alive = true;

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = r.width;
    h = r.height;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (opts.still) draw(ctx, w, h, t, 0);
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    t += dt;
    draw(ctx, w, h, t, dt);
    if (!document.hidden) raf = requestAnimationFrame(frame);
  };

  const onVis = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf && alive && !opts.still) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };

  resize();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", onVis);
  if (!opts.still) raf = requestAnimationFrame(frame);

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVis);
  };
}

/* ---------- spine helpers ---------- */
export const KOI_SEGS = 16;

/** Spine sampled along an arc-length-parametrised path (s = head position). */
export function spineFromPath(path: (s: number) => Pt, s: number, L: number, n = KOI_SEGS): Pt[] {
  const seg = L / n;
  return Array.from({ length: n + 1 }, (_, i) => path(s - i * seg));
}

/** A steering koi: head seeks a target, the spine follows the head. */
export class KoiSwimmer {
  x: number;
  y: number;
  heading: number;
  speed: number;
  spine: Pt[];
  private seg: number;

  constructor(x: number, y: number, heading: number, public L: number, speed: number) {
    this.x = x;
    this.y = y;
    this.heading = heading;
    this.speed = speed;
    this.seg = L / KOI_SEGS;
    this.spine = Array.from({ length: KOI_SEGS + 1 }, (_, i) => ({
      x: x - Math.cos(heading) * this.seg * i,
      y: y - Math.sin(heading) * this.seg * i,
    }));
  }

  step(dt: number, target: Pt, turnRate = 2.2, speedMul = 1) {
    const want = Math.atan2(target.y - this.y, target.x - this.x);
    let d = want - this.heading;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    const max = turnRate * dt;
    this.heading += Math.max(-max, Math.min(max, d));
    const dist = Math.hypot(target.x - this.x, target.y - this.y);
    const v = this.speed * speedMul * Math.min(1, 0.25 + dist / (this.L * 1.2));
    this.x += Math.cos(this.heading) * v * dt;
    this.y += Math.sin(this.heading) * v * dt;
    this.spine[0] = { x: this.x, y: this.y };
    for (let i = 1; i < this.spine.length; i++) {
      const a = this.spine[i - 1];
      const b = this.spine[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const m = Math.hypot(dx, dy) || 1;
      b.x = a.x + (dx / m) * this.seg;
      b.y = a.y + (dy / m) * this.seg;
    }
    return dist;
  }
}

/* ---------- ripples ---------- */
export interface Ripple {
  x: number;
  y: number;
  born: number;
  max: number;
  life: number;
  strength?: number;
}

export function drawRipples(
  ctx: CanvasRenderingContext2D,
  ripples: Ripple[],
  now: number,
  color: string,
  base = 0.5,
) {
  ctx.strokeStyle = color;
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    const a = (now - r.born) / r.life;
    if (a >= 1) {
      ripples.splice(i, 1);
      continue;
    }
    if (a < 0) continue;
    const e = 1 - Math.pow(1 - a, 2.2);
    const rad = r.max * e;
    const fade = Math.pow(1 - a, 1.6) * base * (r.strength ?? 1);
    for (let k = 0; k < 3; k++) {
      const rr = rad * (1 - k * 0.17);
      if (rr < 1) continue;
      ctx.globalAlpha = fade * (1 - k * 0.32);
      ctx.lineWidth = k === 0 ? 1.4 : 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

/* ---------- lily pad + lotus ---------- */
export function drawLily(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot: number,
  pal: KoiPalette,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const gap = 0.32;
  // shadow on the water
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.moveTo(r * 0.06 + 4, r * 0.1 + 6);
  ctx.arc(4, 6, r, gap, Math.PI * 2 - gap);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  // pad
  ctx.fillStyle = pal.lily;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r, gap, Math.PI * 2 - gap);
  ctx.closePath();
  ctx.fill();
  // veins
  ctx.strokeStyle = pal.water;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    const a = gap + 0.25 + (i / 8) * (Math.PI * 2 - gap * 2 - 0.5);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r * 0.94, Math.sin(a) * r * 0.94);
    ctx.stroke();
  }
  // rim
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = pal.ripple;
  ctx.beginPath();
  ctx.arc(0, 0, r, gap, Math.PI * 2 - gap);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawLotus(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot: number,
  pal: KoiPalette,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const ring = (n: number, len: number, wid: number, off: number, alpha: number) => {
    for (let i = 0; i < n; i++) {
      ctx.save();
      ctx.rotate(off + (i / n) * Math.PI * 2);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pal.lotus;
      ctx.strokeStyle = pal.body;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(len * 0.55, 0, len * 0.5, wid, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  };
  ring(8, r, r * 0.26, 0, 0.9);
  ring(8, r * 0.7, r * 0.22, Math.PI / 8, 0.95);
  ring(6, r * 0.42, r * 0.16, 0, 1);
  ctx.globalAlpha = 1;
  ctx.fillStyle = pal.gold;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ---------- the koi ---------- */
const PATCHES = [
  { u: 0.045, off: 0.0, rx: 0.075, ry: 0.07 },
  { u: 0.27, off: -0.018, rx: 0.14, ry: 0.058 },
  { u: 0.5, off: 0.026, rx: 0.12, ry: 0.052 },
  { u: 0.66, off: -0.012, rx: 0.075, ry: 0.04 },
];

const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function smoothClosed(pts: Pt[]): Path2D {
  const p = new Path2D();
  const n = pts.length;
  const s = mid(pts[n - 1], pts[0]);
  p.moveTo(s.x, s.y);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    p.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y);
  }
  p.closePath();
  return p;
}

export interface KoiOpts {
  alpha?: number;
  shadow?: boolean;
  /** wave angular speed; higher = faster tail beat */
  beat?: number;
  /** 0..1.4, how strongly the body undulates */
  sway?: number;
  /** flip patch layout for variety */
  flip?: boolean;
}

export function drawKoi(
  ctx: CanvasRenderingContext2D,
  spine: Pt[],
  L: number,
  t: number,
  pal: KoiPalette,
  o: KoiOpts = {},
) {
  const n = spine.length - 1;
  const beat = o.beat ?? 6.5;
  const sway = o.sway ?? 1;
  const alpha = o.alpha ?? 1;

  // 1. displace the spine with a travelling wave
  const P: Pt[] = [];
  const T: Pt[] = [];
  const N: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = spine[Math.max(0, i - 1)];
    const b = spine[Math.min(n, i + 1)];
    const m = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const tx = (a.x - b.x) / m; // head-ward tangent (spine runs head->tail)
    const ty = (a.y - b.y) / m;
    const nx = -ty;
    const ny = tx;
    const u = i / n;
    const amp = L * (0.006 + 0.075 * u * u) * sway;
    const off = amp * Math.sin(u * Math.PI * 2 * 0.95 - t * beat);
    P.push({ x: spine[i].x + nx * off, y: spine[i].y + ny * off });
    T.push({ x: tx, y: ty });
    N.push({ x: nx, y: ny });
  }
  // recompute tangents/normals on the displaced spine
  for (let i = 0; i <= n; i++) {
    const a = P[Math.max(0, i - 1)];
    const b = P[Math.min(n, i + 1)];
    const m = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    T[i] = { x: (a.x - b.x) / m, y: (a.y - b.y) / m };
    N[i] = { x: -T[i].y, y: T[i].x };
  }

  // 2. body outline
  const bn = Math.round(n * 0.8);
  const hw = (i: number) => {
    const v = i / bn;
    return L * 0.088 * Math.pow(Math.sin(Math.PI * (0.1 + 0.86 * v)), 0.8);
  };
  const outline: Pt[] = [];
  outline.push({ x: P[0].x + T[0].x * hw(0) * 0.9, y: P[0].y + T[0].y * hw(0) * 0.9 });
  for (let i = 0; i <= bn; i++) outline.push({ x: P[i].x + N[i].x * hw(i), y: P[i].y + N[i].y * hw(i) });
  for (let i = bn; i >= 0; i--) outline.push({ x: P[i].x - N[i].x * hw(i), y: P[i].y - N[i].y * hw(i) });
  const body = smoothClosed(outline);

  // 3. caudal fin: translucent forked fan
  const tw = (i: number) => {
    const v = (i - bn) / (n - bn);
    return L * (0.014 + 0.105 * Math.sin(Math.min(1, v) * Math.PI * 0.5) ** 1.3);
  };
  const tail = new Path2D();
  tail.moveTo(P[bn].x + N[bn].x * hw(bn), P[bn].y + N[bn].y * hw(bn));
  for (let i = bn + 1; i <= n; i++) tail.lineTo(P[i].x + N[i].x * tw(i), P[i].y + N[i].y * tw(i));
  const notch = P[n - 1];
  tail.quadraticCurveTo(
    P[n].x + T[n].x * -L * 0.02,
    P[n].y + T[n].y * -L * 0.02,
    notch.x,
    notch.y,
  );
  tail.quadraticCurveTo(
    P[n].x - T[n].x * L * 0.02,
    P[n].y - T[n].y * L * 0.02,
    P[n].x - N[n].x * tw(n),
    P[n].y - N[n].y * tw(n),
  );
  for (let i = n - 1; i > bn; i--) tail.lineTo(P[i].x - N[i].x * tw(i), P[i].y - N[i].y * tw(i));
  tail.lineTo(P[bn].x - N[bn].x * hw(bn), P[bn].y - N[bn].y * hw(bn));
  tail.closePath();

  // pectoral + pelvic fins
  const fins: { i: number; side: number; len: number; wid: number; flap: number }[] = [
    { i: 3, side: 1, len: 0.105, wid: 0.036, flap: 0 },
    { i: 3, side: -1, len: 0.105, wid: 0.036, flap: Math.PI },
    { i: 9, side: 1, len: 0.06, wid: 0.024, flap: 1 },
    { i: 9, side: -1, len: 0.06, wid: 0.024, flap: 1 + Math.PI },
  ];
  const drawFins = () => {
    for (const f of fins) {
      const b = P[f.i];
      const w = hw(f.i);
      const bx = b.x + N[f.i].x * f.side * w * 0.9;
      const by = b.y + N[f.i].y * f.side * w * 0.9;
      const dirx = N[f.i].x * f.side * 0.75 - T[f.i].x * 0.65;
      const diry = N[f.i].y * f.side * 0.75 - T[f.i].y * 0.65;
      const flap = Math.sin(t * 3.2 + f.flap) * 0.22;
      const ang = Math.atan2(diry, dirx) + flap * f.side;
      const len = L * f.len;
      ctx.beginPath();
      ctx.ellipse(bx + Math.cos(ang) * len * 0.5, by + Math.sin(ang) * len * 0.5, len * 0.55, L * f.wid, ang, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  ctx.save();
  ctx.globalAlpha = alpha;

  // soft shadow on the pond floor
  if (o.shadow !== false) {
    ctx.save();
    ctx.translate(L * 0.06, L * 0.1);
    ctx.globalAlpha = alpha * 0.26;
    ctx.fillStyle = "#000";
    ctx.fill(body);
    ctx.fill(tail);
    ctx.restore();
  }

  // tail (translucent) with rays
  ctx.fillStyle = pal.body;
  ctx.globalAlpha = alpha * 0.34;
  ctx.fill(tail);
  ctx.globalAlpha = alpha * 0.32;
  ctx.strokeStyle = pal.body;
  ctx.lineWidth = 0.8;
  for (const k of [-0.7, -0.35, 0, 0.35, 0.7]) {
    ctx.beginPath();
    ctx.moveTo(P[bn].x, P[bn].y);
    const ii = n;
    ctx.lineTo(P[ii].x + N[ii].x * tw(ii) * k, P[ii].y + N[ii].y * tw(ii) * k);
    ctx.stroke();
  }

  // fins (translucent)
  ctx.fillStyle = pal.body;
  ctx.globalAlpha = alpha * 0.5;
  drawFins();

  // body
  ctx.globalAlpha = alpha;
  ctx.fillStyle = pal.body;
  ctx.fill(body);

  // patches, clipped to body
  ctx.save();
  ctx.clip(body);
  const flip = o.flip ? -1 : 1;
  for (const p of PATCHES) {
    const f = p.u * n;
    const i0 = Math.min(n - 1, Math.floor(f));
    const k = f - i0;
    const cx = P[i0].x + (P[i0 + 1].x - P[i0].x) * k;
    const cy = P[i0].y + (P[i0 + 1].y - P[i0].y) * k;
    const nx = N[i0].x;
    const ny = N[i0].y;
    const ang = Math.atan2(T[i0].y, T[i0].x);
    const ox = cx + nx * p.off * L * flip;
    const oy = cy + ny * p.off * L * flip;
    ctx.fillStyle = pal.patch;
    ctx.beginPath();
    ctx.ellipse(ox, oy, p.rx * L, p.ry * L, ang, 0, Math.PI * 2);
    ctx.ellipse(ox - T[i0].x * p.rx * L * 0.5, oy - T[i0].y * p.rx * L * 0.5, p.rx * L * 0.62, p.ry * L * 1.25, ang, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillStyle = pal.patchDeep;
    ctx.beginPath();
    ctx.ellipse(ox, oy + ny * p.ry * L * 0.2, p.rx * L * 0.55, p.ry * L * 0.45, ang, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha;
  }
  // faint dorsal ridge
  ctx.strokeStyle = pal.water;
  ctx.globalAlpha = alpha * 0.1;
  ctx.lineWidth = L * 0.02;
  ctx.beginPath();
  ctx.moveTo(P[1].x, P[1].y);
  for (let i = 2; i <= bn; i++) ctx.lineTo(P[i].x, P[i].y);
  ctx.stroke();
  ctx.restore();

  // eyes
  ctx.globalAlpha = alpha;
  ctx.fillStyle = pal.eye;
  for (const s of [1, -1]) {
    ctx.beginPath();
    ctx.arc(P[1].x + N[1].x * hw(1) * 0.72 * s, P[1].y + N[1].y * hw(1) * 0.72 * s, Math.max(1.2, L * 0.011), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
