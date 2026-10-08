"use client";

/* This file deliberately mutates three.js objects and shader uniforms inside useFrame, which is
   the intended react-three-fiber pattern. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ============================================================
   PLANETS - the story's Earth, Venus, Mercury and Sun, each one
   sphere lit per pixel by a shader (no model files, no image
   files):

     Earth    the site's one Earth: its colours and clouds are
              earth.ts's, painted once into a map (earthMap.ts, in
              a worker); the shader adds what the map is too coarse
              for up close (ragged cloud edges, ground texture), the
              sea's glint of the Sun, towns lit on the night side,
              a warm terminator and the blue air at the limb, plus a
              thin atmosphere round the edge.
     Venus    sulphur cloud bands, bent by noise and drifting, under
              a pale haze.
     Mercury  grey crust under craters and their rims, lit as
              relief so the low Sun throws them into shadow.
     Sun      boiling granulation (no sunspots), darker and redder
              towards the limb, and a corona round it.

   The sphere turns (rotation, radians a second); `sun` is the
   direction to the Sun in world space. `low` (phones) takes fewer
   noise octaves and a smaller Earth map.
   ============================================================ */

export type PlanetKind = "earth" | "venus" | "mercury" | "sun";

/* ---------------- Earth's map: painted once per size, shared ---------------- */

type EarthMap = { px: Uint8Array<ArrayBuffer>; w: number; h: number };
const maps = new Map<string, Promise<EarthMap>>();
let worker: Worker | null | undefined;
let seq = 0;
const waiting = new Map<number, (px: Uint8Array<ArrayBuffer>) => void>();

const paintOnMain = (w: number, h: number, seed: number) => import("./earthMap").then((m) => m.paintEarthMap(w, h, seed));

function paint(w: number, h: number, seed: number): Promise<Uint8Array<ArrayBuffer>> {
  if (worker === undefined) {
    try {
      worker = new Worker(new URL("./earthMap.worker.ts", import.meta.url));
      worker.onmessage = (e: MessageEvent<{ id: number; px: Uint8Array<ArrayBuffer> }>) => {
        waiting.get(e.data.id)?.(e.data.px);
        waiting.delete(e.data.id);
      };
      worker.onerror = () => {
        worker = null; // ponytail: jobs already sent are lost; there is only ever one (the story's Earth)
      };
    } catch {
      worker = null;
    }
  }
  if (!worker) return paintOnMain(w, h, seed);
  const id = ++seq;
  worker.postMessage({ id, w, h, seed });
  return new Promise((resolve) => waiting.set(id, resolve));
}

/** Earth's map at width w (started on first call, then shared). */
function earthMapAt(w: number, seed: number): Promise<EarthMap> {
  const h = w / 2;
  const key = `${w}:${seed}`;
  let m = maps.get(key);
  if (!m) {
    m = paint(w, h, seed).then((px) => ({ px, w, h }));
    maps.set(key, m);
  }
  return m;
}

/** The first map this device draws Earth with; the story waits for it before it draws. Desktops then
    paint a finer one in the background (EARTH_MAPS) and swap it in. */
const EARTH_MAPS = (low: boolean) => (low ? [384] : [512, 1024]);
export const earthMap = (low: boolean, seed = 2) => earthMapAt(EARTH_MAPS(low)[0], seed);

/* ---------------- shaders ---------------- */

