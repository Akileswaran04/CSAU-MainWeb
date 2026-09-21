"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { seeded, type SpaceTokens } from "./tokens";

/* ============================================================
   SPACE BODIES - built in three.js with no model files or textures:

     ParticlePlanet  Earth, Venus, Mercury and the Sun. Each is a smooth
                     surface (vertex colours from 3D noise: coastlines,
                     deserts, ice caps, craters, sunspots) with tetrahedron
                     particles on top for clouds, atmosphere haze and the
                     Sun's corona. The smooth surface keeps close-ups clear;
                     a shader lights both from the Sun (day side, terminator,
                     night side, limb glow) while the GPU spins the planet.
     ShipModel       an X-wing style fighter: long nose, cockpit,
                     astromech, four S-foil wings with engines and
                     laser cannons, animated engine flames
     UfoModel        a saucer: lens hull, glass dome, chasing rim
                     lights and an optional tractor beam
     AsteroidField   lumpy tumbling rocks (one InstancedMesh)
   ============================================================ */

function useDispose(...items: ({ dispose(): void } | null | undefined)[]) {
  useEffect(
    () => () => {
      items.forEach((i) => i?.dispose());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    items
  );
}

/* ------------------------------------------------------------
   CPU noise (value noise + fbm) for colouring the planets
   ------------------------------------------------------------ */

function h3(x: number, y: number, z: number) {
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
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return l(
    l(l(h3(ix, iy, iz), h3(ix + 1, iy, iz), fx), l(h3(ix, iy + 1, iz), h3(ix + 1, iy + 1, iz), fx), fy),
    l(l(h3(ix, iy, iz + 1), h3(ix + 1, iy, iz + 1), fx), l(h3(ix, iy + 1, iz + 1), h3(ix + 1, iy + 1, iz + 1), fx), fy),
    fz
  );
}
function fbm(x: number, y: number, z: number, oct = 5) {
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
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mix3 = (a: number[], b: number[], t: number): number[] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** #rrggbb -> [r,g,b] 0..1 (sRGB) */
const hex = (h: string): number[] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

/* ------------------------------------------------------------
   PARTICLE PLANETS
   ------------------------------------------------------------ */

export type PlanetKind = "earth" | "venus" | "mercury" | "sun";

interface Layer {
  /** x, y, z, r, g, b per particle */
  data: number[];
  size: number;
  /** limb glow multiplier in the shader */
  rim: number;
}

/** Fibonacci lattice: even coverage of the unit sphere */
function dirAt(i: number, n: number): [number, number, number] {
  const y = 1 - (2 * (i + 0.5)) / n;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const phi = i * 2.399963229728653;
  // jitter by about half a particle spacing so the lattice never shows as swirls
  const j = 1.2 / Math.sqrt(n);
  const x = Math.cos(phi) * r + (h3(i, 3.1, 7.7) - 0.5) * j;
  const yy = y + (h3(i, 9.3, 1.9) - 0.5) * j;
  const z = Math.sin(phi) * r + (h3(i, 5.5, 2.2) - 0.5) * j;
  const m = Math.hypot(x, yy, z) || 1;
  return [x / m, yy / m, z / m];
}

type Rgb = number[];

/** Everything a planet is made of: a smooth coloured surface, plus particle layers on top */
interface PlanetBuild {
  layers: Layer[];
  /** colour of the surface in a direction (unit vector), sRGB 0..1 */
  base: (x: number, y: number, z: number) => Rgb;
  /** index of the particle layer that drifts as clouds (or -1) */
  cloudLayer: number;
}

/** Desktop look: the planet is made of particles only (no smooth surface underneath) */
function particleLayers(kind: PlanetKind, radius: number, count: number, seed: number, base: (x: number, y: number, z: number) => Rgb): Layer[] {
  const c = new THREE.Color();
  const push = (layer: Layer, x: number, y: number, z: number, col: Rgb) => {
    c.setRGB(col[0], col[1], col[2], THREE.SRGBColorSpace);
    layer.data.push(x, y, z, c.r, c.g, c.b);
  };
  const rnd = seeded(seed * 7 + 3);
  const spacingFor = (n: number, r: number) => Math.sqrt((4 * Math.PI * r * r) / Math.max(1, n));

  if (kind === "earth") {
    const nSurf = Math.floor(count * 0.66);
    const nCloud = Math.floor(count * 0.24);
    const nAtmo = count - nSurf - nCloud;
    const surf: Layer = { data: [], size: spacingFor(nSurf, radius) * 0.36, rim: 0.2 };
    const cloud: Layer = { data: [], size: spacingFor(nCloud, radius) * 0.44, rim: 0.3 };
    const atmo: Layer = { data: [], size: spacingFor(nAtmo, radius * 1.1) * 0.3, rim: 0.9 };
    for (let i = 0; i < nSurf; i++) {
      const [x, y, z] = dirAt(i, nSurf);
      push(surf, x * radius, y * radius, z * radius, base(x, y, z));
    }
    const cr = radius * 1.028;
    for (let i = 0, kept = 0; i < nCloud * 3 && kept < nCloud; i++) {
      const [x, y, z] = dirAt(i, nCloud * 3);
      const d = fbm(x * 2.6 + 91, y * 4.2, z * 2.6, 5) * 0.75 + fbm(x * 6 + 5, y * 6, z * 6, 3) * 0.25;
      if (d > 0.6) {
        push(cloud, x * cr, y * cr, z * cr, mix3(hex("#dfe7f1"), hex("#ffffff"), smoothstep(0.6, 0.78, d)));
        kept++;
      }
    }
    for (let i = 0; i < nAtmo; i++) {
      const [x, y, z] = dirAt(i, nAtmo);
      const ar = radius * (1.045 + rnd() * 0.04);
      push(atmo, x * ar, y * ar, z * ar, hex("#3f86e0"));
    }
    return [surf, cloud, atmo];
  }

  if (kind === "venus") {
    const nSurf = Math.floor(count * 0.35);
    const nCloud = count - nSurf;
    const surf: Layer = { data: [], size: spacingFor(nSurf, radius) * 0.36, rim: 0.2 };
    const cloud: Layer = { data: [], size: spacingFor(nCloud, radius * 1.03) * 0.42, rim: 0.8 };
    for (let i = 0; i < nSurf; i++) {
      const [x, y, z] = dirAt(i, nSurf);
      push(surf, x * radius, y * radius, z * radius, mix3(hex("#8a5a2b"), hex("#c98c4a"), fbm(x * 3 + seed, y * 3, z * 3, 4)));
    }
    const cr = radius * 1.03;
    for (let i = 0; i < nCloud; i++) {
      const [x, y, z] = dirAt(i, nCloud);
      push(cloud, x * cr, y * cr, z * cr, base(x, y, z));
    }
    return [surf, cloud];
  }

  if (kind === "mercury") {
    const surf: Layer = { data: [], size: spacingFor(count, radius) * 0.38, rim: 0.1 };
    for (let i = 0; i < count; i++) {
      const [x, y, z] = dirAt(i, count);
      push(surf, x * radius, y * radius, z * radius, base(x, y, z));
    }
    return [surf];
  }

  const nSurf = Math.floor(count * 0.74);
  const nCorona = count - nSurf;
  const surf: Layer = { data: [], size: spacingFor(nSurf, radius) * 0.42, rim: 0 };
  const corona: Layer = { data: [], size: spacingFor(nCorona, radius * 1.3) * 0.3, rim: 0 };
  for (let i = 0; i < nSurf; i++) {
    const [x, y, z] = dirAt(i, nSurf);
    push(surf, x * radius, y * radius, z * radius, base(x, y, z));
  }
  for (let i = 0; i < nCorona; i++) {
    const [x, y, z] = dirAt(i, nCorona);
    const cr = radius * (1.04 + Math.pow(rnd(), 2.2) * 0.5);
    const t = (cr / radius - 1.04) / 0.5;
    push(corona, x * cr, y * cr, z * cr, mix3(hex("#ffb324"), hex("#e2531a"), t));
  }
  return [surf, corona];
}

function buildPlanet(kind: PlanetKind, radius: number, count: number, seed: number, smooth: boolean): PlanetBuild {
  const c = new THREE.Color();
  const push = (layer: Layer, x: number, y: number, z: number, col: Rgb) => {
    c.setRGB(col[0], col[1], col[2], THREE.SRGBColorSpace);
    layer.data.push(x, y, z, c.r, c.g, c.b);
  };
  const rnd = seeded(seed * 7 + 3);
  const spacingFor = (n: number, r: number) => Math.sqrt((4 * Math.PI * r * r) / Math.max(1, n));

  if (kind === "earth") {
    const sea = { deep: hex("#04275c"), mid: hex("#0b5aa3"), shallow: hex("#4a86d8") };
    const land = { low: hex("#3e8a3c"), dark: hex("#1f5a2b"), dry: hex("#c9a75e"), rock: hex("#7a6a58"), snow: hex("#f4f7fb") };
    const base = (x: number, y: number, z: number): Rgb => {
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
    if (!smooth) return { layers: particleLayers("earth", radius, count, seed, base), base, cloudLayer: 1 };
    const nCloud = Math.floor(count * 0.55);
    const nAtmo = count - nCloud;
    const cloud: Layer = { data: [], size: spacingFor(nCloud, radius) * 0.36, rim: 0.3 };
    const atmo: Layer = { data: [], size: spacingFor(nAtmo, radius * 1.1) * 0.18, rim: 0.9 };
    const cr = radius * 1.028;
    for (let i = 0, kept = 0; i < nCloud * 3 && kept < nCloud; i++) {
      const [x, y, z] = dirAt(i, nCloud * 3);
      // storm bands: stretch the noise along latitude
      const d = fbm(x * 2.6 + 91, y * 4.2, z * 2.6, 5) * 0.75 + fbm(x * 6 + 5, y * 6, z * 6, 3) * 0.25;
      if (d > 0.6) {
        push(cloud, x * cr, y * cr, z * cr, mix3(hex("#dfe7f1"), hex("#ffffff"), smoothstep(0.6, 0.78, d)));
        kept++;
      }
    }
    for (let i = 0; i < nAtmo; i++) {
      const [x, y, z] = dirAt(i, nAtmo);
      const ar = radius * (1.045 + rnd() * 0.04);
      push(atmo, x * ar, y * ar, z * ar, hex("#3f86e0"));
    }
    return { layers: [cloud, atmo], base, cloudLayer: 0 };
  }

  if (kind === "venus") {
    // thick swirling sulphur cloud: bands bent by noise
    const base = (x: number, y: number, z: number): Rgb => {
      const w = fbm(x * 2 + seed, y * 2, z * 2, 4);
      const band = 0.5 + 0.5 * Math.sin(y * 9 + w * 6);
      return mix3(hex("#c8a15a"), hex("#f4e2b0"), band * 0.8 + fbm(x * 5, y * 5, z * 5, 3) * 0.2);
    };
    if (!smooth) return { layers: particleLayers("venus", radius, count, seed, base), base, cloudLayer: -1 };
    const haze: Layer = { data: [], size: spacingFor(count, radius * 1.05) * 0.15, rim: 0.9 };
    for (let i = 0; i < count; i++) {
      const [x, y, z] = dirAt(i, count);
      const hr = radius * (1.035 + rnd() * 0.03);
      push(haze, x * hr, y * hr, z * hr, hex("#e6c98a"));
    }
    return { layers: [haze], base, cloudLayer: -1 };
  }

  if (kind === "mercury") {
    // crater centres (unit vectors) and radii (radians)
    const craters: { d: [number, number, number]; r: number }[] = [];
    for (let k = 0; k < 46; k++) {
      const y = rnd() * 2 - 1;
      const a = rnd() * Math.PI * 2;
      const rr = Math.sqrt(1 - y * y);
      craters.push({ d: [Math.cos(a) * rr, y, Math.sin(a) * rr], r: 0.05 + rnd() * rnd() * 0.22 });
    }
    const base = (x: number, y: number, z: number): Rgb => {
      let shade = 0.5 + (fbm(x * 4 + seed, y * 4, z * 4, 5) - 0.5) * 0.8;
      let ray = 0;
      for (const cr of craters) {
        const dot = x * cr.d[0] + y * cr.d[1] + z * cr.d[2];
        const ang = Math.acos(Math.min(1, Math.max(-1, dot)));
        const t = ang / cr.r;
        if (t < 1) {
          shade -= 0.22 * (1 - smoothstep(0.0, 0.85, t)); // dark floor
          shade += 0.28 * smoothstep(0.78, 0.98, t) * (1 - smoothstep(0.98, 1.0, t)); // bright rim
        } else if (t < 2.4) ray += 0.06 * (1 - (t - 1) / 1.4);
      }
      shade = Math.min(1, Math.max(0, shade + ray));
      return mix3(hex("#4a423b"), hex("#b3a99a"), shade);
    };
    return { layers: smooth ? [] : particleLayers("mercury", radius, count, seed, base), base, cloudLayer: -1 };
  }

  /* sun */
  const base = (x: number, y: number, z: number): Rgb => {
    const g = fbm(x * 3.2 + seed, y * 3.2, z * 3.2, 5); // large convection cells
    const f = fbm(x * 11 + 3, y * 11, z * 11, 3); // fine granulation
    let col = mix3(hex("#e2531a"), hex("#ffb324"), smoothstep(0.3, 0.75, g));
    col = mix3(col, hex("#fff1b8"), smoothstep(0.55, 0.85, f) * 0.6);
    // sunspots
    const spot = fbm(x * 2.2 + 17, y * 2.2, z * 2.2, 4);
    if (spot > 0.66 && Math.abs(y) < 0.55) col = mix3(col, hex("#5a1e08"), smoothstep(0.66, 0.74, spot) * 0.85);
    return col;
  };
  if (!smooth) return { layers: particleLayers("sun", radius, count, seed, base), base, cloudLayer: -1 };
  const corona: Layer = { data: [], size: spacingFor(count, radius * 1.3) * 0.3, rim: 0 };
  for (let i = 0; i < count; i++) {
    const [x, y, z] = dirAt(i, count);
    const cr = radius * (1.04 + Math.pow(rnd(), 2.2) * 0.5);
    const t = (cr / radius - 1.04) / 0.5;
    push(corona, x * cr, y * cr, z * cr, mix3(hex("#ffb324"), hex("#e2531a"), t));
  }
  return { layers: [corona], base, cloudLayer: -1 };
}

/* the smooth surface: vertex colours from the same noise, lit per fragment */
const BASE_VERT = /* glsl */ `
attribute vec3 color;
varying vec3 vCol;
varying vec3 vN;
varying vec3 vWP;
void main() {
  vCol = color;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const BASE_FRAG = /* glsl */ `
uniform vec3 uSun;
uniform float uAmbient;
uniform float uRim;
uniform float uEmissive;
varying vec3 vCol;
varying vec3 vN;
varying vec3 vWP;
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vWP);
  float lit = mix(uAmbient, 1.0, smoothstep(-0.1, 0.55, dot(N, uSun)));
  lit = mix(lit, 1.0, uEmissive);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.5) * uRim;
  gl_FragColor = vec4(vCol * lit * (1.0 + rim * 1.2), 1.0);
  #include <colorspace_fragment>
}`;

const PARTICLE_VERT = /* glsl */ `
uniform vec3 uSun;
uniform float uAmbient;
uniform float uRim;
uniform float uEmissive;
uniform float uLimb;
varying vec3 vCol;
void main() {
  mat4 im = modelMatrix * instanceMatrix;
  vec3 center = (im * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 pc = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 n = normalize(center - pc);
  vec3 v = normalize(cameraPosition - center);
  // haze layers only show near the planet edge, as a halo (not scattered over the face)
  if (uLimb > 0.5 && dot(n, v) > 0.42) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  float lit = mix(uAmbient, 1.0, smoothstep(-0.1, 0.55, dot(n, uSun)));
  lit = mix(lit, 1.0, uEmissive);
  float rim = pow(1.0 - max(dot(n, v), 0.0), 2.0) * uRim;
  vCol = instanceColor * lit * (1.0 + rim * 1.5);
  gl_Position = projectionMatrix * viewMatrix * im * vec4(position, 1.0);
}`;

const PARTICLE_FRAG = /* glsl */ `
varying vec3 vCol;
void main() {
  gl_FragColor = vec4(vCol, 1.0);
  #include <colorspace_fragment>
}`;

export function ParticlePlanet({
  kind,
  radius,
  count,
  sun,
  rotation = 0.06,
  seed = 1,
  grain = 1,
  smooth = false,
}: {
  kind: PlanetKind;
  radius: number;
  count: number;
  /** direction towards the Sun, world space (ignored for the Sun itself) */
  sun: THREE.Vector3;
  /** radians per second */
  rotation?: number;
  seed?: number;
  /** particle size multiplier: below 1 for planets seen close up */
  grain?: number;
  /** phones: a smooth coloured surface under the particles, for clarity. Desktop: particles only. */
  smooth?: boolean;
}) {
  const spin = useRef<THREE.Group>(null);
  const cloudGroup = useRef<THREE.Group>(null);
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([]);

  const built = useMemo(() => {
    const { layers, base, cloudLayer } = buildPlanet(kind, radius, count, seed, smooth);
    const geo = new THREE.TetrahedronGeometry(1);
    // the smooth surface: fine vertex colours from the same noise the particles used
    const big = radius > 6; // planets seen up close need the finest surface
    const fine = radius > 6;
    const sphere = smooth ? new THREE.SphereGeometry(radius * 0.996, big ? 320 : fine ? 224 : 128, big ? 160 : fine ? 112 : 64) : null;
    if (sphere) {
      const pos = sphere.attributes.position;
      const col = new Float32Array(pos.count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const m = Math.hypot(x, y, z) || 1;
        const rgb = base(x / m, y / m, z / m);
        c.setRGB(rgb[0], rgb[1], rgb[2], THREE.SRGBColorSpace);
        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;
      }
      sphere.setAttribute("color", new THREE.BufferAttribute(col, 3));
    }
    const sunDir = sun.clone().normalize();
    const mats = layers.map(
      (l) =>
        new THREE.ShaderMaterial({
          vertexShader: PARTICLE_VERT,
          fragmentShader: PARTICLE_FRAG,
          uniforms: {
            uSun: { value: sunDir },
            uAmbient: { value: kind === "sun" ? 1 : 0.07 },
            uRim: { value: l.rim },
            uEmissive: { value: kind === "sun" ? 1 : 0 },
            uLimb: { value: smooth && l.rim >= 0.85 ? 1 : 0 },
          },
        })
    );
    const baseMat = !smooth ? null : new THREE.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: BASE_FRAG,
      uniforms: {
        uSun: { value: sunDir },
        uAmbient: { value: kind === "sun" ? 1 : 0.07 },
        uRim: { value: kind === "earth" ? 0.35 : kind === "venus" ? 0.5 : 0 },
        uEmissive: { value: kind === "sun" ? 1 : 0 },
      },
    });
    return { layers, geo, mats, sphere, baseMat, cloudLayer };
  }, [kind, radius, count, seed, sun, smooth]);
  useDispose(built.geo, built.sphere, built.baseMat, ...built.mats);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const col = new THREE.Color();
    const rnd = seeded(seed + 101);
    built.layers.forEach((layer, li) => {
      const mesh = meshes.current[li];
      if (!mesh) return;
      const n = layer.data.length / 6;
      for (let i = 0; i < n; i++) {
        p.set(layer.data[i * 6], layer.data[i * 6 + 1], layer.data[i * 6 + 2]);
        e.set(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28);
        q.setFromEuler(e);
        s.setScalar(layer.size * grain * (0.75 + rnd() * 0.5));
        m.compose(p, q, s);
        mesh.setMatrixAt(i, m);
        col.setRGB(layer.data[i * 6 + 3], layer.data[i * 6 + 4], layer.data[i * 6 + 5]);
        mesh.setColorAt(i, col);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [built, seed, grain]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (spin.current) spin.current.rotation.y = -t * rotation;
    if (cloudGroup.current) cloudGroup.current.rotation.y = -t * rotation * 0.3;
  });

  // for Earth the cloud layer (index 1) turns a little faster than the ground
  return (
    <group ref={spin}>
      {built.sphere && built.baseMat && <mesh geometry={built.sphere} material={built.baseMat} frustumCulled={false} />}
      {built.layers.map((layer, i) => {
        const mesh = (
          <instancedMesh
            key={i}
            ref={(el) => {
              meshes.current[i] = el;
            }}
            args={[built.geo, built.mats[i], Math.max(1, layer.data.length / 6)]}
            frustumCulled={false}
          />
        );
        return i === built.cloudLayer ? (
          <group key={i} ref={cloudGroup}>
            {mesh}
          </group>
        ) : (
          mesh
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------
   SHIP - an X-wing style fighter. Nose points along -Z.
   ------------------------------------------------------------ */

export function ShipModel({ tokens, scale = 1, low = false }: { tokens: SpaceTokens; scale?: number; low?: boolean }) {
  const flames = useRef<(THREE.Mesh | null)[]>([]);
  const guns = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const parts = useMemo(() => {
    const seg = low ? 10 : 16;
    // fuselage: long tapering nose, wide engine section
    const profile = [
      new THREE.Vector2(0, -2.7),
      new THREE.Vector2(0.34, -2.7),
      new THREE.Vector2(0.4, -2.1),
      new THREE.Vector2(0.5, -0.7),
      new THREE.Vector2(0.44, 0.6),
      new THREE.Vector2(0.3, 1.9),
      new THREE.Vector2(0.17, 2.8),
      new THREE.Vector2(0.09, 3.5),
      new THREE.Vector2(0.03, 3.9),
      new THREE.Vector2(0, 4.0),
    ];
    const hull = new THREE.LatheGeometry(profile, seg);
    hull.rotateX(-Math.PI / 2);
    hull.scale(0.95, 0.72, 1);
    const hullEdges = new THREE.EdgesGeometry(hull, 30);

    // S-foil: trapezoid in (span, chord), thin extrusion
    const shape = new THREE.Shape();
    shape.moveTo(0.35, 0.2);
    shape.lineTo(3.0, 0.75);
    shape.lineTo(3.0, 1.35);
    shape.lineTo(0.35, 2.0);
    shape.closePath();
    const wing = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
    wing.rotateX(Math.PI / 2);
    const wingEdges = new THREE.EdgesGeometry(wing);

    const engine = new THREE.CylinderGeometry(0.24, 0.29, 1.5, 12);
    engine.rotateX(Math.PI / 2);
    const nozzle = new THREE.CylinderGeometry(0.21, 0.25, 0.16, 12, 1, true);
    nozzle.rotateX(Math.PI / 2);
    const flame = new THREE.ConeGeometry(0.19, 1, 12, 1, true);
    flame.rotateX(Math.PI / 2);
    flame.translate(0, 0, 0.5);
    const cannon = new THREE.CylinderGeometry(0.035, 0.05, 1.9, 8);
    cannon.rotateX(Math.PI / 2);
    const tip = new THREE.SphereGeometry(0.06, 8, 6);
    const cockpit = new THREE.SphereGeometry(0.34, 16, 10);
    cockpit.scale(0.85, 0.65, 1.7);
    const dome = new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const socket = new THREE.CylinderGeometry(0.2, 0.2, 0.16, 12);
    const stripe = new THREE.BoxGeometry(0.03, 0.04, 0.75);

    const white = tokens.hullLit.clone().lerp(tokens.starlight, 0.78);
    const hullMat = new THREE.MeshStandardMaterial({ color: white, roughness: 0.55, metalness: 0.12, flatShading: true });
    const wingMat = new THREE.MeshStandardMaterial({ color: white.clone().multiplyScalar(0.92), roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide, flatShading: true });
    const darkMat = new THREE.MeshStandardMaterial({ color: tokens.hull.clone().lerp(tokens.hullLit, 0.35), roughness: 0.5, metalness: 0.35 });
    const glassMat = new THREE.MeshStandardMaterial({ color: tokens.void, roughness: 0.06, metalness: 0.7, emissive: tokens.dim, emissiveIntensity: 0.22 });
    const domeMat = new THREE.MeshStandardMaterial({ color: tokens.dim.clone().lerp(tokens.starlight, 0.4), roughness: 0.5, metalness: 0.2 });
    const flameMat = new THREE.MeshBasicMaterial({ color: tokens.lit, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const stripeMat = new THREE.MeshBasicMaterial({ color: tokens.signal });
    const lines = new THREE.LineBasicMaterial({ color: tokens.hull, transparent: true, opacity: 0.55 });
    return { hull, hullEdges, wing, wingEdges, engine, nozzle, flame, cannon, tip, cockpit, dome, socket, stripe, hullMat, wingMat, darkMat, glassMat, domeMat, flameMat, stripeMat, lines };
  }, [tokens, low]);
  useDispose(
    parts.hull, parts.hullEdges, parts.wing, parts.wingEdges, parts.engine, parts.nozzle, parts.flame, parts.cannon, parts.tip, parts.cockpit, parts.dome, parts.socket, parts.stripe,
    parts.hullMat, parts.wingMat, parts.darkMat, parts.glassMat, parts.domeMat, parts.flameMat, parts.stripeMat, parts.lines
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    flames.current.forEach((f, i) => {
      if (!f) return;
      const flick = 0.85 + 0.15 * Math.sin(t * 38 + i * 2) + 0.08 * Math.sin(t * 91 + i);
      f.scale.set(1, 1, 1.4 * flick);
    });
    // cannon tips pulse in turn
    guns.current.forEach((m, i) => {
      if (m) m.color.copy(Math.sin(t * 6 + i * 1.6) > 0.55 ? tokens.signal : tokens.hull);
    });
  });

  // four S-foils in an X: angle above/below the horizontal, left and right
  const foils: { rz: number; mirror: number; key: number }[] = [
    { rz: 0.42, mirror: 1, key: 0 },
    { rz: -0.42, mirror: 1, key: 1 },
    { rz: Math.PI - 0.42, mirror: 1, key: 2 },
    { rz: Math.PI + 0.42, mirror: 1, key: 3 },
  ];

  return (
    <group scale={scale}>
      <mesh geometry={parts.hull} material={parts.hullMat} />
      <lineSegments geometry={parts.hullEdges} material={parts.lines} />
      <mesh geometry={parts.cockpit} material={parts.glassMat} position={[0, 0.36, -0.5]} />
      <mesh geometry={parts.socket} material={parts.darkMat} position={[0, 0.34, 1.4]} />
      <mesh geometry={parts.dome} material={parts.domeMat} position={[0, 0.42, 1.4]} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={parts.stripe} material={parts.stripeMat} position={[s * 0.36, 0.25, 0.4]} />
      ))}
      {foils.map((f) => (
        <group key={f.key} rotation={[0, 0, f.rz]}>
          <mesh geometry={parts.wing} material={parts.wingMat} />
          <lineSegments geometry={parts.wingEdges} material={parts.lines} />
          {/* engine pod at the wing root */}
          <mesh geometry={parts.engine} material={parts.darkMat} position={[0.95, 0.03, 1.55]} />
          <mesh geometry={parts.nozzle} material={parts.darkMat} position={[0.95, 0.03, 2.36]} />
          <mesh
            geometry={parts.flame}
            material={parts.flameMat}
            position={[0.95, 0.03, 2.4]}
            ref={(el) => {
              flames.current[f.key] = el;
            }}
          />
          {/* laser cannon at the wingtip */}
          <mesh geometry={parts.cannon} material={parts.darkMat} position={[3.0, 0.03, -0.15]} />
          <mesh geometry={parts.tip} position={[3.0, 0.03, -1.12]}>
            <meshBasicMaterial
              ref={(m) => {
                guns.current[f.key] = m;
              }}
              color={tokens.hull}
              toneMapped={false}
            />
          </mesh>
          <mesh geometry={parts.stripe} material={parts.stripeMat} position={[2.2, 0.06, 1.0]} />
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------
   UFO - lens hull, glass dome, chasing rim lights, tractor beam.
   ------------------------------------------------------------ */

const RIM_LIGHTS = 14;

export function UfoModel({ tokens, scale = 1, beam = false, phase = 0 }: { tokens: SpaceTokens; scale?: number; beam?: boolean; phase?: number }) {
  const group = useRef<THREE.Group>(null);
  const rim = useRef<THREE.InstancedMesh>(null);
  const parts = useMemo(() => {
    const profile = [
      new THREE.Vector2(0, -0.2),
      new THREE.Vector2(0.45, -0.18),
      new THREE.Vector2(0.95, -0.08),
      new THREE.Vector2(1.3, 0.0),
      new THREE.Vector2(1.0, 0.11),
      new THREE.Vector2(0.5, 0.2),
      new THREE.Vector2(0.34, 0.24),
      new THREE.Vector2(0, 0.26),
    ];
    const hull = new THREE.LatheGeometry(profile, 40);
    const hullEdges = new THREE.EdgesGeometry(hull, 20);
    const dome = new THREE.SphereGeometry(0.42, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.translate(0, 0.22, 0);
    const ring = new THREE.TorusGeometry(0.62, 0.025, 6, 40);
    ring.rotateX(Math.PI / 2);
    ring.translate(0, -0.2, 0);
    const bulb = new THREE.SphereGeometry(0.05, 8, 6);
    const cone = new THREE.CylinderGeometry(0.3, 1.25, 3.4, 28, 1, true);
    cone.translate(0, -1.9, 0);
    const hullMat = new THREE.MeshStandardMaterial({ color: tokens.hullLit.clone().lerp(tokens.starlight, 0.6), roughness: 0.4, metalness: 0.2 });
    const domeMat = new THREE.MeshStandardMaterial({ color: tokens.dim, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.5, emissive: tokens.dim, emissiveIntensity: 0.22 });
    const ringMat = new THREE.MeshBasicMaterial({ color: tokens.dim });
    const bulbMat = new THREE.MeshBasicMaterial({ color: tokens.lit, toneMapped: false });
    const beamMat = new THREE.MeshBasicMaterial({ color: tokens.lit, transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false });
    const lines = new THREE.LineBasicMaterial({ color: tokens.starlight, transparent: true, opacity: 0.2 });
    return { hull, hullEdges, dome, ring, bulb, cone, hullMat, domeMat, ringMat, bulbMat, beamMat, lines };
  }, [tokens]);
  useDispose(
    parts.hull, parts.hullEdges, parts.dome, parts.ring, parts.bulb, parts.cone,
    parts.hullMat, parts.domeMat, parts.ringMat, parts.bulbMat, parts.beamMat, parts.lines
  );

  const m = useMemo(() => new THREE.Matrix4(), []);
  const c = useMemo(() => new THREE.Color(), []);
  useEffect(() => {
    const mesh = rim.current;
    if (!mesh) return;
    for (let i = 0; i < RIM_LIGHTS; i++) {
      const a = (i / RIM_LIGHTS) * Math.PI * 2;
      m.makeTranslation(Math.cos(a) * 1.13, -0.03, Math.sin(a) * 1.13);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, c.copy(tokens.dim));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [m, c, tokens]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    const g = group.current;
    if (g) {
      g.rotation.y = t * 0.6;
      g.rotation.z = Math.sin(t * 0.7) * 0.07;
      g.rotation.x = Math.cos(t * 0.5) * 0.06;
      g.position.y = Math.sin(t * 0.9) * 0.08;
    }
    const mesh = rim.current;
    if (mesh) {
      const head = Math.floor(t * 9) % RIM_LIGHTS;
      for (let i = 0; i < RIM_LIGHTS; i++) {
        const d = (i - head + RIM_LIGHTS) % RIM_LIGHTS;
        mesh.setColorAt(i, c.copy(d < 3 ? tokens.lit : tokens.dim).multiplyScalar(d < 3 ? 1.1 : 0.45));
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group scale={scale}>
      <group ref={group}>
        <mesh geometry={parts.hull} material={parts.hullMat} />
        <lineSegments geometry={parts.hullEdges} material={parts.lines} />
        <mesh geometry={parts.dome} material={parts.domeMat} />
        <mesh geometry={parts.ring} material={parts.ringMat} />
        <instancedMesh ref={rim} args={[parts.bulb, parts.bulbMat, RIM_LIGHTS]} frustumCulled={false} />
      </group>
      {beam && <mesh geometry={parts.cone} material={parts.beamMat} />}
    </group>
  );
}

/* ------------------------------------------------------------
   ROCKS - noise-displaced asteroids (one InstancedMesh).
   ------------------------------------------------------------ */

export function AsteroidField({ tokens, positions, size = 0.4, low = false }: { tokens: SpaceTokens; positions: THREE.Vector3[]; size?: number; low?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, low ? 1 : 2);
    const p = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).normalize();
      // lumpy shape: layered sines of the direction, plus a flattening
      const n =
        Math.sin(v.x * 3.1 + v.y * 2.3) * 0.16 +
        Math.sin(v.y * 6.7 + v.z * 5.1) * 0.09 +
        Math.sin(v.z * 12.3 + v.x * 9.7) * 0.05;
      const r = 1 + n;
      p.setXYZ(i, v.x * r * 1.15, v.y * r * 0.8, v.z * r);
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: tokens.hullLit.clone().lerp(tokens.hull, 0.35), roughness: 0.95, metalness: 0.02, flatShading: true });
    const items = positions.map((_, i) => ({
      s: size * (0.4 + ((i * 37) % 10) / 9),
      rx: i * 1.7,
      ry: i * 2.3,
      wx: (((i * 13) % 7) - 3) * 0.06,
      wy: (((i * 17) % 7) - 3) * 0.06,
    }));
    return { geo, mat, items };
  }, [tokens, positions, size, low]);
  useDispose(data.geo, data.mat);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    data.items.forEach((it, i) => {
      e.set(it.rx + t * it.wx, it.ry + t * it.wy, 0);
      q.setFromEuler(e);
      sc.setScalar(it.s);
      m.compose(positions[i], q, sc);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[data.geo, data.mat, positions.length]} frustumCulled={false} />;
}
