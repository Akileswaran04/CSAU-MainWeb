/* ============================================================
   SPACE 2D - shared 2D-canvas drawing kit for the boot / route
   loader / nav scenes.

   A probe is drawn top-down from a TRAIL (head -> tail points):
   a dashed telemetry line behind it, a small hull with solar
   panels and one indicator light. Radar pings replace ripples
   and satellites replace the drifting ornaments. Every colour
   is read from the CSS tokens at runtime.
   ============================================================ */

export type Pt = { x: number; y: number };

export interface SpacePalette {
  starlight: string;
  signal: string;
  lit: string;
  dim: string;
  hull: string;
  void: string;
}

export function readPalette(): SpacePalette {
  const cs = getComputedStyle(document.documentElement);
  const g = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
  return {
    starlight: g("--starlight", "#f6f1e4"),
    signal: g("--signal", "#ee5b3a"),
    lit: g("--lit", "#f0b73a"),
    dim: g("--dim-300", "#a3a8b0"),
    hull: g("--hull-900", "#17181c"),
    void: g("--space-black", "#000000"),
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

/* ---------- trail helpers ---------- */
export const TRAIL_SEGS = 16;

/** Trail sampled along an arc-length-parametrised path (s = head position). */
export function trailFromPath(path: (s: number) => Pt, s: number, L: number, n = TRAIL_SEGS): Pt[] {
  const seg = L / n;
  return Array.from({ length: n + 1 }, (_, i) => path(s - i * seg));
}

/** A steering probe: the head seeks a target, the trail follows the head. */
export class Craft {
  x: number;
  y: number;
  heading: number;
  speed: number;
  trail: Pt[];
  private seg: number;

  constructor(x: number, y: number, heading: number, public L: number, speed: number) {
    this.x = x;
    this.y = y;
    this.heading = heading;
    this.speed = speed;
    this.seg = L / TRAIL_SEGS;
    this.trail = Array.from({ length: TRAIL_SEGS + 1 }, (_, i) => ({
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
    this.trail[0] = { x: this.x, y: this.y };
    for (let i = 1; i < this.trail.length; i++) {
      const a = this.trail[i - 1];
      const b = this.trail[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const m = Math.hypot(dx, dy) || 1;
      b.x = a.x + (dx / m) * this.seg;
      b.y = a.y + (dy / m) * this.seg;
    }
    return dist;
  }
}

/* ---------- radar pings ---------- */
export interface Ping {
  x: number;
  y: number;
  born: number;
  max: number;
  life: number;
  strength?: number;
}

export function drawPings(
  ctx: CanvasRenderingContext2D,
  pings: Ping[],
  now: number,
  color: string,
  base = 0.5,
) {
  ctx.strokeStyle = color;
  for (let i = pings.length - 1; i >= 0; i--) {
    const r = pings[i];
    const a = (now - r.born) / r.life;
    if (a >= 1) {
      pings.splice(i, 1);
      continue;
    }
    if (a < 0) continue;
    const e = 1 - Math.pow(1 - a, 2.2);
    const rad = r.max * e;
    const fade = Math.pow(1 - a, 1.6) * base * (r.strength ?? 1);
    if (rad < 1) continue;
    ctx.globalAlpha = fade;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
    ctx.stroke();
    // range ticks on the ring, like a radar scale
    ctx.globalAlpha = fade * 0.7;
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const ang = (k * Math.PI) / 2;
      ctx.moveTo(r.x + Math.cos(ang) * (rad - 4), r.y + Math.sin(ang) * (rad - 4));
      ctx.lineTo(r.x + Math.cos(ang) * (rad + 4), r.y + Math.sin(ang) * (rad + 4));
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/* ---------- satellite: box body, two ruled panels, one antenna ---------- */
export function drawSatellite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot: number,
  pal: SpacePalette,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.lineWidth = 1;
  ctx.strokeStyle = pal.dim;
  ctx.fillStyle = pal.hull;
  ctx.globalAlpha = 0.85;
  // panels
  for (const s of [-1, 1]) {
    const px = s * r * 0.34;
    const pw = r * 0.62;
    const x0 = s > 0 ? px : px - pw;
    ctx.beginPath();
    ctx.rect(x0, -r * 0.24, pw, r * 0.48);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    for (let k = 1; k < 4; k++) {
      const gx = x0 + (pw * k) / 4;
      ctx.moveTo(gx, -r * 0.24);
      ctx.lineTo(gx, r * 0.24);
    }
    ctx.stroke();
  }
  // body
  ctx.beginPath();
  ctx.rect(-r * 0.34, -r * 0.3, r * 0.68, r * 0.6);
  ctx.fill();
  ctx.strokeStyle = pal.starlight;
  ctx.stroke();
  // antenna
  ctx.strokeStyle = pal.dim;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.3);
  ctx.lineTo(0, -r * 0.62);
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}

/* ---------- probe ---------- */
export interface ProbeOpts {
  alpha?: number;
  /** indicator blink rate in rad/s */
  beat?: number;
}

export function drawProbe(
  ctx: CanvasRenderingContext2D,
  trail: Pt[],
  L: number,
  t: number,
  pal: SpacePalette,
  o: ProbeOpts = {},
) {
  const alpha = o.alpha ?? 1;
  const n = trail.length - 1;
  const head = trail[0];
  const ref = trail[Math.min(3, n)];
  const ang = Math.atan2(head.y - ref.y, head.x - ref.x);
  const u = L * 0.2;

  // telemetry trail: a dashed hairline back along the path
  ctx.save();
  ctx.globalAlpha = 0.55 * alpha;
  ctx.strokeStyle = pal.dim;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.moveTo(trail[0].x, trail[0].y);
  for (let i = 1; i <= n; i++) ctx.lineTo(trail[i].x, trail[i].y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(ang);
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1.2;
  // panels
  ctx.fillStyle = pal.hull;
  ctx.strokeStyle = pal.dim;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.rect(-u * 0.9, s > 0 ? u * 0.42 : -u * 1.2, u * 1.1, u * 0.78);
    ctx.fill();
    ctx.stroke();
  }
  // hull
  ctx.strokeStyle = pal.starlight;
  ctx.beginPath();
  ctx.moveTo(u * 1.25, 0);
  ctx.lineTo(-u * 0.7, -u * 0.55);
  ctx.lineTo(-u * 0.7, u * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // indicator
  const on = Math.sin(t * (o.beat ?? 4)) > 0.2;
  ctx.fillStyle = on ? pal.lit : pal.dim;
  ctx.beginPath();
  ctx.arc(-u * 0.1, 0, Math.max(1.6, u * 0.16), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}
