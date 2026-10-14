"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import { seeded, type SpaceTokens } from "./tokens";
import { cloudDensity, earthColor, fbm, h3, hex, mix3, smoothstep, type Rgb } from "./earth";

/* ============================================================
   SPACE BODIES - built in three.js with no model files or textures:

     ParticlePlanet  Earth, Venus, Mercury and the Sun. Each is a smooth
                     surface (vertex colours from 3D noise: coastlines,
                     deserts, ice caps, craters, solar granulation) with tetrahedron
                     particles on top for clouds, atmosphere haze and the
                     Sun's corona. The smooth surface keeps close-ups clear;
                     a shader lights both from the Sun (day side, terminator,
                     night side, limb glow) while the GPU spins the planet.
     ShipModel       a sleek faceted fighter in the armour's family:
                     gunmetal, cyan lines of light, lime trim, four
                     swept foils with engines and cannons
     UfoModel        a saucer: lens hull, glass dome, chasing rim
                     lights and an optional tractor beam
     AsteroidField   cratered tumbling rocks in three shapes, with dust

   The story's shader planets are in planet.tsx.
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
      const d = cloudDensity(x, y, z);
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
    const base = earthColor(seed);
    if (!smooth) return { layers: particleLayers("earth", radius, count, seed, base), base, cloudLayer: 1 };
    const nCloud = Math.floor(count * 0.55);
    const nAtmo = count - nCloud;
    const cloud: Layer = { data: [], size: spacingFor(nCloud, radius) * 0.36, rim: 0.3 };
    const atmo: Layer = { data: [], size: spacingFor(nAtmo, radius * 1.1) * 0.18, rim: 0.9 };
    const cr = radius * 1.028;
    for (let i = 0, kept = 0; i < nCloud * 3 && kept < nCloud; i++) {
      const [x, y, z] = dirAt(i, nCloud * 3);
      const d = cloudDensity(x, y, z);
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
    return col; // no sunspots: the owner wants the Sun without dark spots
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
   SHIP - a sleek faceted fighter, the same family as the armour
   it evolves into (armour.tsx): gunmetal, lighter on top, cyan
   lines of light, lime trim. A long wedge of a hull, a dark canopy
   behind a V of cyan, four swept foils in a shallow X, each with a
   hexagonal engine (a cyan ring, a cyan flame) and a cannon at its
   tip. Nose points along -Z. Kept inside the armour's shell, so
   the armour closes over it when the foils fold flat.
   ------------------------------------------------------------ */

// four foils in a shallow X: angle above/below the horizontal, left and right
const SHIP_FOILS: { rz: number; mirror: number; key: number }[] = [
  { rz: 0.42, mirror: 1, key: 0 },
  { rz: -0.42, mirror: 1, key: 1 },
  { rz: Math.PI - 0.42, mirror: 1, key: 2 },
  { rz: Math.PI + 0.42, mirror: 1, key: 3 },
];

const SHIP_CYAN = "#1fb4e0"; // the armour's cyan: brighter blooms to white
const SHIP_LIME = "#a5e233";
const shipFacets = (pts: number[][]) => new ConvexGeometry(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
/** gunmetal, lighter on top, darker underneath */
function shipPaint(g: THREE.BufferGeometry) {
  const top = new THREE.Color("#c3cad3");
  const low = new THREE.Color("#3e444e");
  const p = g.getAttribute("position");
  const c = new Float32Array(p.count * 3);
  const col = new THREE.Color();
  for (let i = 0; i < p.count; i++) col.copy(low).lerp(top, Math.min(1, Math.max(0, (p.getY(i) + 0.3) / 0.75))).toArray(c, i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  return g;
}
/** a line of light through a few points */
const shipStrip = (pts: number[][], r: number) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))), 16, r, 4);