/* 3D simplex noise: Ashima Arts / Stefan Gustavson (MIT licence), and fbm on it */
export const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
/* about 0 .. 1 */
float fbm(vec3 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < OCT; i++) {
    s += a * snoise(p);
    p = p * 2.03 + 1.7;
    a *= 0.5;
  }
  return s * 0.5 + 0.5;
}
vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }
`;

const VERT = /* glsl */ `
varying vec3 vDir; // the planet's own frame, unit
varying vec3 vN; // world
varying vec3 vWP;
void main() {
  vDir = normalize(position);
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const SURFACE = /* glsl */ `
uniform vec3 uSun;
uniform float uTime;
uniform float uCloudTurn;
uniform float uRadius;
uniform sampler2D uMap;
varying vec3 vDir;
varying vec3 vN;
varying vec3 vWP;

vec2 eqr(vec3 d) { return vec2(atan(d.z, d.x) / 6.2831853 + 0.5, asin(clamp(d.y, -1.0, 1.0)) / 3.1415927 + 0.5); }

/* craters: one per cell, of a random size; a bowl and a raised rim */
vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453);
}
float craters(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  float h = 0.0;
  for (int z = -1; z <= 1; z++)
    for (int y = -1; y <= 1; y++)
      for (int x = -1; x <= 1; x++) {
        vec3 o = vec3(float(x), float(y), float(z));
        vec3 r = hash3(i + o);
        float rad = 0.14 + 0.32 * r.x * r.y;
        float d = length(f - (o + 0.2 + r * 0.6)) / rad;
        h += d < 1.0 ? (d * d - 1.0) * 0.7 : 0.0;
        h += exp(-pow((d - 1.0) * 4.5, 2.0)) * 0.22;
      }
  return h;
}

/* bump: the normal tipped by the slope of a height field (screen-space derivatives) */
vec3 bump(vec3 N, float h) {
  vec3 dpx = dFdx(vWP);
  vec3 dpy = dFdy(vWP);
  vec3 r1 = cross(dpy, N);
  vec3 r2 = cross(N, dpx);
  float det = dot(dpx, r1);
  vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
  return normalize(abs(det) * N - grad);
}

void main() {
  vec3 d = normalize(vDir);
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vWP);
  vec3 L = normalize(uSun);
  vec3 outc;

#if defined(EARTH)
  vec4 m = texture2D(uMap, eqr(d));
  vec3 col = m.rgb;
  float water = smoothstep(0.1, 0.24, col.b - col.r);
  float snow = smoothstep(0.78, 0.9, min(col.r, min(col.g, col.b)));
  /* ground texture finer than the map */
  float grain = snoise(d * 48.0) * 0.6 + snoise(d * 130.0) * 0.4;
  col *= 1.0 + grain * 0.09 * (1.0 - water);
  /* the cloud layer has turned further than the ground; its edges ragged */
  float ct = cos(uCloudTurn);
  float st = sin(uCloudTurn);
  vec3 cd = vec3(d.x * ct + d.z * st, d.y, -d.x * st + d.z * ct);
  float cloud = texture2D(uMap, eqr(cd)).a + (snoise(cd * 24.0 + uTime * 0.01) * 0.6 + snoise(cd * 70.0) * 0.4) * 0.05;
  float cov = smoothstep(0.58, 0.66, cloud) * 0.92;
  col = mix(col, mix(vec3(0.875, 0.906, 0.945), vec3(1.0), smoothstep(0.6, 0.78, cloud)), cov);
  vec3 c = toLinear(col);

  float ndl = dot(N, L);
  float day = smoothstep(-0.08, 0.3, ndl);
  float lit = 0.015 + 0.985 * day * (0.25 + 0.75 * max(ndl, 0.0));
  float edge = 1.0 - max(dot(N, V), 0.0);
  vec3 air = toLinear(vec3(0.247, 0.525, 0.878));
  float haze = pow(edge, 3.0) * 0.6 * day;
  outc = c * lit * (1.0 - haze) + air * haze * 1.4;
  /* the Sun's glint on open sea */
  vec3 H = normalize(L + V);
  float nh = max(dot(N, H), 0.0);
  outc += vec3(1.0, 0.93, 0.8) * (pow(nh, 300.0) * 0.5 + pow(nh, 40.0) * 0.02) * water * (1.0 - cov) * day;
  /* sunset along the terminator */
  float dusk = smoothstep(-0.12, 0.0, ndl) * (1.0 - smoothstep(0.0, 0.2, ndl));
  outc += vec3(0.85, 0.32, 0.08) * dusk * (0.06 + haze * 0.6);
  /* towns on the night side, in clusters along the land */
  float towns = smoothstep(0.62, 0.9, snoise(d * 22.0) * 0.5 + 0.5) * smoothstep(0.5, 0.95, snoise(d * 140.0) * 0.5 + 0.5);
  outc += vec3(1.0, 0.68, 0.3) * towns * (1.0 - water) * (1.0 - snow) * (1.0 - cov * 0.85) * (1.0 - smoothstep(-0.2, 0.02, ndl)) * 0.75;

#elif defined(VENUS)
  float t = uTime * 0.006; // the clouds race round faster than the planet turns
  vec3 q = vec3(d.x * cos(t) + d.z * sin(t), d.y, -d.x * sin(t) + d.z * cos(t));
  float w = fbm(q * 2.0);
  float band = 0.5 + 0.5 * sin(q.y * 9.0 + w * 6.0);
  vec3 col = mix(vec3(0.784, 0.631, 0.353), vec3(0.957, 0.886, 0.69), band * 0.75 + fbm(q * 6.0 + 3.0) * 0.25);
  float ndl = dot(N, L);
  float lit = 0.01 + 0.99 * smoothstep(-0.1, 0.45, ndl) * (0.35 + 0.65 * max(ndl, 0.0));
  float edge = 1.0 - max(dot(N, V), 0.0);
  float haze = pow(edge, 2.5) * 0.5 * smoothstep(-0.25, 0.4, ndl);
  outc = toLinear(col) * lit * (1.0 - haze) + toLinear(vec3(0.9, 0.79, 0.54)) * haze * 1.3;

#elif defined(MERCURY)
  float h = craters(d * 5.0) + craters(d * 13.0 + 4.0) * 0.45 + (fbm(d * 9.0) - 0.5) * 0.5;
  vec3 Nb = bump(N, h * uRadius * 0.012);
  float shade = clamp(0.45 + (fbm(d * 3.0 + 9.0) - 0.5) * 0.9 + h * 0.08, 0.0, 1.0);
  vec3 col = mix(vec3(0.29, 0.259, 0.231), vec3(0.702, 0.663, 0.604), shade);
  float ndl = dot(Nb, L);
  /* the night side is not quite black: light scattered off the Sun's glow shows the craters faintly */
  float lit = 0.05 * (0.6 + 0.4 * max(dot(Nb, -L), 0.0)) + 0.95 * max(ndl, 0.0) * smoothstep(-0.05, 0.15, dot(N, L));
  outc = toLinear(col) * lit;
  /* seen from its night side, a crescent of the lit limb */
  outc += toLinear(vec3(0.7, 0.66, 0.6)) * pow(1.0 - max(dot(N, V), 0.0), 3.0) * smoothstep(-0.15, 0.35, dot(N, L)) * 0.8;

#else /* the Sun */
  float t = uTime * 0.02;
  float big = fbm(d * 2.6 + vec3(0.0, t, 0.0));
  float gran = snoise(d * 70.0 + vec3(t * 3.0, 0.0, -t * 2.0)) * 0.5 + 0.5;
  gran = gran * 0.6 + (snoise(d * 120.0 - t * 4.0) * 0.5 + 0.5) * 0.4;
  vec3 col = mix(vec3(1.0, 0.55, 0.16), vec3(1.0, 0.82, 0.42), smoothstep(0.25, 0.75, big));
  col = mix(col, vec3(1.0, 0.96, 0.8), smoothstep(0.5, 0.9, gran) * 0.45);
  col *= 0.9 + 0.1 * gran; // no sunspots: the owner wants the Sun without dark spots
  float mu = max(dot(N, V), 0.0);
  float limb = 0.3 + 0.7 * pow(mu, 0.5); // darker and redder towards the edge
  outc = toLinear(col) * limb * mix(vec3(1.0, 0.6, 0.35), vec3(1.0), mu) * 1.35;
#endif

  gl_FragColor = vec4(outc, 1.0);
  #include <colorspace_fragment>
}`;

/* the atmosphere past the limb: where the line of sight passes within the shell, lit on the Sun's side */
const AIR_FRAG = /* glsl */ `
uniform vec3 uSun;
uniform vec3 uCenter;
uniform float uRadius;
uniform float uDepth;
uniform vec3 uColor;
varying vec3 vWP;
void main() {
  vec3 R = normalize(vWP - cameraPosition);
  vec3 toC = uCenter - cameraPosition;
  vec3 P = cameraPosition + R * dot(toC, R);
  float m = length(P - uCenter) / uRadius;
  float k = clamp(1.0 - (m - 1.0) / uDepth, 0.0, 1.0);
  float lit = 0.04 + 0.96 * smoothstep(-0.3, 0.5, dot(normalize(P - uCenter), normalize(uSun)));
  gl_FragColor = vec4(uColor * k * k * lit, 1.0);
}`;

const AIR_VERT = /* glsl */ `
varying vec3 vWP;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

/* the corona: a glow facing the camera, streaked, slowly changing */
const CORONA_FRAG = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * 2.0 * 3.0; // in Sun radii
  float r = length(p);
  float a = atan(p.y, p.x);
  float streak = snoise(vec3(cos(a) * 2.5, sin(a) * 2.5, uTime * 0.03)) * 0.5 + 0.5;
  float fall = exp(-(r - 1.0) * mix(4.5, 2.2, streak));
  float glow = smoothstep(0.96, 1.02, r) * fall * (1.0 - smoothstep(2.0, 2.8, r));
  vec3 col = mix(vec3(1.0, 0.45, 0.12), vec3(1.0, 0.8, 0.45), exp(-(r - 1.0) * 2.0));
  gl_FragColor = vec4(col * glow * 0.5, 1.0);
}`;

const CORONA_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const AIR: Partial<Record<PlanetKind, { depth: number; color: [number, number, number] }>> = {
  earth: { depth: 0.07, color: [0.12, 0.38, 0.95] },
  venus: { depth: 0.06, color: [0.75, 0.6, 0.32] },
};

export function Planet({
  kind,
  radius,
  sun,
  rotation = 0.06,
  low = false,
  seed = 2,
}: {
  kind: PlanetKind;
  radius: number;
  /** direction towards the Sun, world space (ignored for the Sun itself) */
  sun: THREE.Vector3;
  /** radians per second */
  rotation?: number;
  low?: boolean;
  /** Earth's map (earth.ts's seed) */
  seed?: number;
}) {
  const { camera } = useThree();
  const spin = useRef<THREE.Group>(null);
  const air = useRef<THREE.Mesh>(null);
  const corona = useRef<THREE.Mesh>(null);

  const built = useMemo(() => {
    const seg = radius > 6 ? (low ? 112 : 192) : low ? 64 : 112;
    const geo = new THREE.SphereGeometry(radius, seg, seg / 2);
    const time = { value: 0 };
    const blank = new THREE.DataTexture(new Uint8Array([11, 90, 163, 0]), 1, 1); // open sea until the map is painted
    blank.needsUpdate = true;
    const mat = new THREE.ShaderMaterial({
      defines: { [kind.toUpperCase()]: "", OCT: low ? 3 : 5 },
      uniforms: {
        uSun: { value: sun.clone().normalize() },
        uTime: time,
        uCloudTurn: { value: 0 },
        uRadius: { value: radius },
        uMap: { value: blank },
      },
      vertexShader: VERT,
      fragmentShader: NOISE_GLSL + SURFACE,
    });
    const a = AIR[kind];
    const airGeo = a ? new THREE.SphereGeometry(radius * (1 + a.depth), low ? 64 : 96, low ? 32 : 48) : null;
    const airMat = a
      ? new THREE.ShaderMaterial({
          uniforms: {
            uSun: { value: sun.clone().normalize() },
            uCenter: { value: new THREE.Vector3() },
            uRadius: { value: radius },
            uDepth: { value: a.depth },
            uColor: { value: new THREE.Vector3(...a.color) },
          },
          vertexShader: AIR_VERT,
          fragmentShader: AIR_FRAG,
          side: THREE.BackSide,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      : null;
    const coronaGeo = kind === "sun" ? new THREE.PlaneGeometry(radius * 6, radius * 6) : null;
    const coronaMat =
      kind === "sun"
        ? new THREE.ShaderMaterial({
            defines: { OCT: 1 },
            uniforms: { uTime: time },
            vertexShader: CORONA_VERT,
            fragmentShader: NOISE_GLSL + CORONA_FRAG,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        : null;
    return { geo, mat, blank, time, airGeo, airMat, coronaGeo, coronaMat };
  }, [kind, radius, sun, low]);

  useEffect(
    () => () => {
      [built.geo, built.mat, built.blank, built.airGeo, built.airMat, built.coronaGeo, built.coronaMat].forEach((x) => x?.dispose());
    },
    [built]
  );

  /* Earth: the map, once painted */
  useEffect(() => {
    if (kind !== "earth") return;
    let live = true;
    let tex: THREE.DataTexture | null = null;
    for (const size of EARTH_MAPS(low))
      earthMapAt(size, seed).then(({ px, w, h }) => {
        if (!live || (tex && tex.image.width >= w)) return;
        const next = new THREE.DataTexture(px, w, h);
        next.wrapS = THREE.RepeatWrapping;
        next.magFilter = THREE.LinearFilter;
        next.minFilter = THREE.LinearFilter; // no mipmaps: they would seam where the map wraps round
        next.needsUpdate = true;
        built.mat.uniforms.uMap.value = next;
        tex?.dispose();
        tex = next;
      });
    return () => {
      live = false;
      tex?.dispose();
    };
  }, [kind, low, seed, built]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    built.time.value = t;
    built.mat.uniforms.uCloudTurn.value = t * rotation * 0.3; // as the site's Earth: clouds turn 1.3 times as far
    if (spin.current) spin.current.rotation.y = -t * rotation;
    if (air.current && built.airMat) air.current.getWorldPosition(built.airMat.uniforms.uCenter.value);
    if (corona.current) corona.current.quaternion.copy(camera.quaternion);
  });

  return (
    <>
      <group ref={spin}>
        <mesh geometry={built.geo} material={built.mat} />
      </group>
      {built.airGeo && built.airMat && <mesh ref={air} geometry={built.airGeo} material={built.airMat} />}
      {built.coronaGeo && built.coronaMat && <mesh ref={corona} geometry={built.coronaGeo} material={built.coronaMat} />}
    </>
  );
}
