/* ============================================================
   EARTH - the one Earth the whole site shows.

   The colour of Earth's surface and clouds in any direction, from
   CPU noise (no three.js here, so the boot preloader and a worker can
   use it). ParticlePlanet builds the 3D Earth of the start page and
   the story from these; paintEarth draws the same Earth flat, lit
   the same way, for the 2D places (the boot preloader, the hero).
   ============================================================ */

export type Rgb = number[];

/* CPU noise (value noise + fbm) */
export function h3(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number, z: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  let fx = x - ix;
  let fy = y - iy;
  let fz = z - iz;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  fz = fz * fz * (3 - 2 * fz);
  // trilinear blend of the cell's eight corners (written out: this runs millions of times)
  const a0 = h3(ix, iy, iz), a1 = h3(ix + 1, iy, iz), a2 = h3(ix, iy + 1, iz), a3 = h3(ix + 1, iy + 1, iz);
  const b0 = h3(ix, iy, iz + 1), b1 = h3(ix + 1, iy, iz + 1), b2 = h3(ix, iy + 1, iz + 1), b3 = h3(ix + 1, iy + 1, iz + 1);
  const p0 = a0 + (a1 - a0) * fx, p1 = a2 + (a3 - a2) * fx, q0 = b0 + (b1 - b0) * fx, q1 = b2 + (b3 - b2) * fx;
  const p = p0 + (p1 - p0) * fy, q = q0 + (q1 - q0) * fy;
  return p + (q - p) * fz;
}
export function fbm(x: number, y: number, z: number, oct = 5) {
  let a = 0.5;
  let s = 0;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise(x, y, z);
    x = x * 2.03 + 1.7;
    y = y * 2.03 + 9.2;
    z = z * 2.03 + 3.1;
    a *= 0.5;
  }
  return s;
}
export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const mix3 = (a: number[], b: number[], t: number): number[] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** #rrggbb -> [r,g,b] 0..1 (sRGB) */
export const hex = (h: string): number[] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

/** Earth's surface colour in a direction (unit vector, the planet's own frame), sRGB 0..1 */
export function earthColor(seed: number) {
  const sea = { deep: hex("#04275c"), mid: hex("#0b5aa3"), shallow: hex("#4a86d8") };
  const land = { low: hex("#3e8a3c"), dark: hex("#1f5a2b"), dry: hex("#c9a75e"), rock: hex("#7a6a58"), snow: hex("#f4f7fb") };
  return (x: number, y: number, z: number): Rgb => {
    const big = fbm(x * 1.15 + seed, y * 1.15, z * 1.15, 3);
    const elev = fbm(x * 2.3 + seed, y * 2.3, z * 2.3, 5) * 0.65 + big * 0.35;
    const lat = Math.abs(y);
    // land and sea are both computed and blended over a soft shoreline, so coasts are smooth
    const e = smoothstep(0.53, 0.75, elev);
    const moist = fbm(x * 3.6 + 40, y * 3.6, z * 3.6, 4);
    const dryness = smoothstep(0.62, 0.35, lat) * smoothstep(0.55, 0.4, moist);
    let ground = mix3(land.low, land.dark, smoothstep(0.35, 0.7, moist));
    ground = mix3(ground, land.dry, dryness);
    ground = mix3(ground, land.rock, smoothstep(0.55, 0.85, e));
    ground = mix3(ground, land.snow, smoothstep(0.86, 0.98, e));
    const d = smoothstep(0.53, 0.3, elev);
    let water = mix3(sea.shallow, sea.mid, smoothstep(0, 0.35, d));
    water = mix3(water, sea.deep, smoothstep(0.35, 1, d));
    // a pale shallow rim just off the coast
    water = mix3(water, sea.shallow, smoothstep(0.5, 0.53, elev) * 0.6);
    const col = mix3(water, ground, smoothstep(0.515, 0.55, elev));
    return mix3(col, land.snow, smoothstep(0.83, 0.93, lat + (fbm(x * 5, y * 5, z * 5, 3) - 0.5) * 0.18));
  };
}

/** how cloudy it is in a direction (the cloud layer's own frame): cloud where this is over 0.6. Storm bands: the
    noise is stretched along latitude. */
export const cloudDensity = (x: number, y: number, z: number) =>
  fbm(x * 2.6 + 91, y * 4.2, z * 2.6, 5) * 0.75 + fbm(x * 6 + 5, y * 6, z * 6, 3) * 0.25;
const CLOUD = [hex("#dfe7f1"), hex("#ffffff")];

/** How to look at Earth. Screen space: x right, y up, the viewer on +z (as three.js's camera sees it). */
export interface EarthView {
  /** the picture's size, px */
  w: number;
  h: number;
  /** the disc's centre and radius in the picture, px */
  cx: number;
  cy: number;
  r: number;
  /** the camera's distance from Earth's centre, in Earth radii (perspective, as the 3D scenes see it); 0 = from afar */
  dist?: number;
  /** Earth's turn about its axis (ParticlePlanet's rotation.y); the clouds turn 1.3 times as far, as there */
  spin?: number;
  /** Earth tipped towards the viewer about the screen's x axis, after the turn */
  tilt?: number;
  /** direction to the Sun (unit). None: evenly lit, no atmosphere (a face to light some other way) */
  sun?: [number, number, number];
  /** as the desktop 3D Earth shows, made of particles only: darker between them, atmosphere specks over the face */
  particles?: boolean;
  seed?: number;
}

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const srgb = (l: number) => (l <= 0.0031308 ? 12.92 * l : 1.055 * Math.pow(l, 1 / 2.4) - 0.055);
const ATMO = hex("#3f86e0").map(lin);
const HALO = 0.08; // the atmosphere's depth past the limb, in Earth radii