/** `fold`: 0 to 1, the foils closing flat (the story's ship folds them as armour locks onto it, space/armour.tsx) */
export function ShipModel({ scale = 1, low = false, fold }: { tokens: SpaceTokens; scale?: number; low?: boolean; fold?: MutableRefObject<number> }) {
  const flames = useRef<(THREE.Mesh | null)[]>([]);
  const foilGroups = useRef<(THREE.Group | null)[]>([]);
  const guns = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const parts = useMemo(() => {
    // the hull: a long faceted wedge, a needle nose, wide and flat at the stern
    const hull = shipPaint(
      shipFacets([
        [0, 0.02, -4.0], [0.16, 0.1, -3.3], [-0.16, 0.1, -3.3], [0.12, -0.1, -3.3], [-0.12, -0.1, -3.3],
        [0.42, 0.28, -1.3], [-0.42, 0.28, -1.3], [0, 0.46, -1.0], [0.36, -0.28, -1.0], [-0.36, -0.28, -1.0],
        [0.52, 0.12, 0.5], [-0.52, 0.12, 0.5], [0, -0.36, 0.4],
        [0.46, 0.3, 2.1], [-0.46, 0.3, 2.1], [0, 0.44, 1.7], [0.42, -0.26, 2.4], [-0.42, -0.26, 2.4], [0.3, 0.06, 2.7], [-0.3, 0.06, 2.7],
      ])
    );
    const hullEdges = new THREE.EdgesGeometry(hull, 20);
    const canopy = shipFacets([[0, 0.34, -2.5], [0.2, 0.34, -1.7], [-0.2, 0.34, -1.7], [0.17, 0.4, -0.5], [-0.17, 0.4, -0.5], [0, 0.6, -1.3]]);
    // a V of light ahead of the canopy and a line down each flank
    const vee = shipStrip([[0.4, 0.3, -0.7], [0.18, 0.34, -1.8], [0, 0.36, -2.6], [-0.18, 0.34, -1.8], [-0.4, 0.3, -0.7]], 0.022);
    const flank = shipStrip([[0.15, 0.04, -3.4], [0.44, 0.1, -1.0], [0.52, 0.12, 0.5], [0.47, 0.14, 2.3]], 0.018);
    // a foil: swept back to its tip, thin, with a cyan leading edge and a lime stripe near the tip
    const foil = shipPaint(
      shipFacets([
        [0.4, 0.04, -0.3], [0.4, -0.04, -0.3], [0.4, 0.04, 2.1], [0.4, -0.04, 2.1],
        [3.0, 0.02, 0.9], [3.0, -0.02, 0.9], [3.0, 0.02, 1.55], [3.0, -0.02, 1.55],
      ])
    );
    const foilEdges = new THREE.EdgesGeometry(foil, 20);
    const lead = shipStrip([[0.45, 0.03, -0.32], [3.0, 0.02, 0.88]], 0.02);
    const stripe = shipFacets([[2.2, 0.025, 0.62], [2.2, 0.045, 0.62], [2.65, 0.025, 0.78], [2.65, 0.045, 0.78], [2.2, 0.025, 1.7], [2.2, 0.045, 1.7], [2.65, 0.025, 1.6], [2.65, 0.045, 1.6]]);
    // the engine: a hexagonal pod, a cyan ring at its nozzle, a cyan flame
    const engine = new THREE.CylinderGeometry(0.22, 0.28, 1.5, 6);
    engine.rotateX(Math.PI / 2);
    engine.rotateZ(Math.PI / 6);
    const ring = new THREE.TorusGeometry(0.21, 0.035, 6, low ? 12 : 20);
    const flame = new THREE.ConeGeometry(0.17, 1, 12, 1, true);
    flame.rotateX(Math.PI / 2);
    flame.translate(0, 0, 0.5);
    // the cannon at the tip: a slim six-sided barrel, its muzzle pulsing cyan
    const cannon = new THREE.CylinderGeometry(0.03, 0.055, 1.9, 6);
    cannon.rotateX(Math.PI / 2);
    const tip = new THREE.SphereGeometry(0.06, 8, 6);

    const metal = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.35, emissive: new THREE.Color("#1a2028"), flatShading: true, side: THREE.DoubleSide });
    const dark = new THREE.MeshStandardMaterial({ color: "#262a31", roughness: 0.5, metalness: 0.45, flatShading: true });
    const glass = new THREE.MeshStandardMaterial({ color: "#0b1a24", roughness: 0.1, metalness: 0.8, emissive: new THREE.Color(SHIP_CYAN), emissiveIntensity: 0.1, flatShading: true });
    const lime = new THREE.MeshStandardMaterial({ color: SHIP_LIME, roughness: 0.35, metalness: 0.2, emissive: new THREE.Color("#2c4a06"), flatShading: true });
    const cyan = new THREE.MeshBasicMaterial({ color: SHIP_CYAN, toneMapped: false });
    const flameMat = new THREE.MeshBasicMaterial({ color: SHIP_CYAN, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const lines = new THREE.LineBasicMaterial({ color: "#14171c", transparent: true, opacity: 0.8 });
    return { hull, hullEdges, canopy, vee, flank, foil, foilEdges, lead, stripe, engine, ring, flame, cannon, tip, metal, dark, glass, lime, cyan, flameMat, lines };
  }, [low]);
  useDispose(
    parts.hull, parts.hullEdges, parts.canopy, parts.vee, parts.flank, parts.foil, parts.foilEdges, parts.lead, parts.stripe, parts.engine, parts.ring, parts.flame, parts.cannon, parts.tip,
    parts.metal, parts.dark, parts.glass, parts.lime, parts.cyan, parts.flameMat, parts.lines
  );

  const muzzle = useMemo(() => ({ on: new THREE.Color(SHIP_CYAN), off: new THREE.Color("#262a31") }), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    flames.current.forEach((f, i) => {
      if (!f) return;
      const flick = 0.85 + 0.15 * Math.sin(t * 38 + i * 2) + 0.08 * Math.sin(t * 91 + i);
      f.scale.set(1, 1, 1.4 * flick);
    });
    // the foils close towards flat (each stays a little open, so the upper and lower ones never lie in one plane)
    if (fold)
      foilGroups.current.forEach((g, i) => {
        if (!g) return;
        const rz = SHIP_FOILS[i].rz;
        g.rotation.z = rz - 0.35 * Math.sign(Math.sin(rz)) * Math.sign(Math.cos(rz)) * fold.current;
      });
    // cannon muzzles pulse in turn
    guns.current.forEach((m, i) => {
      if (m) m.color.copy(Math.sin(t * 6 + i * 1.6) > 0.55 ? muzzle.on : muzzle.off);
    });
  });

  return (
    <group scale={scale}>
      <mesh geometry={parts.hull} material={parts.metal} />
      <lineSegments geometry={parts.hullEdges} material={parts.lines} />
      <mesh geometry={parts.canopy} material={parts.glass} />
      <mesh geometry={parts.vee} material={parts.cyan} />
      {[1, -1].map((s) => (
        <mesh key={s} geometry={parts.flank} material={parts.cyan} scale={[s, 1, 1]} />
      ))}
      {SHIP_FOILS.map((f) => (
        <group
          key={f.key}
          rotation={[0, 0, f.rz]}
          ref={(el) => {
            foilGroups.current[f.key] = el;
          }}
        >
          <mesh geometry={parts.foil} material={parts.metal} />
          <lineSegments geometry={parts.foilEdges} material={parts.lines} />
          <mesh geometry={parts.lead} material={parts.cyan} />
          <mesh geometry={parts.stripe} material={parts.lime} />
          {/* engine pod at the foil's root */}
          <mesh geometry={parts.engine} material={parts.dark} position={[0.95, 0.03, 1.55]} />
          <mesh geometry={parts.ring} material={parts.cyan} position={[0.95, 0.03, 2.32]} />
          <mesh
            geometry={parts.flame}
            material={parts.flameMat}
            position={[0.95, 0.03, 2.34]}
            ref={(el) => {
              flames.current[f.key] = el;
            }}
          />
          {/* cannon at the tip */}
          <mesh geometry={parts.cannon} material={parts.dark} position={[3.0, 0.03, -0.15]} />
          <mesh geometry={parts.tip} position={[3.0, 0.03, -1.12]}>
            <meshBasicMaterial
              ref={(m) => {
                guns.current[f.key] = m;
              }}
              color="#262a31"
              toneMapped={false}
            />
          </mesh>
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
   ROCKS - asteroids in three shapes: a sphere pushed in and out by
   noise, stretched, pocked with craters and their rims, smooth-
   shaded so a low Sun picks out the relief; each rock its own
   shade, tumbling, with dust and grit drifting among them.
   ------------------------------------------------------------ */

const ROCK_SHAPES = 3;

function rockShape(k: number, low: boolean) {
  const ico = new THREE.IcosahedronGeometry(1, low ? 2 : 4);
  ico.deleteAttribute("normal");
  ico.deleteAttribute("uv");
  const geo = mergeVertices(ico); // shared corners, so it shades smooth and never cracks
  ico.dispose();
  const rnd = seeded(41 + k * 13);
  const craters = Array.from({ length: low ? 5 : 9 }, () => ({
    v: new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize(),
    r: 0.18 + rnd() * 0.35,
    d: 0.05 + rnd() * 0.08,
  }));
  const stretch = [new THREE.Vector3(1.3, 0.8, 1), new THREE.Vector3(1, 0.75, 1.25), new THREE.Vector3(1.15, 0.95, 0.85)][k];
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    let r = 1 + (fbm(v.x * 1.4 + k * 5, v.y * 1.4, v.z * 1.4, 4) - 0.5) * 0.7 + (fbm(v.x * 4 + 3, v.y * 4, v.z * 4, 3) - 0.5) * 0.14;
    for (const c of craters) {
      const t = Math.acos(Math.min(1, Math.max(-1, v.dot(c.v)))) / c.r;
      if (t < 1) r -= c.d * (1 - t * t);
      else if (t < 1.35) r += c.d * 0.35 * (1 - (t - 1) / 0.35);
    }
    p.setXYZ(i, v.x * r * stretch.x, v.y * r * stretch.y, v.z * r * stretch.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function AsteroidField({ tokens, positions, size = 0.4, low = false }: { tokens: SpaceTokens; positions: THREE.Vector3[]; size?: number; low?: boolean }) {
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const data = useMemo(() => {
    const shapes = Array.from({ length: ROCK_SHAPES }, (_, k) => rockShape(k, low));
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.93, metalness: 0.04 });
    const rnd = seeded(77);
    const rock = tokens.dim.clone().lerp(tokens.hullLit, 0.55);
    const items = positions.map((_, i) => ({
      s: size * (0.4 + ((i * 37) % 10) / 9),
      rx: i * 1.7,
      ry: i * 2.3,
      wx: (((i * 13) % 7) - 3) * 0.06,
      wy: (((i * 17) % 7) - 3) * 0.06,
      col: rock.clone().multiplyScalar(0.6 + rnd() * 0.6).lerp(tokens.lit, rnd() * 0.12),
    }));
    /* dust and grit round each rock */
    const per = low ? 4 : 10;
    const dust = new Float32Array(positions.length * per * 3);
    positions.forEach((at, i) => {
      for (let j = 0; j < per; j++) {
        const o = (i * per + j) * 3;
        dust[o] = at.x + (rnd() - 0.5) * 7;
        dust[o + 1] = at.y + (rnd() - 0.5) * 5;
        dust[o + 2] = at.z + (rnd() - 0.5) * 7;
      }
    });
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dust, 3));
    const dustMat = new THREE.PointsMaterial({ color: tokens.dim, size: 0.07, transparent: true, opacity: 0.55, depthWrite: false });
    return { shapes, mat, items, dustGeo, dustMat };
  }, [tokens, positions, size, low]);
  useDispose(data.mat, data.dustGeo, data.dustMat, ...data.shapes);

  /* each rock's tint, once the meshes exist */
  useLayoutEffect(() => {
    data.items.forEach((it, i) => refs.current[i % ROCK_SHAPES]?.setColorAt(Math.floor(i / ROCK_SHAPES), it.col));
    refs.current.forEach((mesh) => mesh?.instanceColor && (mesh.instanceColor.needsUpdate = true));
  }, [data]);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    data.items.forEach((it, i) => {
      const mesh = refs.current[i % ROCK_SHAPES];
      if (!mesh) return;
      e.set(it.rx + t * it.wx, it.ry + t * it.wy, 0);
      q.setFromEuler(e);
      sc.setScalar(it.s);
      m.compose(positions[i], q, sc);
      mesh.setMatrixAt(Math.floor(i / ROCK_SHAPES), m);
    });
    refs.current.forEach((mesh) => mesh && (mesh.instanceMatrix.needsUpdate = true));
  });
  return (
    <>
      {data.shapes.map((geo, k) => (
        <instancedMesh
          key={k}
          ref={(el) => {
            refs.current[k] = el;
          }}
          args={[geo, data.mat, Math.max(1, Math.ceil((positions.length - k) / ROCK_SHAPES))]}
          frustumCulled={false}
        />
      ))}
      <points geometry={data.dustGeo} material={data.dustMat} frustumCulled={false} />
    </>
  );
}
