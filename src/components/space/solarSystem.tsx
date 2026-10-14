"use client";

/* Mutates three.js objects inside useFrame, the intended react-three-fiber pattern. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { seeded } from "./tokens";

/* ============================================================
   THE SOLAR SYSTEM - round the story's Sun, after the owner's
   diagram (Britannica's). The story's own Mercury, Venus and Earth
   stay where the route passes them. The rest are ahead of where the
   journey ends, so its last stop looks out on them: Mars, the
   asteroid belt, Jupiter and its four great moons, Saturn and its
   rings and Titan, Uranus on its side, Neptune and Triton, Pluto,
   the Kuiper belt, a comet in from the Oort cloud, and the Oort
   cloud itself, a far shell of ice. No orbit lines are drawn.

   Drawn to feel like space seen from a ship, not like a chart:
     - lit by the Sun, every world with its phase, a soft terminator, a black night side, its limb darkening and
       a thin glow of air on its lit edge;
     - scale: one world huge and near (Saturn, half out of frame, as
       in a flyby), one in the middle distance (Jupiter), the rest
       small and far;
     - faces from noise, warped: the giants' belts and zones with
       their turbulence (Jupiter's red spot, Neptune's bright cirrus
       and dark spot), Mars's dark ground and white cap, Pluto's
       pale heart;
     - Saturn's rings as ringlets, its C, B and A rings, the Cassini
       and Encke gaps; the planet's shadow falls on them, and theirs
       on the planet.

   Shown on portrait screens (wide screens end on the cockpit target lock): the
   worlds lie on their orbits on the far side of the Sun (`ahead`),
   lit from the Sun. Distances are squeezed as the diagram's are: an
   orbit's radius grows with the log of its distance in AU, from
   Earth's. The orbits' plane runs through the Sun and Earth, turned
   about that line so the last stop sits a little over it.
   ============================================================ */

/** AU to the scene: Earth's distance at 1 AU, growing with the log beyond */
const orbitR = (earthR: number, au: number) => earthR * (1 + 0.9 * Math.log(au));

/* the shader's worlds: 0 Mars, 1 Jupiter, 2 Saturn, 3 Uranus, 4 Neptune, 5 Pluto, 6 a moon (its own colour) */
interface Moon {
  /** across and up from its planet, in planet radii; its size in planet radii; its colour */
  at: [number, number];
  r: number;
  col: string;
}
interface Body {
  kind: number;
  au: number;
  r: number;
  /** degrees along its orbit from the point straight ahead of the last stop: spread all round the Sun, as in the
      diagram, Saturn ahead (the last stop's view) */
  off: number;
  /** its tilt: [about x, about z] */
  tilt: [number, number];
  ring?: { inner: number; outer: number; col: string; alpha: number };
  moons?: Moon[];
}
const BODIES: Body[] = [
  { kind: 0, au: 1.52, r: 12, off: 62, tilt: [0, 0.44] },
  {
    kind: 1,
    au: 5.2,
    r: 75,
    off: 128,
    tilt: [0, 0.05],
    moons: [
      { at: [1.7, -0.05], r: 0.026, col: "#e8d27a" }, // Io
      { at: [2.6, -0.08], r: 0.022, col: "#d9d2c4" }, // Europa
      { at: [-2.2, 0.06], r: 0.038, col: "#a39c90" }, // Ganymede
      { at: [-3.9, 0.12], r: 0.034, col: "#6f685f" }, // Callisto
    ],
  },
  {
    kind: 2,
    au: 9.5,
    r: 60,
    off: -1,
    tilt: [0.42, 0.32],
    ring: { inner: 1.24, outer: 2.27, col: "#e2cfa4", alpha: 0.95 },
    moons: [{ at: [-3.4, 0.9], r: 0.04, col: "#d9a45a" }], // Titan
  },
  { kind: 3, au: 19.2, r: 34, off: 196, tilt: [0.2, 1.7], ring: { inner: 1.6, outer: 1.95, col: "#bcd6e6", alpha: 0.25 } },
  { kind: 4, au: 30.1, r: 32, off: -68, tilt: [0, 0.5], moons: [{ at: [2.4, 0.3], r: 0.06, col: "#cdbfb5" }] }, // Triton
  { kind: 5, au: 39.5, r: 8, off: -132, tilt: [0, 2.1] },
];