/** Earth as an RGBA picture (transparent round it), lit as ParticlePlanet lights it: ambient 0.07 on the night
    side, a soft terminator, a brighter limb and a blue atmosphere round the edge. */
export function paintEarth(v: EarthView): Uint8ClampedArray<ArrayBuffer> {
  const { w, h, cx, cy, r, dist = 0, spin = 0, tilt = 0, sun, particles = false, seed = 2 } = v;
  const out = new Uint8ClampedArray(w * h * 4);
  const base = earthColor(seed);
  const cs = Math.cos(spin), ss = Math.sin(spin);
  const cc = Math.cos(spin * 1.3), sc = Math.sin(spin * 1.3);
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  const persp = dist > 1;
  const tanA = persp ? 1 / Math.sqrt(dist * dist - 1) : 0;
  const [sx, sy, sz] = sun ?? [0, 0, 1];
  const reach = sun ? 1 + HALO : 1;
  const px1 = 1 / r; // one pixel, in Earth radii

  /* the atmosphere where the line of sight passes `m` radii from the centre, over ground facing (qx, qy, qz) */
  const halo = (m: number, qx: number, qy: number, qz: number) => {
    const k = 1 - (m - 1) / HALO;
    const lit = 0.05 + 0.95 * smoothstep(-0.25, 0.5, qx * sx + qy * sy + qz * sz);
    return { a: Math.min(1, k * k * 0.9 * lit), g: 1 + 0.5 * k };
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = (x + 0.5 - cx) * px1;
      const py = -(y + 0.5 - cy) * px1;
      if (px * px + py * py > reach * reach * (persp ? 1.2 : 1)) continue;
      /* the line of sight: m = how far it passes from the centre (1 = the limb); n = where it meets the ground */
      let m: number, nx: number, ny: number, nz: number, vx = 0, vy = 0, vz = 1;
      if (persp) {
        let dx = px * tanA, dy = py * tanA, dz = -1;
        const l = Math.hypot(dx, dy, dz);
        dx /= l; dy /= l; dz /= l;
        const b = dist * dz;
        const m2 = Math.max(0, dist * dist - b * b);
        m = Math.sqrt(m2);
        const t = m < 1 ? -b - Math.sqrt(1 - m2) : -b; // into the ground, or to the closest approach
        nx = dx * t; ny = dy * t; nz = dist + dz * t;
        const nl = Math.hypot(nx, ny, nz) || 1;
        nx /= nl; ny /= nl; nz /= nl;
        vx = -dx; vy = -dy; vz = -dz;
      } else {
        m = Math.hypot(px, py);
        nx = px / Math.max(m, 1); ny = py / Math.max(m, 1); nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      }
      if (m >= reach) continue;
      const o = (y * w + x) * 4;
      if (m >= 1) {
        const hl = halo(m, nx, ny, nz);
        out[o] = 255 * srgb(Math.min(1, ATMO[0] * hl.g));
        out[o + 1] = 255 * srgb(Math.min(1, ATMO[1] * hl.g));
        out[o + 2] = 255 * srgb(Math.min(1, ATMO[2] * hl.g));
        out[o + 3] = 255 * hl.a;
        continue;
      }
      /* into Earth's own frame: undo the tip, then the turn; the clouds have turned further */
      const ly = ny * ct + nz * st;
      const lz = -ny * st + nz * ct;
      let col = base(nx * cs - lz * ss, ly, nx * ss + lz * cs);
      if (particles) col = mix3(col.map((c) => c * 0.5), [0.16, 0.38, 0.72], 0.22);
      const cd = cloudDensity(nx * cc - lz * sc, ly, nx * sc + lz * cc);
      if (cd > 0.58) col = mix3(col, mix3(CLOUD[0], CLOUD[1], smoothstep(0.6, 0.78, cd)), smoothstep(0.58, 0.66, cd) * 0.92);
      let rgb: number[];
      if (sun) {
        const lit = 0.07 + 0.93 * smoothstep(-0.1, 0.55, nx * sx + ny * sy + nz * sz);
        const edge = 1 - Math.max(0, nx * vx + ny * vy + nz * vz);
        const rim = Math.pow(edge, 2.5) * 0.35;
        const air = Math.pow(edge, 3) * 0.55 * lit; // the atmosphere seen against the ground near the limb
        rgb = col.map((c, i) => srgb(Math.min(1, (lin(c) * (1 + rim * 1.2) * (1 - air) + ATMO[i] * air * 1.4) * lit)));
      } else rgb = col;
      /* the limb: a pixel only partly on the ground blends into the atmosphere beyond */
      const cover = Math.min(1, (1 - m) / px1);
      let a = 1;
      if (cover < 1 && sun) {
        const hl = halo(1, nx, ny, nz);
        rgb = rgb.map((c, i) => c * cover + srgb(Math.min(1, ATMO[i] * hl.g)) * (1 - cover));
        a = cover + hl.a * (1 - cover);
      } else if (cover < 1) a = cover;
      out[o] = 255 * rgb[0];
      out[o + 1] = 255 * rgb[1];
      out[o + 2] = 255 * rgb[2];
      out[o + 3] = 255 * a;
    }
  }
  return out;
}