const PLANET_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vP;
varying vec3 vW;
void main() {
  vP = normalize(position);
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const PLANET_FRAG = /* glsl */ `
uniform vec3 uL;        // towards the light
uniform float uKind;
uniform float uTime;
uniform vec3 uCol;      // a moon's colour
uniform vec3 uCentre;   // Saturn: its ring's shadow
uniform vec3 uRingN;
uniform vec2 uRing;
varying vec3 vN;
varying vec3 vP;
varying vec3 vW;
float h(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h(i), h(i + vec3(1, 0, 0)), f.x), mix(h(i + vec3(0, 1, 0)), h(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h(i + vec3(0, 0, 1)), h(i + vec3(1, 0, 1)), f.x), mix(h(i + vec3(0, 1, 1)), h(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; }
  return s;
}
/* a giant's clouds: bands along the latitude, pushed about by warped turbulence */
float bands(vec3 p, float freq, float turb) {
  vec3 q = vec3(p.x * 3.0, p.y * 9.0, p.z * 3.0);
  float w = fbm(q + vec3(0.0, 0.0, uTime * 0.004));
  float w2 = fbm(q * 2.0 + w * 2.5);
  return p.y * freq + (w2 - 0.5) * turb;
}
void main() {
  vec3 p = vP;
  float lat = p.y;
  vec3 col;
  vec3 air = vec3(0.0);
  float airK = 0.0;
  if (uKind < 0.5) { // Mars: rust, darker ground, a white cap, dusty air
    float n = fbm(p * 3.0);
    col = mix(vec3(0.74, 0.36, 0.2), vec3(0.42, 0.2, 0.12), smoothstep(0.42, 0.62, fbm(p * 2.2 + n)));
    col *= 0.85 + 0.3 * fbm(p * 14.0);
    col = mix(col, vec3(0.95, 0.94, 0.92), smoothstep(0.84, 0.9, lat + (n - 0.5) * 0.08));
    air = vec3(0.9, 0.6, 0.45); airK = 0.25;
  } else if (uKind < 1.5) { // Jupiter: cream zones, brown belts, festoons, the red spot
    float b = bands(p, 16.0, 1.4);
    float z = 0.5 + 0.5 * sin(b * 3.14159);
    col = mix(vec3(0.62, 0.42, 0.27), vec3(0.93, 0.87, 0.77), smoothstep(0.25, 0.75, z));
    col = mix(col, vec3(0.45, 0.28, 0.17), smoothstep(0.8, 1.0, 0.5 + 0.5 * sin(b * 1.7 + 1.3)) * 0.55);
    col *= 0.9 + 0.2 * fbm(vec3(p.x * 18.0, lat * 70.0, p.z * 18.0));
    vec2 s = vec2(atan(p.z, p.x) - 0.9, (lat + 0.36) * 2.4);
    float d = length(s * vec2(1.0, 1.25));
    float swirl = fbm(vec3(s * 6.0 + vec2(sin(d * 9.0), cos(d * 9.0)), 1.0));
    col = mix(col, mix(vec3(0.72, 0.3, 0.17), vec3(0.85, 0.5, 0.33), swirl), smoothstep(0.24, 0.14, d));
    col *= mix(1.0, 0.7, smoothstep(0.65, 0.98, abs(lat)));
    air = vec3(0.95, 0.85, 0.7); airK = 0.18;
  } else if (uKind < 2.5) { // Saturn: soft gold bands, a bluer north
    float b = bands(p, 11.0, 0.7);
    col = mix(vec3(0.84, 0.74, 0.54), vec3(0.93, 0.85, 0.66), smoothstep(-0.8, 0.9, sin(b * 3.14159)));
    col *= 0.96 + 0.07 * fbm(vec3(p.x * 14.0, lat * 60.0, p.z * 14.0));
    col = mix(col, vec3(0.62, 0.68, 0.72), smoothstep(0.7, 0.95, lat) * 0.6);
    air = vec3(0.95, 0.88, 0.7); airK = 0.15;
  } else if (uKind < 3.5) { // Uranus: a pale cyan haze, hardly a band
    col = mix(vec3(0.55, 0.8, 0.84), vec3(0.5, 0.74, 0.8), smoothstep(-0.5, 0.5, sin(bands(p, 6.0, 0.3) * 3.14159)));
    air = vec3(0.6, 0.9, 1.0); airK = 0.45;
  } else if (uKind < 4.5) { // Neptune: deep blue, bright cirrus, a dark spot
    float b = bands(p, 9.0, 0.9);
    col = mix(vec3(0.16, 0.3, 0.72), vec3(0.24, 0.44, 0.86), smoothstep(-0.5, 0.7, sin(b * 3.14159)));
    col = mix(col, vec3(0.88, 0.92, 1.0), smoothstep(0.72, 0.85, fbm(vec3(p.x * 6.0, lat * 30.0, p.z * 6.0))) * 0.7);
    vec2 s = vec2(atan(p.z, p.x) + 1.2, (lat + 0.25) * 2.4);
    col = mix(col, vec3(0.08, 0.14, 0.38), smoothstep(0.2, 0.1, length(s)));
    air = vec3(0.5, 0.75, 1.0); airK = 0.5;
  } else if (uKind < 5.5) { // Pluto: beige and rust, a pale heart
    float n = fbm(p * 4.0);
    col = mix(vec3(0.8, 0.7, 0.58), vec3(0.5, 0.36, 0.26), smoothstep(0.4, 0.7, n));
    vec2 heart = vec2(atan(p.z, p.x) - 0.4, lat + 0.1);
    col = mix(col, vec3(0.96, 0.93, 0.88), smoothstep(0.42, 0.28, length(heart * vec2(0.9, 1.2))));
  } else { // a moon: its colour, mottled
    col = uCol * (0.75 + 0.5 * fbm(p * 5.0));
  }

  /* the light: a soft terminator, the limb darkening, a black night side */
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float ndl = dot(N, uL);
  float ndv = max(dot(N, V), 0.0);
  float lit = smoothstep(-0.06, 0.5, ndl) * (0.25 + 0.75 * max(ndl, 0.0));
  lit *= mix(0.55, 1.0, pow(ndv, 0.35));
  /* Saturn: the shadow its rings cast */
  if (uKind > 1.5 && uKind < 2.5) {
    float t = dot(uCentre - vW, uRingN) / dot(uL, uRingN);
    if (t > 0.0) {
      float r = length(vW + uL * t - uCentre);
      float k = (r - uRing.x) / (uRing.y - uRing.x);
      float dens = step(0.0, k) * step(k, 1.0) * (0.35 + 0.5 * smoothstep(0.15, 0.3, k)) * (1.0 - 0.85 * smoothstep(0.58, 0.6, k) * (1.0 - smoothstep(0.64, 0.66, k)));
      lit *= 1.0 - dens * 0.75;
    }
  }
  vec3 c = col * lit;
  /* the air on the lit limb */
  c += air * airK * pow(1.0 - ndv, 3.0) * smoothstep(-0.25, 0.4, ndl);
  gl_FragColor = vec4(c, 1.0); // its colours are written as they are to be seen: no conversion
}`;

/* Saturn's rings: ringlets, the faint C ring, the bright B ring, the Cassini division, the A ring and its Encke
   gap; lit on the side facing the light, dimmer seen from the other; the planet's shadow across them */
const RING_VERT = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const RING_FRAG = /* glsl */ `
uniform vec3 uCol;
uniform float uAlpha;
uniform vec2 uRing;
uniform vec3 uCentre;
uniform float uR;
uniform vec3 uL;
uniform vec3 uRingN;
varying vec3 vW;
float h(float x) { return fract(sin(x * 127.1) * 43758.5453); }
void main() {
  float k = (length(vW - uCentre) - uRing.x) / (uRing.y - uRing.x);
  if (k < 0.0 || k > 1.0) discard;
  float lets = 0.72 + 0.28 * sin(k * 140.0 + h(floor(k * 60.0)) * 6.0) * sin(k * 43.0 + 1.0);
  float dens = mix(0.18, 0.45, smoothstep(0.0, 0.2, k)); // C ring
  dens = mix(dens, 1.0, smoothstep(0.2, 0.26, k));        // B ring
  dens *= 1.0 - 0.92 * smoothstep(0.58, 0.6, k) * (1.0 - smoothstep(0.64, 0.66, k)); // Cassini division
  dens *= 1.0 - 0.25 * smoothstep(0.66, 0.68, k);          // A ring, a little thinner
  dens *= 1.0 - 0.8 * smoothstep(0.885, 0.89, k) * (1.0 - smoothstep(0.9, 0.905, k)); // Encke gap
  dens *= 1.0 - smoothstep(0.96, 1.0, k);
  /* the planet's shadow: from here towards the light, does the ray meet the planet? */
  vec3 oc = vW - uCentre;
  float b = dot(oc, uL);
  float c = dot(oc, oc) - uR * uR;
  float shade = (b < 0.0 && b * b - c > 0.0) ? 0.08 : 1.0;
  vec3 V = normalize(cameraPosition - vW);
  float side = sign(dot(V, uRingN)) == sign(dot(uL, uRingN)) ? 1.0 : 0.45; // seen from the unlit side: dimmer
  float a = uAlpha * dens * lets;
  gl_FragColor = vec4(uCol * (0.55 + 0.45 * lets) * shade * side * (0.35 + 0.65 * abs(dot(uL, uRingN)) + 0.3), a);
}`;

/* the belts and the Oort cloud: points of rock and ice, scaled with distance */
const DUST_VERT = /* glsl */ `
attribute float aSize;
uniform float uPx;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uPx * 900.0 / max(1.0, -mv.z), 0.6, 3.0);
}`;
const DUST_FRAG = /* glsl */ `
uniform vec3 uCol;
uniform float uOp;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  gl_FragColor = vec4(uCol * exp(-r2 * 2.5) * uOp, 1.0);
}`;

/* the comet: a coma round its head, a long tail fading away from the light */
const TAIL_FRAG = /* glsl */ `
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(vec3(0.62, 0.86, 1.0) * pow(vUv.y, 2.4) * 0.8, 1.0);
}`;
const UV_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export function SolarSystem({
  sun,
  earth,
  ahead,
  low = false,
}: {
  sun: THREE.Vector3;
  earth: THREE.Vector3;
  /** where the journey ends and which way it looks: the outer planets lie ahead of it */
  ahead: { from: THREE.Vector3; dir: THREE.Vector3 };
  low?: boolean;
}) {
  const { viewport } = useThree();
  const built = useMemo(() => {
    const root = new THREE.Group();
    const disposables: { dispose(): void }[] = [];
    const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

    /* the orbits' plane: through the Sun and Earth, turned about that line so the last stop lies under it */
    const toEarth = earth.clone().sub(sun);
    const earthR = toEarth.length();
    const e = toEarth.clone().normalize();
    const w0 = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), e).normalize();
    let n0 = new THREE.Vector3().crossVectors(w0, e).normalize();
    if (n0.y < 0) n0 = n0.negate();
    const rel = ahead.from.clone().sub(sun);
    const a = rel.dot(n0);
    const b = rel.dot(w0);
    const R = Math.hypot(a, b);
    const want = Math.min(R * 0.6, 90); // how far over the plane the last stop sits: the planets lie low, under the constellation
    const phi = Math.acos(THREE.MathUtils.clamp(want / R, -1, 1)) - Math.atan2(b, a);
    const w = w0.clone().multiplyScalar(Math.cos(phi)).addScaledVector(n0, Math.sin(phi)).normalize();
    const n = new THREE.Vector3().crossVectors(w, e).normalize();
    const onPlane = (r: number, th: number, lift = 0) => sun.clone().addScaledVector(w, Math.cos(th) * r).addScaledVector(e, Math.sin(th) * r).addScaledVector(n, lift);
    /* the angle round an orbit of radius r that lies straight ahead of the last stop */
    const o2 = new THREE.Vector2(rel.dot(w), rel.dot(e));
    const d2 = new THREE.Vector2(ahead.dir.dot(w), ahead.dir.dot(e)).normalize();
    const aheadAt = (r: number) => {
      const bb = o2.dot(d2);
      const t = -bb + Math.sqrt(Math.max(0, bb * bb - (o2.lengthSq() - r * r)));
      const p = o2.clone().addScaledVector(d2, t);
      return Math.atan2(p.y, p.x);
    };

    const lightAt = (p: THREE.Vector3) => sun.clone().sub(p).normalize();

    /* ---- the worlds ---- */
    const time = { value: 0 };
    const sphere = keep(new THREE.SphereGeometry(1, low ? 48 : 96, low ? 24 : 48));
    const spinning: THREE.Mesh[] = [];
    const planetMat = (kind: number, L: THREE.Vector3, extra: Record<string, { value: unknown }> = {}) =>
      keep(
        new THREE.ShaderMaterial({
          uniforms: {
            uL: { value: L },
            uKind: { value: kind },
            uTime: time,
            uCol: { value: new THREE.Color("#888") },
            uCentre: { value: new THREE.Vector3() },
            uRingN: { value: new THREE.Vector3(0, 1, 0) },
            uRing: { value: new THREE.Vector2(1, 2) },
            ...extra,
          },
          vertexShader: PLANET_VERT,
          fragmentShader: PLANET_FRAG,
        })
      );
    BODIES.forEach((bd) => {
      const r = orbitR(earthR, bd.au);
      const g = new THREE.Group();
      g.position.copy(onPlane(r, aheadAt(r) + THREE.MathUtils.degToRad(bd.off), bd.kind === 5 ? r * 0.12 : 0)); // Pluto's orbit is tilted
      g.rotation.set(bd.tilt[0], 0, bd.tilt[1]);
      g.updateMatrixWorld(true);
      const L = lightAt(g.position);
      const ringN = new THREE.Vector3(0, 1, 0).applyQuaternion(g.quaternion);
      const ringR = bd.ring ? new THREE.Vector2(bd.r * bd.ring.inner, bd.r * bd.ring.outer) : new THREE.Vector2(1, 2);
      const m = new THREE.Mesh(sphere, planetMat(bd.kind, L, { uCentre: { value: g.position.clone() }, uRingN: { value: ringN }, uRing: { value: ringR } }));
      m.scale.setScalar(bd.r);
      spinning.push(m);
      g.add(m);
      if (bd.ring) {
        const rg = keep(new THREE.RingGeometry(ringR.x, ringR.y, 256, 1));
        rg.rotateX(-Math.PI / 2);
        const rm = keep(
          new THREE.ShaderMaterial({
            uniforms: {
              uCol: { value: new THREE.Color(bd.ring.col) },
              uAlpha: { value: bd.ring.alpha },
              uRing: { value: ringR },
              uCentre: { value: g.position.clone() },
              uR: { value: bd.r },
              uL: { value: L },
              uRingN: { value: ringN },
            },
            vertexShader: RING_VERT,
            fragmentShader: RING_FRAG,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
          })
        );
        g.add(new THREE.Mesh(rg, rm));
      }
      root.add(g);
      /* its moons, beside it along the orbits' plane, each lit as it is */
      bd.moons?.forEach((mn) => {
        const mp = g.position.clone().addScaledVector(w, mn.at[0] * bd.r).addScaledVector(n, mn.at[1] * bd.r);
        const moon = new THREE.Mesh(sphere, planetMat(6, lightAt(mp), { uCol: { value: new THREE.Color(mn.col) } }));
        moon.position.copy(mp);
        moon.scale.setScalar(Math.max(1.2, mn.r * bd.r * 2.4)); // moons are tiny: drawn a little larger so they read
        root.add(moon);
      });
    });

    /* ---- the asteroid belt, the Kuiper belt, the Oort cloud ---- */
    const rnd = seeded(61);
    const px = { value: 1 };
    const dust = (count: number, r0: number, r1: number, thick: number, col: string, op: number, size: number, shell = false) => {
      const pos = new Float32Array(count * 3);
      const sz = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        let p: THREE.Vector3;
        if (shell) {
          const u = rnd() * 2 - 1;
          const th = rnd() * Math.PI * 2;
          const s = Math.sqrt(1 - u * u);
          p = sun.clone().add(new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th)).multiplyScalar(r0 + rnd() * (r1 - r0)));
        } else p = onPlane(r0 + rnd() * (r1 - r0), rnd() * Math.PI * 2, (rnd() - 0.5) * thick);
        pos.set([p.x, p.y, p.z], i * 3);
        sz[i] = size * (0.4 + rnd() * 0.8);
      }
      const geo = keep(new THREE.BufferGeometry());
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
      const mat = keep(new THREE.ShaderMaterial({ uniforms: { uPx: px, uCol: { value: new THREE.Color(col) }, uOp: { value: op } }, vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      root.add(pts);
    };
    dust(low ? 1400 : 3600, orbitR(earthR, 2.1), orbitR(earthR, 3.3), 26, "#c9a888", 0.6, 1.4);
    dust(low ? 1800 : 5000, orbitR(earthR, 30), orbitR(earthR, 50), 70, "#b9d8f0", 0.55, 1.5);
    dust(low ? 900 : 2400, earthR * 6.4, earthR * 7.2, 0, "#d6e8ff", 0.45, 2, true);

    /* ---- a comet in from the Oort cloud: a bright head in its coma, its tail streaming away from the light ---- */
    const cr = orbitR(earthR, 13);
    const head = onPlane(cr, aheadAt(cr) + THREE.MathUtils.degToRad(5), 150);
    const away = lightAt(head).negate();
    const tailLen = 190;
    const tail = keep(new THREE.ConeGeometry(16, tailLen, 24, 1, true));
    tail.translate(0, -tailLen / 2, 0); // the head at the cone's tip, the tail down along -y
    const tailMat = keep(new THREE.ShaderMaterial({ vertexShader: UV_VERT, fragmentShader: TAIL_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    const tailMesh = new THREE.Mesh(tail, tailMat);
    tailMesh.position.copy(head);
    tailMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), away);
    const headMesh = new THREE.Mesh(keep(new THREE.SphereGeometry(3, 16, 12)), keep(new THREE.MeshBasicMaterial({ color: "#f2f9ff", toneMapped: false })));
    headMesh.position.copy(head);
    const coma = new THREE.Mesh(keep(new THREE.SphereGeometry(10, 16, 12)), keep(new THREE.MeshBasicMaterial({ color: "#7fc4ff", transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })));
    coma.position.copy(head);
    root.add(tailMesh, coma, headMesh);

    return { root, disposables, time, spinning, px };
  }, [sun, earth, ahead, low]);

  useEffect(() => () => built.disposables.forEach((d) => d.dispose()), [built]);
  useFrame(({ clock }, dt) => {
    built.time.value = clock.elapsedTime;
    built.px.value = viewport.dpr;
    built.spinning.forEach((m, i) => (m.rotation.y += dt * (0.02 + i * 0.006)));
  });
  return <primitive object={built.root} />;
}
