"use client";

/* This file deliberately mutates the camera and three.js objects inside useFrame, which is
   the intended react-three-fiber pattern. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { OPENING_EARTH, STOPS } from "./stops";
import { COCKPIT_MQ } from "./Cockpit";
import { SatelliteModel } from "../space/models";
import { AsteroidField, ShipModel, UfoModel } from "../space/bodies";
import { ShipArmour } from "../space/armour";
import { SolarSystem } from "../space/solarSystem";
import { NOISE_GLSL, Planet, earthMap } from "../space/planet";
import { Bloom } from "../space/Bloom";
import { isMobileViewport, readTokens, seeded, type SpaceTokens } from "../space/tokens";
import { useSettled } from "../space/useSettled";

/* ============================================================
   SPACE SCENE - from Earth to the Sun, on a spaceship.

   A ship leaves a turning Earth (seas that catch the Sun, clouds,
   towns lit on the night side, a blue rim of air) and follows a
   route through space, one stop at a time: past Venus, through a
   belt of cratered asteroids with saucers, past Mercury, and on to
   a boiling Sun with its corona. Stars of every colour and
   brightness drift past; the Milky Way lies across the sky behind.
   Scroll drives the ship. The camera rides behind it and to its
   right, aimed down the route ahead, so the view follows the
   trajectory rather than the ship.

   Everything is a pure function of scroll progress, so scrolling back
   flies back. All geometry is built in three.js - no model files.
   ============================================================ */

const { clamp } = THREE.MathUtils;
const smooth = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

const S = STOPS.length;
const Z0 = -34; // first stop, just above Earth's surface
const Z1 = -254; // last stop, in front of the Sun

/** stop i in world space: a gentle S-curve away from Earth */
const stopPos = (i: number) =>
  new THREE.Vector3(3 * Math.sin(i * 0.8 + 0.4), 1.8 * Math.cos(i * 1.1 + 0.5), Z0 + ((Z1 - Z0) * i) / (S - 1));

const EARTH_R = 24;
const layoutFor = (portrait: boolean) => ({
  // portrait: the world is centred so every body is fully on screen
  earth: portrait ? new THREE.Vector3(-6, -24, 0) : new THREE.Vector3(-24, -5, 0),
  // high ahead: the route swings once round it (buildRoute) before its last stop, out past it
  sun: portrait ? new THREE.Vector3(26, 75, Z1 - 250) : new THREE.Vector3(88, 80, Z1 - 250),
  reach: portrait ? 0.28 : 1, // how far off the route planets and saucers stand
});

/* scroll progress -> fractional stop index, in step with StorySection's weights */
const KEYS: number[] = (() => {
  const W = STOPS.reduce((a, s) => a + s.weight, 0);
  let acc = 0;
  return STOPS.map((st) => {
    const p = (acc + st.weight / 2) / W;
    acc += st.weight;
    return p;
  });
})();

/** 0 … S-1, easing to a halt at every stop. The last leg, once round the Sun, is one long steady glide that eases
    only at its ends, so the loop plays like a film instead of surging through its middle. */
function stopFloat(p: number): number {
  if (p <= KEYS[0]) return 0;
  for (let i = 1; i < S; i++) {
    if (p <= KEYS[i]) {
      const f = (p - KEYS[i - 1]) / Math.max(1e-6, KEYS[i] - KEYS[i - 1]);
      return i - 1 + (i === S - 1 ? glide(f, 0.14) : smooth(f));
    }
  }
  return S - 1;
}

/** 0 to 1 at a steady speed, easing up to it over the first `a` and down from it over the last `a` */
function glide(f: number, a: number) {
  const v = 1 / (1 - a);
  if (f < a) return (v * f * f) / (2 * a);
  if (f > 1 - a) return 1 - (v * (1 - f) ** 2) / (2 * a);
  return v * (f - a / 2);
}

/* ---------------- The sky: stars of every colour and brightness, and the Milky Way ---------------- */

/* a star: a hot point in a faint glow; the bright ones twinkle and throw thin diffraction spikes */
const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
attribute float aTw;
uniform float uTime;
uniform float uPx;
varying vec3 vColor;
varying float vSize;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 1.0 - step(1.5, aSize) * 0.3 * (0.5 + 0.5 * sin(uTime * (1.3 + aTw * 2.6) + aTw * 50.0));
  vColor = aColor * tw;
  vSize = aSize;
  gl_PointSize = aSize * uPx * 4.0;
}`;
const STAR_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vSize;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  float a = exp(-r2 * 40.0) * 1.5 + exp(-r2 * 9.0) * 0.16;
  float sp = smoothstep(2.3, 3.3, vSize) * 0.5;
  a += sp * (exp(-abs(p.x) * 34.0) * exp(-p.y * p.y * 2.5) + exp(-abs(p.y) * 34.0) * exp(-p.x * p.x * 2.5));
  a *= 1.0 - smoothstep(0.7, 1.0, r2);
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * a, 1.0);
  #include <colorspace_fragment>
}`;

/* the Milky Way's glow: a soft band, brighter towards the galaxy's core, split by dark dust lanes */
const BAND_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
/* drawn once into the sky's cube map (Field), so none of this costs a frame */
const BAND_FRAG = /* glsl */ `
vec3 nebula(vec3 d, vec3 c, float size, vec3 color) {
  float ang = acos(clamp(dot(d, c), -1.0, 1.0));
  float m = exp(-pow(ang / size, 2.0));
  if (m < 0.002) return vec3(0.0);
  float wisp = smoothstep(0.3, 0.85, fbm(d * 5.0 + c * 7.0));
  float knot = smoothstep(0.55, 0.9, fbm(d * 13.0 - c * 3.0));
  return color * m * (0.2 + 0.8 * wisp + 0.5 * knot) * 0.09;
}
vec3 galaxy(vec3 d, vec3 c, float size, float turn) {
  if (dot(d, c) < 0.99) return vec3(0.0);
  vec3 t1 = normalize(cross(c, abs(c.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 t2 = cross(c, t1);
  vec2 q = vec2(dot(d, t1), dot(d, t2)) / size;
  q = mat2(cos(turn), -sin(turn), sin(turn), cos(turn)) * q;
  q.y *= 2.6; // seen tilted
  float r = length(q);
  float arms = 0.55 + 0.45 * sin(atan(q.y, q.x) * 2.0 - r * 9.0);
  float k = exp(-r * r * 40.0) * 1.4 + exp(-r * 3.5) * 0.35 * arms;
  return vec3(1.0, 0.92, 0.82) * k * 0.09;
}
uniform vec3 uPole;
uniform vec3 uCore;
uniform vec3 uColor;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float lat = asin(clamp(dot(d, uPole), -1.0, 1.0));
  vec3 along = normalize(d - uPole * dot(d, uPole) + 1e-5);
  float core = 0.35 + 0.65 * pow(max(0.0, dot(along, uCore)), 4.0);
  float width = mix(0.11, 0.2, core);
  float band = exp(-pow(lat / width, 2.0)) * core;
  float cloud = fbm(d * 3.5);
  float lanes = smoothstep(0.5, 0.72, fbm(d * 8.0 + 5.0)) * exp(-pow(lat / (width * 0.45), 2.0));
  float k = band * (0.4 + 0.6 * cloud) * (1.0 - lanes * 0.75);
  vec3 col = uColor * k;
  /* nebulae: coloured clouds in their own parts of the sky, wispy */
  col += nebula(d, normalize(vec3(-0.65, 0.25, -0.7)), 0.42, vec3(0.5, 0.16, 0.7));
  col += nebula(d, normalize(vec3(0.2, -0.45, 0.85)), 0.5, vec3(0.1, 0.42, 0.55));
  col += nebula(d, normalize(vec3(-0.85, -0.35, 0.3)), 0.38, vec3(0.65, 0.25, 0.12));
  col += nebula(d, normalize(vec3(0.8, -0.2, -0.25)), 0.32, vec3(0.2, 0.5, 0.35));
  /* distant galaxies: small tilted spirals, each a bright core in faint arms */
  col += galaxy(d, normalize(vec3(-0.35, 0.55, -0.75)), 0.035, 0.6);
  col += galaxy(d, normalize(vec3(0.55, 0.15, -0.8)), 0.022, 2.1);
  col += galaxy(d, normalize(vec3(-0.75, -0.1, -0.6)), 0.028, 1.2);
  col += galaxy(d, normalize(vec3(0.15, 0.7, 0.7)), 0.04, 2.7);
  col += galaxy(d, normalize(vec3(0.9, 0.3, 0.3)), 0.025, 0.3);
  col += galaxy(d, normalize(vec3(-0.4, -0.6, 0.7)), 0.03, 1.7);
  col += galaxy(d, normalize(vec3(0.3, -0.75, -0.6)), 0.02, 0.9);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

const SKY_R = 600; // the far sky rides with the camera, inside its far plane (900)

export function Field({ tokens, mobile }: { tokens: SpaceTokens; mobile: boolean }) {
  const sky = useRef<THREE.Group>(null);
  const parts = useMemo(() => {
    const rnd = seeded(9);
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(Math.PI * 2 * rnd());
    /* star colours, by how hot: blue-white, white, yellow, orange, red; kept close to the site's starlight */
    const white = tokens.starlight;
    const hues = [
      white.clone().lerp(new THREE.Color(0.62, 0.74, 1), 0.55),
      white.clone(),
      white.clone().lerp(tokens.lit, 0.25),
      white.clone().lerp(tokens.lit, 0.6),
      white.clone().lerp(tokens.signal, 0.55),
    ];
    const hueAt = (r: number) => hues[r < 0.1 ? 0 : r < 0.55 ? 1 : r < 0.8 ? 2 : r < 0.95 ? 3 : 4];
    const build = (n: number, place: (i: number, p: Float32Array) => void, sizeOf: () => number, lum: () => number) => {
      const pos = new Float32Array(n * 3);
      const col = new Float32Array(n * 3);
      const size = new Float32Array(n);
      const tw = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        place(i, pos);
        size[i] = sizeOf();
        const c = hueAt(rnd());
        const l = lum() * (0.6 + size[i] * 0.25);
        col.set([c.r * l, c.g * l, c.b * l], i * 3);
        tw[i] = rnd();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
      g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
      g.setAttribute("aTw", new THREE.BufferAttribute(tw, 1));
      return g;
    };
    /* near: the stars the ship flies among, so they drift past */
    const near = build(
      mobile ? 900 : 2400,
      (i, p) => p.set([(rnd() - 0.5) * 520, (rnd() - 0.5) * 300, -480 + rnd() * 540], i * 3),
      () => 0.55 + 2.9 * Math.pow(rnd(), 7),
      () => 0.35 + 0.65 * rnd()
    );
    /* far: thousands of faint stars crowding into the Milky Way */
    const pole = new THREE.Vector3(0.32, 0.86, -0.4).normalize();
    const e1 = new THREE.Vector3(0, 0, 1).cross(pole).normalize();
    const e2 = pole.clone().cross(e1);
    const core = new THREE.Vector3(-0.3, 0.2, -1).projectOnPlane(pole).normalize();
    const coreLon = Math.atan2(core.dot(e2), core.dot(e1));
    const v = new THREE.Vector3();
    const far = build(
      mobile ? 2600 : 8000,
      (i, p) => {
        let lon = 0;
        do lon = rnd() * Math.PI * 2;
        while (rnd() > 0.3 + 0.7 * Math.pow(Math.max(0, Math.cos(lon - coreLon)), 2));
        const lat = rnd() < 0.25 ? gauss() * 0.6 : gauss() * 0.1;
        v.copy(e1).multiplyScalar(Math.cos(lon) * Math.cos(lat)).addScaledVector(e2, Math.sin(lon) * Math.cos(lat)).addScaledVector(pole, Math.sin(lat));
        p.set([v.x * SKY_R, v.y * SKY_R, v.z * SKY_R], i * 3);
      },
      () => 0.35 + 0.7 * Math.pow(rnd(), 3),
      () => 0.22 + 0.3 * rnd()
    );
    const time = { value: 0 };
    const px = { value: 1 };
    const starMat = new THREE.ShaderMaterial({
      uniforms: { uTime: time, uPx: px },
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const bandGeo = new THREE.SphereGeometry(SKY_R + 5, 48, 24);
    const bandMat = new THREE.ShaderMaterial({
      defines: { OCT: mobile ? 3 : 5 },
      uniforms: { uPole: { value: pole }, uCore: { value: core }, uColor: { value: white.clone().lerp(tokens.lit, 0.15).multiplyScalar(0.035) } },
      vertexShader: BAND_VERT,
      fragmentShader: NOISE_GLSL + BAND_FRAG,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    /* The band sits at infinity, so it depends only on the direction: its noise is drawn once into a cube map
       (half float: it is very dim) and the sky just samples that. Live, it cost ~18ms a frame on a laptop GPU. */
    const baked = new THREE.WebGLCubeRenderTarget(mobile ? 512 : 1024, { type: THREE.HalfFloatType });
    const skyMat = new THREE.ShaderMaterial({
      uniforms: { uSky: { value: baked.texture } },
      vertexShader: BAND_VERT,
      fragmentShader: `uniform samplerCube uSky;\nvarying vec3 vDir;\nvoid main() {\n  gl_FragColor = vec4(textureCube(uSky, vDir).rgb, 1.0);\n  #include <colorspace_fragment>\n}`,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { near, far, starMat, bandGeo, bandMat, baked, skyMat, time, px };
  }, [tokens, mobile]);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const bake = new THREE.Scene();
    bake.add(new THREE.Mesh(parts.bandGeo, parts.bandMat));
    new THREE.CubeCamera(1, SKY_R * 2, parts.baked).update(gl, bake);
  }, [gl, parts]);
  useEffect(
    () => () => {
      [parts.near, parts.far, parts.starMat, parts.bandGeo, parts.bandMat, parts.baked, parts.skyMat].forEach((x) => x.dispose());
    },
    [parts]
  );
  useFrame(({ clock, camera, viewport }) => {
    parts.time.value = clock.elapsedTime;
    parts.px.value = viewport.dpr;
    sky.current?.position.copy(camera.position);
  });
  return (
    <>
      <group ref={sky}>
        <mesh geometry={parts.bandGeo} material={parts.skyMat} renderOrder={-2} />
        <points geometry={parts.far} material={parts.starMat} frustumCulled={false} renderOrder={-1} />
      </group>
      <points geometry={parts.near} material={parts.starMat} frustumCulled={false} />
    </>
  );
}

/* ---------------- The route: dim line, lit up to the ship ---------------- */

/* The route as a stream of nano particles: a tight core with a looser haze round it, each one fizzing a little,
   pulses of light running along them; gold behind the ship (the way it has come), faint ahead, brightest round it */
const ROUTE_VERT = /* glsl */ `
attribute float aU;
attribute vec3 aJit;
attribute float aSize;
uniform float uTime;
uniform float uShip;
uniform float uPx;
varying float vLit;
varying float vGlow;
void main() {
  vec3 p = position + aJit * (0.65 + 0.35 * sin(uTime * 1.7 + aU * 900.0));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vLit = step(aU, uShip);
  float pulse = 0.5 + 0.5 * sin(aU * 700.0 - uTime * 5.0);
  float near = exp(-abs(aU - uShip) * 80.0);
  vGlow = mix(0.22 + 0.25 * pulse, 0.7 + 0.3 * pulse, vLit) + near * 1.2;
  gl_PointSize = min(7.0, aSize * uPx * (1.0 + near) * 26.0 / max(1.0, -mv.z));
}`;
const ROUTE_FRAG = /* glsl */ `
uniform vec3 uDim;
uniform vec3 uLit;
varying float vLit;
varying float vGlow;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0) discard;
  gl_FragColor = vec4(mix(uDim, uLit, vLit) * exp(-r2 * 3.0) * vGlow, 1.0);
  #include <colorspace_fragment>
}`;

export function Route({ curve, tokens, tp, mobile = false }: { curve: THREE.CatmullRomCurve3; tokens: SpaceTokens; tp: MutableRefObject<number>; mobile?: boolean }) {
  const parts = useMemo(() => {
    const rnd = seeded(5);
    const n = mobile ? 4500 : 11000;
    const pos = new Float32Array(n * 3);
    const u = new Float32Array(n);
    const jit = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const t = Math.min(1, (i + rnd()) / n);
      curve.getPoint(t, v);
      const loose = rnd() < 0.45; // the haze round the core
      const r = (loose ? 0.12 + rnd() * 0.45 : rnd() * 0.08) * (0.8 + rnd() * 0.4);
      const a = rnd() * Math.PI * 2;
      const b = Math.acos(rnd() * 2 - 1);
      pos.set([v.x + Math.sin(b) * Math.cos(a) * r, v.y + Math.sin(b) * Math.sin(a) * r, v.z + Math.cos(b) * r], i * 3);
      jit.set([(rnd() - 0.5) * 0.1, (rnd() - 0.5) * 0.1, (rnd() - 0.5) * 0.1], i * 3);
      u[i] = t;
      size[i] = loose ? 0.4 + rnd() * 0.5 : 0.7 + rnd() * 0.7;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aU", new THREE.BufferAttribute(u, 1));
    geo.setAttribute("aJit", new THREE.BufferAttribute(jit, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    const uniforms = {
      uTime: { value: 0 },
      uShip: { value: 0 },
      uPx: { value: 1 },
      uDim: { value: tokens.dim.clone().lerp(new THREE.Color(0.55, 0.8, 1), 0.35) },
      uLit: { value: tokens.lit.clone() },
    };
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: ROUTE_VERT, fragmentShader: ROUTE_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    return { geo, mat, uniforms, points: new THREE.Points(geo, mat) };
  }, [curve, tokens, mobile]);
  useEffect(
    () => () => {
      parts.geo.dispose();
      parts.mat.dispose();
    },
    [parts]
  );
  useFrame(({ clock, viewport }) => {
    parts.uniforms.uTime.value = clock.elapsedTime;
    parts.uniforms.uShip.value = tp.current;
    parts.uniforms.uPx.value = viewport.dpr;
  });
  parts.points.frustumCulled = false;
  return <primitive object={parts.points} />;
}

/* ---------------- Beacons: one small ring per stop ---------------- */

export interface Burst {
  id: number;
  pos: THREE.Vector3;
}

/** one beacon at each of `positions` (the route's stops) */
export function Beacons({
  tokens,
  sf,
  burst,
  positions,
}: {
  tokens: SpaceTokens;
  sf: MutableRefObject<number>;
  burst: MutableRefObject<Burst>;
  positions: THREE.Vector3[];
}) {
  const S = positions.length;
  const { camera } = useThree();
  const parts = useMemo(() => {
    const core = new THREE.IcosahedronGeometry(0.12, 1);
    const ring = new THREE.RingGeometry(0.62, 0.65, 40);
    const mk = <T extends THREE.Material>(f: () => T) => Array.from({ length: S }, f);
    return {
      core,
      ring,
      coreMats: mk(() => new THREE.MeshBasicMaterial({ color: tokens.dim })),
      ringMats: mk(() => new THREE.MeshBasicMaterial({ color: tokens.dim, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })),
    };
  }, [tokens, S]);
  useEffect(
    () => () => {
      parts.core.dispose();
      parts.ring.dispose();
      [...parts.coreMats, ...parts.ringMats].forEach((m) => m.dispose());
    },
    [parts]
  );
  const groups = useRef<(THREE.Group | null)[]>([]);
  const tmp = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < S; i++) {
      const on = clamp(sf.current - i + 0.5, 0, 1);
      const near = clamp(1 - Math.abs(sf.current - i) * 1.4, 0, 1);
      tmp.copy(tokens.dim).lerp(tokens.lit, on);
      parts.coreMats[i].color.copy(tmp);
      parts.ringMats[i].color.copy(tmp);
      const g = groups.current[i];
      if (g) {
        g.quaternion.copy(camera.quaternion);
        g.scale.setScalar(1 + near * (0.4 + 0.1 * Math.sin(t * 5)));
      }
    }
  });
  return (
    <>
      {positions.map((p, i) => (
        <group
          key={i}
          position={p}
          ref={(el) => {
            groups.current[i] = el;
          }}
        >
          <mesh geometry={parts.core} material={parts.coreMats[i]} />
          <mesh geometry={parts.ring} material={parts.ringMats[i]} />
        </group>
      ))}
      <Pings tokens={tokens} burst={burst} />
    </>
  );
}

/* ---------------- Radar pings (billboarded) ---------------- */

const PINGS = 4;

function Pings({ tokens, burst }: { tokens: SpaceTokens; burst: MutableRefObject<Burst> }) {
  const { camera } = useThree();
  const parts = useMemo(() => {
    const geo = new THREE.RingGeometry(0.996, 1, 72);
    const mats = Array.from(
      { length: PINGS },
      () => new THREE.MeshBasicMaterial({ color: tokens.dim, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
    );
    return { geo, mats };
  }, [tokens]);
  useEffect(
    () => () => {
      parts.geo.dispose();
      parts.mats.forEach((m) => m.dispose());
    },
    [parts]
  );
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const born = useRef<number[]>(new Array(PINGS).fill(-1e9));
  const seen = useRef(-1);
  const next = useRef(0);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (burst.current.id !== seen.current) {
      seen.current = burst.current.id;
      const i = next.current;
      next.current = (i + 1) % PINGS;
      born.current[i] = t;
      meshes.current[i]?.position.copy(burst.current.pos);
    }
    parts.mats.forEach((m, i) => {
      const age = (t - born.current[i]) / 2.4;
      const mesh = meshes.current[i];
      if (!mesh) return;
      mesh.visible = age >= 0 && age < 1;
      if (!mesh.visible) return;
      mesh.quaternion.copy(camera.quaternion);
      mesh.scale.setScalar(0.7 + age * 3);
      m.opacity = (1 - age) * 0.5;
    });
  });
  return (
    <>
      {parts.mats.map((m, i) => (
        <mesh
          key={i}
          geometry={parts.geo}
          material={m}
          visible={false}
          ref={(el) => {
            meshes.current[i] = el;
          }}
        />
      ))}
    </>
  );
}

/* ---------------- Satellites orbiting Earth ---------------- */

function Orbiters({ tokens, earth }: { tokens: SpaceTokens; earth: THREE.Vector3 }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const orbits = useMemo(
    () => [
      { r: 34, w: 0.09, ph: 0.6, tilt: 0.5 },
      { r: 39, w: -0.06, ph: 3.2, tilt: -0.35 },
    ],
    []
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    orbits.forEach((o, i) => {
      const g = refs.current[i];
      if (!g) return;
      const a = o.ph + t * o.w;
      g.position.set(earth.x + Math.cos(a) * o.r, earth.y + Math.sin(a) * o.r * Math.sin(o.tilt), earth.z + Math.sin(a) * o.r * Math.cos(o.tilt));
      g.rotation.set(0.3, -a, 0.2);
    });
  });
  return (
    <>
      {orbits.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <SatelliteModel tokens={tokens} scale={1.4} />
        </group>
      ))}
    </>
  );
}

/* ---------------- Warp: the streaks of light the ship rushes through, on its way to a page ---------------- */

/* a streak: a line along the tunnel (its own -z ahead), its head running back past the ship, longer the faster it
   goes; dim far ahead, brightest as it passes */
const WARP_VERT = /* glsl */ `
attribute float aEnd;
attribute vec3 aS;
uniform float uTime;
uniform float uSpeed;
varying float vA;
const float LEN = 360.0;
void main() {
  float head = mod(aS.z * (LEN + 40.0) + uTime * (30.0 + 320.0 * uSpeed), LEN + 40.0) - LEN;
  float z = head - (1.0 - aEnd) * (1.0 + 60.0 * uSpeed);
  vec4 mv = modelViewMatrix * vec4(cos(aS.x) * aS.y, sin(aS.x) * aS.y, z, 1.0);
  gl_Position = projectionMatrix * mv;
  vA = smoothstep(-LEN, -LEN * 0.55, z) * (0.35 + 0.65 * aEnd);
}`;
const WARP_FRAG = /* glsl */ `
uniform float uFade;
varying float vA;
void main() {
  gl_FragColor = vec4(mix(vec3(0.25, 0.7, 1.0), vec3(1.0), vA * vA) * vA * uFade, 1.0);
}`;
/* the dark round the tunnel: the world outside fades as the warp takes hold */
const SHELL_FRAG = /* glsl */ `
uniform float uFade;
void main() {
  gl_FragColor = vec4(0.0, 0.01, 0.03, uFade * 0.92);
}`;
/* the light at the end of the tunnel */
const GLOW_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const GLOW_FRAG = /* glsl */ `
uniform float uFade;
uniform float uSpeed;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  gl_FragColor = vec4(vec3(0.75, 0.9, 1.0) * pow(max(0.0, 1.0 - d), 3.0) * uFade * (0.4 + uSpeed), 1.0);
}`;

/** the warp tunnel's clock: wall time, so the loader's copy of the tunnel (WarpShip) streams in step with this one */
export const warpClock = () => (performance.now() % 600000) / 1000;

export interface WarpUniforms {
  uTime: { value: number };
  uSpeed: { value: number };
  uFade: { value: number };
}

/** A tunnel of light streaks in its own frame, running along -z; the Director puts it on the ship. */
export function WarpTunnel({ u, mobile, anchor }: { u: WarpUniforms; mobile: boolean; anchor: MutableRefObject<THREE.Group | null> }) {
  const built = useMemo(() => {
    const rnd = seeded(91);
    const n = mobile ? 420 : 1200;
    const end = new Float32Array(n * 2);
    const s = new Float32Array(n * 6);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 3 + rnd() * 11;
      const ph = rnd();
      end.set([0, 1], i * 2);
      s.set([a, r, ph, a, r, ph], i * 6);
    }
    const streakGeo = new THREE.BufferGeometry();
    streakGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 6), 3));
    streakGeo.setAttribute("aEnd", new THREE.BufferAttribute(end, 1));
    streakGeo.setAttribute("aS", new THREE.BufferAttribute(s, 3));
    const additive = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false } as const;
    const streakMat = new THREE.ShaderMaterial({ uniforms: { uTime: u.uTime, uSpeed: u.uSpeed, uFade: u.uFade }, vertexShader: WARP_VERT, fragmentShader: WARP_FRAG, ...additive });
    const shellGeo = new THREE.SphereGeometry(60, 24, 16);
    const shellMat = new THREE.ShaderMaterial({ uniforms: { uFade: u.uFade }, vertexShader: GLOW_VERT, fragmentShader: SHELL_FRAG, transparent: true, depthWrite: false, side: THREE.BackSide });
    const glowGeo = new THREE.PlaneGeometry(140, 140);
    const glowMat = new THREE.ShaderMaterial({ uniforms: { uFade: u.uFade, uSpeed: u.uSpeed }, vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, ...additive });
    return { streakGeo, streakMat, shellGeo, shellMat, glowGeo, glowMat };
  }, [u, mobile]);
  useEffect(() => () => Object.values(built).forEach((x) => x.dispose()), [built]);
  return (
    <group ref={anchor} visible={false}>
      <mesh geometry={built.shellGeo} material={built.shellMat} renderOrder={10} />
      <mesh geometry={built.glowGeo} material={built.glowMat} position={[0, 0, -300]} renderOrder={11} />
      <lineSegments geometry={built.streakGeo} material={built.streakMat} frustumCulled={false} renderOrder={11} />
    </group>
  );
}

/* ---------------- The route: the stops, once round the Sun, and out past it ---------------- */

const SUN_R = 60; // the Sun's radius, as drawn below
const EVOLVE_S = 3.6; // how long the armour takes to lock on
const LOOP_R = 125; // how close the flyby passes: its distance from the Sun's centre (some way off: room for the flares)

/** Every stop up to the last but one, then once round the Sun, and out past it to the last stop. `stops` are where
    the stops are; `tOf` turns a fractional stop index into the curve's parameter (a CatmullRom curve's parameter
    runs evenly through its points, so each stop sits at its point's share of it). */
function buildRoute(sun: THREE.Vector3) {
  const pts: THREE.Vector3[] = [];
  const idx: number[] = [];
  for (let i = 0; i < S - 1; i++) {
    idx.push(pts.length);
    pts.push(stopPos(i));
  }
  const d = sun.clone().sub(pts[pts.length - 1]).normalize(); // towards the Sun
  const u = new THREE.Vector3().crossVectors(d, Y_UP).normalize(); // its right
  const v = new THREE.Vector3().crossVectors(u, d).normalize(); // its up
  const round = (deg: number) => {
    const a = THREE.MathUtils.degToRad(deg);
    return sun.clone().addScaledVector(d, -Math.cos(a) * LOOP_R).addScaledVector(u, Math.sin(a) * LOOP_R).addScaledVector(v, Math.sin(a / 2) * 14);
  };
  // in past its right, round the far side and the near side, back to the right: once round
  for (let deg = 45; deg <= 405; deg += 45) pts.push(round(deg));
  // and out the way it was going, to the last stop, past the Sun
  idx.push(pts.length);
  pts.push(round(405).addScaledVector(d.clone().add(u).normalize(), 170));
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const last = pts.length - 1;
  const tOf = (sf: number) => {
    const x = clamp(sf, 0, S - 1);
    const i = Math.min(Math.floor(x), S - 2);
    return (idx[i] + (idx[i + 1] - idx[i]) * (x - i)) / last;
  };
  /* the same, but by distance along the route: where the curve's points are spaced unevenly (round the Sun)
     the ship's speed would jump at each point; the ship flies by this one */
  curve.arcLengthDivisions = 4000;
  const lens = curve.getLengths();
  const lenAt = (t: number) => lens[Math.round(t * 4000)];
  const tAt = (sf: number) => {
    const x = clamp(sf, 0, S - 1);
    const i = Math.min(Math.floor(x), S - 2);
    const a = lenAt(idx[i] / last);
    return curve.getUtoTmapping(0, a + (lenAt(idx[i + 1] / last) - a) * (x - i)); // by distance (u is then unused)
  };
  /* the share of the last leg (Contact to the last stop) that is the loop round the Sun, by distance */
  const legFrom = lenAt(idx[S - 2] / last);
  const loopShare = (lenAt((last - 1) / last) - legFrom) / (lenAt(1) - legFrom);
  return { curve, stops: idx.map((i) => pts[i]), tOf, tAt, loopShare };
}

/* ---------------- Solar flares: loops of plasma rising off the Sun, flowing, then fading, each in its own time ---------------- */

const FLARE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const FLARE_FRAG = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform float uPeriod;
uniform float uOn;
varying vec2 vUv;
void main() {
  float ph = fract(uTime / uPeriod + uSeed);
  float life = smoothstep(0.0, 0.25, ph) * (1.0 - smoothstep(0.6, 1.0, ph));
  float rise = smoothstep(0.0, 0.45, ph); // the loop climbs from both feet to its top
  float d = abs(vUv.x - 0.5) * 2.0; // 1 at the feet, 0 at the top
  float shown = smoothstep(1.0 - rise - 0.08, 1.0 - rise, d);
  float flow = 0.6 + 0.4 * sin(vUv.x * 14.0 - uTime * 2.5 + uSeed * 30.0); // plasma pulsing along the loop
  vec3 col = mix(vec3(1.0, 0.3, 0.05), vec3(1.0, 0.7, 0.3), flow * (1.0 - d * 0.6));
  gl_FragColor = vec4(col * life * shown * flow * 1.1 * uOn, 1.0);
}`;

/** `on`: 0 to 1, how far the flares are shown (only while the ship goes round the Sun) */
function SolarFlares({ radius, low, on }: { radius: number; low: boolean; on: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const built = useMemo(() => {
    const rnd = seeded(77);
    const time = { value: 0 };
    const shown = { value: 0 };
    const list = Array.from({ length: low ? 5 : 9 }, (_, i) => {
      const dir = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
      const side = new THREE.Vector3().crossVectors(dir, Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).normalize().applyAxisAngle(dir, rnd() * Math.PI);
      const big = i % 4 === 0; // a few great eruptions among the small loops
      const r = big ? 22 + rnd() * 10 : 7 + rnd() * 9;
      const foot = dir.clone().multiplyScalar(radius - r * 0.12);
      const pts = Array.from({ length: 25 }, (_, k) => {
        const a = (Math.PI * k) / 24;
        return foot.clone().addScaledVector(side, Math.cos(a) * r).addScaledVector(dir, Math.sin(a) * r * 1.3);
      });
      const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, big ? 2.2 : 1.1 + rnd() * 0.6, 8);
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: time, uOn: shown, uSeed: { value: rnd() }, uPeriod: { value: big ? 9 + rnd() * 4 : 5 + rnd() * 4 } },
        vertexShader: FLARE_VERT,
        fragmentShader: FLARE_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      return { geo, mat };
    });
    return { list, time, shown };
  }, [radius, low]);
  useEffect(() => () => built.list.forEach(({ geo, mat }) => (geo.dispose(), mat.dispose())), [built]);
  useFrame(({ clock }) => {
    built.time.value = clock.elapsedTime;
    built.shown.value = on.current;
    if (group.current) group.current.visible = on.current > 0.005;
  });
  return (
    <group ref={group}>
      {built.list.map(({ geo, mat }, i) => (
        <mesh key={i} geometry={geo} material={mat} />
      ))}
    </group>
  );
}

/* ---------------- Round the Sun: an eruption across the route, and sunlight streaming into the ship ---------------- */

/* the eruption: a great loop of plasma rising off the Sun right under the route (`uP` 0 to 0.5), which snaps (0.5)
   and blasts out across it as a cloud of burning particles (0.5 to 1) */
const ERUPT_FRAG = /* glsl */ `
uniform float uTime;
uniform float uP;
varying vec2 vUv;
void main() {
  float rise = smoothstep(0.0, 0.5, uP);
  float gone = 1.0 - smoothstep(0.5, 0.6, uP);
  float d = abs(vUv.x - 0.5) * 2.0;
  float shown = smoothstep(1.0 - rise - 0.08, 1.0 - rise, d);
  float flow = 0.6 + 0.4 * sin(vUv.x * 18.0 - uTime * 4.0);
  vec3 col = mix(vec3(1.0, 0.22, 0.03), vec3(1.0, 0.62, 0.22), flow * (1.0 - d * 0.5));
  gl_FragColor = vec4(col * shown * gone * flow * 0.85, 1.0);
}`;
const BLAST_VERT = /* glsl */ `
attribute vec3 aDir;
attribute float aSpeed;
uniform float uP;
uniform float uPx;
uniform vec3 uTop;
varying float vA;
varying float vB;
void main() {
  float b = clamp((uP - 0.5) / 0.5, 0.0, 1.0);
  float e = 1.0 - (1.0 - b) * (1.0 - b);
  vec4 mv = modelViewMatrix * vec4(uTop + aDir * aSpeed * e * 110.0, 1.0);
  gl_Position = projectionMatrix * mv;
  vB = b;
  vA = b > 0.0 ? 1.0 - b : 0.0;
  gl_PointSize = vA > 0.0 ? min(9.0, uPx * 260.0 / max(1.0, -mv.z)) : 0.0;
}`;
const BLAST_FRAG = /* glsl */ `
varying float vA;
varying float vB;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0 || vA <= 0.0) discard;
  gl_FragColor = vec4(mix(vec3(1.0, 0.9, 0.6), vec3(1.0, 0.25, 0.04), vB) * exp(-r2 * 3.0) * vA, 1.0);
  #include <colorspace_fragment>
}`;

type EruptUniforms = { uP: { value: number }; uTime: { value: number }; uPx: { value: number } };

/** in the Sun's own space: `dir` from its centre to where it erupts, `side` the way its loop spans (across the route) */
function Eruption({ radius, dir, side, u, low }: { radius: number; dir: THREE.Vector3; side: THREE.Vector3; u: EruptUniforms; low: boolean }) {
  const group = useRef<THREE.Group>(null);
  const built = useMemo(() => {
    const H = 52; // the loop's height: up to just under the route
    const foot = dir.clone().multiplyScalar(radius - 2);
    const pts = Array.from({ length: 25 }, (_, k) => {
      const a = (Math.PI * k) / 24;
      return foot.clone().addScaledVector(side, Math.cos(a) * 26).addScaledVector(dir, Math.sin(a) * H);
    });
    const arcGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 3.5, 10);
    const add = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false } as const;
    const arcMat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: FLARE_VERT, fragmentShader: ERUPT_FRAG, side: THREE.DoubleSide, ...add });
    const rnd = seeded(31);
    const n = low ? 1500 : 4000;
    const dirs = new Float32Array(n * 3);
    const speed = new Float32Array(n);
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      v.set(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).multiplyScalar(0.7).add(dir).normalize();
      dirs.set([v.x, v.y, v.z], i * 3);
      speed[i] = 0.3 + rnd() * 0.7;
    }
    const blastGeo = new THREE.BufferGeometry();
    blastGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    blastGeo.setAttribute("aDir", new THREE.BufferAttribute(dirs, 3));
    blastGeo.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    const blastMat = new THREE.ShaderMaterial({ uniforms: { ...u, uTop: { value: dir.clone().multiplyScalar(radius + H) } }, vertexShader: BLAST_VERT, fragmentShader: BLAST_FRAG, ...add, toneMapped: false });
    return { arcGeo, arcMat, blastGeo, blastMat };
  }, [radius, dir, side, u, low]);
  useEffect(() => () => [built.arcGeo, built.arcMat, built.blastGeo, built.blastMat].forEach((x) => x.dispose()), [built]);
  useFrame(({ viewport }) => {
    u.uPx.value = viewport.dpr;
    if (group.current) group.current.visible = u.uP.value > 0 && u.uP.value < 1;
  });
  return (
    <group ref={group}>
      <mesh geometry={built.arcGeo} material={built.arcMat} />
      <points geometry={built.blastGeo} material={built.blastMat} frustumCulled={false} />
    </group>
  );
}

/* sunlight streaming into the ship as it charges: particles leave the Sun's face and curve in to the ship, gold
   turning cyan as they reach it (world space; `uTo` is the ship) */
const STREAM_VERT = /* glsl */ `
attribute vec3 aSeed;
attribute float aPh;
uniform vec3 uFrom;
uniform vec3 uTo;
uniform float uTime;
uniform float uOn;
uniform float uPx;
varying float vA;
varying float vPh;
void main() {
  float ph = fract(uTime * 0.35 + aPh);
  vec3 dir = normalize(uTo - uFrom);
  vec3 a = uFrom + normalize(dir + aSeed * 0.5) * ${SUN_R + 2}.0;
  vec3 m = mix(a, uTo, 0.5) + aSeed * 22.0;
  float e = ph * ph;
  vec3 p = mix(mix(a, m, e), mix(m, uTo, e), e);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vPh = ph;
  vA = uOn * smoothstep(0.0, 0.1, ph) * (1.0 - smoothstep(0.85, 1.0, ph));
  gl_PointSize = vA > 0.0 ? min(7.0, uPx * 160.0 / max(1.0, -mv.z)) : 0.0;
}`;
const STREAM_FRAG = /* glsl */ `
varying float vA;
varying float vPh;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0 || vA <= 0.0) discard;
  gl_FragColor = vec4(mix(vec3(1.0, 0.72, 0.25), vec3(0.15, 0.75, 0.95), smoothstep(0.5, 1.0, vPh)) * exp(-r2 * 3.0) * vA, 1.0);
  #include <colorspace_fragment>
}`;

type StreamUniforms = { uFrom: { value: THREE.Vector3 }; uTo: { value: THREE.Vector3 }; uTime: { value: number }; uOn: { value: number }; uPx: { value: number } };

function SunStream({ u, low }: { u: StreamUniforms; low: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const built = useMemo(() => {
    const rnd = seeded(43);
    const n = low ? 1200 : 3200;
    const seed = new Float32Array(n * 3);
    const ph = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      seed.set([rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1], i * 3);
      ph[i] = rnd();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
    geo.setAttribute("aPh", new THREE.BufferAttribute(ph, 1));
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: STREAM_VERT, fragmentShader: STREAM_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    return { geo, mat };
  }, [u, low]);
  useEffect(() => () => (built.geo.dispose(), built.mat.dispose()), [built]);
  useFrame(({ viewport }) => {
    u.uPx.value = viewport.dpr;
    if (ref.current) ref.current.visible = u.uOn.value > 0.005;
  });
  return <points ref={ref} geometry={built.geo} material={built.mat} frustumCulled={false} />;
}

/* ---------------- Director ---------------- */

const CHASE = new THREE.Vector3(); // scratch
const AHEAD = 0.12; // how far down the route the camera aims, as a share of it

/* The opening shot, under the hero: Earth's night side filling the left, its rim lit by the Sun beyond, and the
   ship on the right, seen from behind as it sets off. Placed by where things sit on the screen (-1 to 1 across
   and up), so every screen opens on the same picture. */
const OPEN = {
  /* heading: which way the ship sets off, bowing its path clear of Earth */
  wide: { earth: OPENING_EARTH.wide, ship: [0.44, -0.36], shipDist: 8.5, heading: new THREE.Vector3(0.05, 0.22, -1).normalize() as THREE.Vector3 | null },
  // phones open as wide screens do: Earth high, the ship below it; it sets off for the first stop climbing away from Earth
  // (null: that heading is worked out), so scrolling down carries it on and Earth never comes between it and the camera
  portrait: { earth: OPENING_EARTH.portrait, ship: [0.3, -0.5], shipDist: 16, heading: null as THREE.Vector3 | null },
  look: new THREE.Vector3(-0.8, -0.1, -1).normalize(), // which way the camera faces: a little down, onto the ship's back
};

/* scratch for the launch under the hero */
const LIFT = new THREE.Vector3();
const AXIS = new THREE.Vector3();
const OFF0 = new THREE.Vector3();
const OFF1 = new THREE.Vector3();
const VIEW = new THREE.Vector3();
const TO = new THREE.Vector3();
const Y_UP = new THREE.Vector3(0, 1, 0);
/* scratch for the warp */
const W_DIR = new THREE.Vector3();
const W_SHIP = new THREE.Vector3();
const W_CAM = new THREE.Vector3();
const W_LOOK = new THREE.Vector3();
const W_SIDE = new THREE.Vector3();
const NEG_Z = new THREE.Vector3(0, 0, -1);
/* scratch for the camera held from the Crew stop on */
const LOCK_M = new THREE.Matrix4();
const LOCK_R = new THREE.Vector3();
const LOCK_U = new THREE.Vector3();
const LOCK_V = new THREE.Vector3();
const CREW = Math.max(0, STOPS.findIndex((s) => s.kind === "crew"));
/* the cockpit, at the end on wide windows (Cockpit.tsx): in the ship's own frame (its nose down -z), in the model's
   units (times its scale): over the canopy, ahead of the roll-bar; the view tipped up a little so the nose shows low */
const SEAT = new THREE.Vector3(0, 1.0, -1.3);
const SEAT_TILT = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.08);
const SEAT_EASE = 1.8; // seconds, from the chase into the seat (and back)
/* the ship arrives at the last stop (as StorySection's ARRIVED, in scroll progress) */
const ARRIVED = 1 - STOPS[S - 1].weight / 2 / STOPS.reduce((a, s) => a + s.weight, 0) - 0.004;
const CK_POS = new THREE.Vector3();
const CK_Q = new THREE.Quaternion();
/** the frame of a heading: right, up, forward (the horizon kept level) */
const headingFrame = (dir: THREE.Vector3, m: THREE.Matrix4) => {
  LOCK_R.crossVectors(dir, Y_UP).normalize();
  LOCK_U.crossVectors(LOCK_R, dir).normalize();
  return m.makeBasis(LOCK_R, LOCK_U, dir);
};

function Director({
  progress,
  lead,
  reduced,
  mobile,
  warp,
  beat,
}: {
  progress: MutableRefObject<number>;
  lead: MutableRefObject<number>;
  reduced: boolean;
  mobile: boolean;
  /** when the warp to a page began (performance.now()), or 0 */
  warp: MutableRefObject<number>;
  /** when it last drew a frame (SpaceScene's watchdog) */
  beat: MutableRefObject<number>;
}) {
  const { camera, size, gl } = useThree();
  /* phones: the copy panel covers the bottom of the canvas once the launch is over; the scene is framed in the
     area above it (a view offset, so the canvas never resizes). 0 on wide screens. */
  const panelPx = useRef(0);
  useEffect(() => {
    const el = gl.domElement.closest(".story-stage")?.querySelector<HTMLElement>(".story-copy");
    if (!el) return;
    const mq = window.matchMedia("(max-width: 820px)");
    const read = () => {
      panelPx.current = mq.matches ? el.offsetHeight : 0;
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    mq.addEventListener("change", read);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", read);
    };
  }, [gl]);
  /* wide windows end in the cockpit (the HUD is Cockpit.tsx); 0 in the chase, 1 in the seat, eased */
  const cockpitOn = useRef(false);
  const seat = useRef(0);
  useEffect(() => {
    const mq = window.matchMedia(COCKPIT_MQ);
    const read = () => {
      cockpitOn.current = mq.matches;
    };
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);
  const aspect = size.width / size.height; // phones are portrait with or without the panel
  const wide = aspect > 1.15;
  const portrait = aspect < 1;
  const L = useMemo(() => layoutFor(portrait), [portrait]);
  const tokens = useMemo(() => readTokens(), []);

  const { curve, stops, tOf, tAt, loopShare } = useMemo(() => buildRoute(L.sun), [L]);
  const routeLen = useMemo(() => curve.getLength(), [curve]);
  /* from the Crew stop on, the camera holds the view it has there (the owner's choice): worked out once, as the
     chase below gives it at Crew, in the frame of the ship's heading */
  const crewView = useMemo(() => {
    const t0 = tAt(CREW);
    const ship = curve.getPoint(t0);
    const cam = ship.clone().add(new THREE.Vector3(portrait ? 2.8 * 0.35 : 2.8, 2.2, 12));
    const aim = curve.getPoint(Math.min(1, t0 + ((portrait ? AHEAD * 0.75 : AHEAD) * (S - 1)) / (curve.points.length - 1)));
    if (portrait) aim.y += 1.6;
    const inv = headingFrame(curve.getTangent(t0), new THREE.Matrix4()).transpose();
    return { cam: cam.sub(ship).applyMatrix4(inv), aim: aim.sub(ship).applyMatrix4(inv) };
  }, [curve, tAt, portrait]);
  /* the canvas's box, shaken in the Sun's heat; when a phone may buzz next */
  const shakeBox = useRef<HTMLElement | null>(null);
  const shaken = useRef(false);
  const bump = useRef({ at: -9, amp: 0, next: 0 });
  const flareOn = useRef(0);
  /* the S-foils folding flat as the armour locks on */
  const fold = useRef(0);
  const buzzAt = useRef(0);

  const state = useRef({ p: 0, lead: 0, activeIdx: -1 });
  const sf = useRef(0);
  const tp = useRef(0);
  const burst = useRef<Burst>({ id: 0, pos: new THREE.Vector3() });
  const pointer = useRef({ x: 0, y: 0 });
  const shipRef = useRef<THREE.Group>(null);
  const crossRef = useRef<THREE.Group>(null);
  const heading = useRef(0);
  const bank = useRef(0);
  const shipPos = useMemo(() => new THREE.Vector3(), []);
  const shipDir = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const sunFacing = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  /* past Contact the ship evolves: 0 (as it was) to 1 (armoured) */
  const morph = useRef(0);
  /* round the Sun: the hull's heat and the charge it soaks up (ShipArmour), the eruption, the sunlight stream */
  const sunFx = useRef({ heat: 0, charge: 0 });
  const warpU = useMemo<WarpUniforms>(() => ({ uTime: { value: 0 }, uSpeed: { value: 0 }, uFade: { value: 0 } }), []);
  const warpRef = useRef<THREE.Group>(null);
  const shipScale = portrait ? 0.7 : mobile ? 0.4 : 0.5;
  const eruptU = useMemo<EruptUniforms>(() => ({ uP: { value: 0 }, uTime: { value: 0 }, uPx: { value: 1 } }), []);
  const streamU = useMemo<StreamUniforms>(() => ({ uFrom: { value: L.sun.clone() }, uTo: { value: new THREE.Vector3() }, uTime: { value: 0 }, uOn: { value: 0 }, uPx: { value: 1 } }), [L]);
  /* where the eruption rises: under the route a little past halfway round, its loop spanning across the route */
  const erupt = useMemo(() => {
    const t = tAt(S - 2 + 0.58 * loopShare);
    const dir = curve.getPoint(t).sub(L.sun).normalize();
    return { dir, side: new THREE.Vector3().crossVectors(dir, curve.getTangent(t)).normalize() };
  }, [curve, tAt, loopShare, L]);
  const heatShown = useRef(0);
  const xwingRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  /* The route, in order: Earth (behind the first stop), a flyby of Venus, a belt of
     asteroids with saucers, a flyby of Mercury, then the Sun. The planets sit to the
     right of the route and below it, clear of the copy and of the Sun ahead. */
  const scenery = useMemo(() => {
    // f: how far along the stops (0 the first, 1 the last)
    const at = (f: number, x: number, y: number, z: number) => curve.getPoint(tOf(f * (S - 1))).add(new THREE.Vector3(x, y, z));
    const venus = at(0.34, 30 * L.reach, -10, -2);
    const mercury = at(0.66, 24 * L.reach, -10, 0);
    return {
      venus,
      mercury,
      sunDir: {
        earth: L.sun.clone().sub(L.earth),
        venus: L.sun.clone().sub(venus),
        mercury: L.sun.clone().sub(mercury),
      },
      ufos: [
        { p: at(0.2, 9 * L.reach, 3.5, 0), beam: true },
        { p: at(0.5, 10 * L.reach, -2.6, -3), beam: false },
      ],
      cross: curve.getPoint(tOf(0.44 * (S - 1))),
    };
  }, [curve, tOf, L]);
  /* the whole solar system round the Sun, ahead of the end (phones only: wide windows end in the cockpit) */
  const ahead = useMemo(() => ({ from: curve.getPoint(1), dir: curve.getTangent(1) }), [curve]);
  const rocks = useMemo(() => {
    const rnd = seeded(31);
    const n = mobile ? 16 : 40;
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const v = curve.getPoint(tOf((0.4 + rnd() * 0.2) * (S - 1)));
      const side = rnd() > 0.5 ? 1 : -1;
      // at or below the route: the Sun is high ahead, and no rock crosses it
      out.push(new THREE.Vector3(v.x + side * (7 + rnd() * 14), v.y + 1 - rnd() * 14, v.z + (rnd() - 0.5) * 10));
    }
    return out;
  }, [curve, tOf, mobile]);

  /* the opening shot (OPEN) in the world: the camera, which way it faces, and the ship's path from there to the
     first stop, setting off the way it faces and arriving along the route */
  const opening = useMemo(() => {
    const o = portrait ? OPEN.portrait : OPEN.wide;
    const tanH = Math.tan(THREE.MathUtils.degToRad(portrait ? 58 : 42) / 2);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(), OPEN.look, Y_UP));
    const ray = ([x, y]: number[]) => new THREE.Vector3(x * tanH * aspect, y * tanH, -1).normalize().applyQuaternion(q);
    const dist = EARTH_R / Math.sin(Math.atan(o.earth.r * tanH));
    const cam = L.earth.clone().addScaledVector(ray(o.earth.at), -dist);
    const ship = cam.clone().addScaledVector(ray(o.ship), o.shipDist);
    const stop = curve.getPoint(0);
    const path = new THREE.CubicBezierCurve3(
      ship,
      ship.clone().addScaledVector(o.heading ?? stop.clone().sub(ship).normalize().add(ship.clone().sub(L.earth).normalize().multiplyScalar(1.2)).normalize(), 0.55 * ship.distanceTo(stop)),
      stop.clone().addScaledVector(curve.getTangent(0), -24),
      stop
    );
    const aim = cam.clone().addScaledVector(OPEN.look, 30).sub(ship); // the camera's aim, from the ship
    return { cam, aim, path };
  }, [portrait, aspect, L, curve]);

  useFrame(({ clock }, delta) => {
    beat.current = performance.now();
    const dt = Math.min(delta, 0.1); // slow frames still keep pace with the scroll (no lag, then a lurch)
    const t = clock.elapsedTime;
    const st = state.current;
    st.p = reduced ? progress.current : THREE.MathUtils.damp(st.p, progress.current, 4.2, dt);
    sf.current = stopFloat(st.p);
    tp.current = tAt(sf.current);

    const idx = Math.round(sf.current);
    if (idx !== st.activeIdx) {
      st.activeIdx = idx;
      burst.current = { id: burst.current.id + 1, pos: stops[idx] };
    }

    /* --- the ship: on the route, nose along it, banking into turns --- */
    curve.getPoint(tp.current, shipPos);
    curve.getTangent(tp.current, shipDir);

    /* --- the launch, under the hero (lead 0 to 1). It opens on OPEN: behind the ship, Earth on the left. Scrolling,
           the ship flies off to the first stop and the camera turns from Earth to the route ahead, settling into
           the chase it keeps for the rest of the flight. --- */
    st.lead = reduced ? lead.current : THREE.MathUtils.damp(st.lead, lead.current, 4.2, dt);
    const launching = st.lead < 0.999;
    // one steady glide with the scroll from Earth, settling only as it reaches the first stop (no slow start, no surge)
    const f = 1 - (1 - st.lead) ** 2;

    /* --- a saucer crossing the route, in front of the ship --- */
    if (crossRef.current) {
      const sweep = ((t * 1.6) % 46) - 23;
      crossRef.current.position.set(scenery.cross.x + sweep, scenery.cross.y + 4.5, scenery.cross.z);
    }

    /* --- camera: behind the ship and to its right, aimed at the route ahead (the trajectory, not the ship) --- */
    CHASE.set(2.8, 2.2, 12);
    const px = reduced ? 0 : pointer.current.x * 0.5;
    const py = reduced ? 0 : pointer.current.y * 0.3;
    const cam = camera as THREE.PerspectiveCamera;
    /* --- arriving at the last stop, the constellation ahead: on phones the whole screen becomes the view --- */
    const arrive = smooth((sf.current - (S - 1.06)) / 0.06);
    /* --- the warp to a page: -1 until it starts, then seconds since --- */
    const wt = warp.current ? (performance.now() - warp.current) / 1000 : -1;
    const wIn = wt < 0 ? 0 : smooth(wt / 0.7); // the camera settles in behind the ship
    const wSpeed = wt < 0 ? 0 : smooth((wt - 0.2) / 1.1); // the streaks stretch out
    const wantFov = (portrait ? 58 : 42) + wSpeed * 26;
    if (cam.fov !== wantFov) {
      cam.fov = wantFov;
      cam.updateProjectionMatrix();
    }
    if (portrait) CHASE.x *= 0.35;
    camera.position.set(shipPos.x + CHASE.x + px, shipPos.y + CHASE.y + py, shipPos.z + CHASE.z);
    // a point on the route ahead; past the last stop, straight on along it
    const ahead = tp.current + ((portrait ? AHEAD * 0.75 : AHEAD) * (S - 1)) / (curve.points.length - 1);
    curve.getPoint(Math.min(1, ahead), target);
    if (ahead > 1) target.addScaledVector(curve.getTangent(1, TO), (ahead - 1) * routeLen);
    if (portrait) target.y += 1.6; // the ship sits low, the destination high
    /* from Crew to the end, one camera: the view it has at Crew, carried along in the frame of the ship's heading, so
       it holds as the route turns right round the Sun (at Crew itself it is the chase above, so there is no seam) */
    if (sf.current >= CREW) {
      headingFrame(shipDir, LOCK_M);
      camera.position.copy(LOCK_V.copy(crewView.cam).applyMatrix4(LOCK_M)).add(shipPos);
      camera.position.x += px;
      camera.position.y += py;
      target.copy(LOCK_V.copy(crewView.aim).applyMatrix4(LOCK_M)).add(shipPos);
    }
    if (launching) {
      /* the ship on its way to the stop; the camera keeps to it, turning from the opening (Earth to the left) to the
         stop's view (where the camera is now), its aim turning with it, so the ship never leaves the frame */
      opening.path.getPointAt(f, LIFT); // by arc length: even speed along the path
      opening.path.getTangentAt(f, AXIS);
      OFF0.copy(opening.cam).sub(opening.path.v0);
      OFF1.copy(camera.position).sub(shipPos);
      const a0 = Math.atan2(OFF0.x, OFF0.z);
      const turn = THREE.MathUtils.euclideanModulo(Math.atan2(OFF1.x, OFF1.z) - a0 + Math.PI, Math.PI * 2) - Math.PI; // the short way round
      const a = a0 + turn * f;
      const r = THREE.MathUtils.lerp(Math.hypot(OFF0.x, OFF0.z), Math.hypot(OFF1.x, OFF1.z), f);
      camera.position.set(Math.sin(a) * r, THREE.MathUtils.lerp(OFF0.y, OFF1.y, f), Math.cos(a) * r).add(LIFT);
      VIEW.copy(opening.aim).applyAxisAngle(Y_UP, a - a0);
      TO.copy(target).sub(shipPos);
      target.copy(VIEW.lerp(TO, f)).add(LIFT);
      // phones: the ship starts low, under Earth; mid-turn the aim leans towards it, so it never drops out of frame
      if (portrait) target.lerp(LIFT, 0.45 * Math.sin(Math.PI * f));
    }
    if (wIn > 0) {
      /* the warp: the ship pushes on down the route, the camera locks in behind it, and the tunnel streams past */
      curve.getTangent(1, W_DIR);
      W_SHIP.copy(shipPos).addScaledVector(W_DIR, 10 * wt * wt);
      // behind, above and off its left: the ship's flank, its engines and trails, in view
      W_SIDE.crossVectors(W_DIR, Y_UP).normalize();
      W_CAM.copy(W_SHIP).addScaledVector(W_DIR, -13).addScaledVector(W_SIDE, -3.2);
      W_CAM.y += 4;
      const shake = reduced ? 0 : wSpeed * 0.06;
      W_CAM.x += Math.sin(t * 47) * shake;
      W_CAM.y += Math.cos(t * 39) * shake;
      camera.position.lerp(W_CAM, wIn);
      W_LOOK.copy(W_SHIP).addScaledVector(W_DIR, 40);
      target.lerp(W_LOOK, wIn);
    }
    warpU.uTime.value = warpClock();
    warpU.uSpeed.value = wSpeed;
    warpU.uFade.value = wIn;
    if (warpRef.current) {
      warpRef.current.visible = wIn > 0;
      if (wIn > 0) {
        warpRef.current.position.copy(W_SHIP);
        warpRef.current.quaternion.setFromUnitVectors(NEG_Z, W_DIR);
      }
    }
    /* the ship evolves once it has passed Contact: armour locks onto it (ShipArmour), played over EVOLVE_S whatever
       the scroll's speed; scrolling back to Contact takes it off again. It flies round the Sun and into the warp so. */
    const evolveTo = sf.current > S - 2 + 0.02 ? 1 : 0;
    morph.current = reduced ? evolveTo : clamp(morph.current + Math.sign(evolveTo - morph.current) * (dt / EVOLVE_S), 0, 1);
    if (sf.current < S - 3.2) morph.current = 0; // jumped back well before Contact: the armour is simply off, not seen coming off
    const evolving = morph.current > 0 && morph.current < 1 ? 1 : 0;
    fold.current = smooth(morph.current / 0.15);
    /* the Sun's flares show only while the ship goes round it */
    flareOn.current = smooth((sf.current - (S - 2) - 0.05) / 0.15) * (1 - smooth((sf.current - (S - 1) + 0.12) / 0.1));
    camera.lookAt(target);

    /* phones: frame the scene above the copy panel, which rises in at the end of the launch */
    const P = panelPx.current * smooth((st.lead - 0.6) / 0.4) * (1 - arrive); // arrived: the whole screen is the view
    const top = Math.max(1, size.height - P);
    if (cam.view?.fullHeight !== top || cam.view?.height !== size.height || Math.abs(cam.aspect - size.width / top) > 1e-4) {
      cam.aspect = size.width / top;
      cam.setViewOffset(size.width, top, 0, 0, size.width, size.height);
    }
    // landscape: the ship stays on the right, clear of the copy. Portrait needs no shift:
    // the scene has its own area above the copy panel.
    const shift = (launching ? f : 1) * (1 - wIn); // the opening and the warp are framed unshifted
    if (wide) camera.translateX(-2.4 * shift);
    else if (!portrait) camera.translateY(-2.2 * shift);

    /* --- turbulence: slow, uneven buffeting (unrelated slow waves summed), a touch all the way and strong in the
           Sun's heat, where the stage glows too (--heat, globals.css) --- */
    const heat = clamp(1 - (shipPos.distanceTo(L.sun) - SUN_R - 45) / 70, 0, 1) * (launching ? 0 : 1);
    /* round the Sun (x: 0 to 1 round the loop): the hull heats up; a little past halfway an eruption rises under the
       route and blasts across it (laptops only), and the ship banks gently away; then it soaks up sunlight, charging for the warp, and
       keeps some of the charge as it leaves */
    const leg = clamp(sf.current - (S - 2), 0, 1);
    const x = clamp(leg / loopShare, 0, 1);
    const away = smooth((leg - loopShare) / (1 - loopShare));
    const cme = clamp((x - 0.4) / 0.25, 0, 1);
    // phones have no eruption to dodge; laptops bank gently away from it (owner, 2026-10-17: less animation round the Sun)
    const dodge = Math.sin(clamp((cme - 0.45) / 0.4, 0, 1) * Math.PI) * (mobile ? 0 : 0.35);
    const charge = smooth((x - 0.55) / 0.3);
    sunFx.current.heat = heat * (1 - smooth((x - 0.55) / 0.15)) * smooth((morph.current - 0.8) / 0.2); // once the armour is whole
    sunFx.current.charge = charge * (1 - 0.65 * away);
    eruptU.uP.value = cme;
    eruptU.uTime.value = t;
    streamU.uOn.value = charge * (1 - away);
    streamU.uTime.value = t;
    /* how hard it shakes: in the Sun's heat, in the eruption's blast, and while the armour locks on */
    // laptops and desktops: no shaking round the Sun at all; phones keep the heat and the armour's, but there is no
    // blast to shake them (the eruption is not shown on phones)
    const rough = reduced || !mobile ? 0 : Math.max(heat, evolving * 0.55);
    /* now and then a bump: a sharp knock that rings out, at uneven times */
    if (rough > 0.05 && t > bump.current.next) bump.current = { at: t, amp: rough * (0.5 + Math.random() * 0.5), next: t + 0.6 + Math.random() * 1.1 };
    const since = t - bump.current.at;
    const knock = since < 0.8 ? bump.current.amp * Math.exp(-since * 6) * Math.sin(since * 34) : 0;
    if (!reduced) {
      const k = 0.025 + rough * 0.7;
      // the buffeting: slow, uneven waves summed
      camera.translateX((Math.sin(t * 1.7) + Math.sin(t * 2.9 + 1.3) * 0.6 + Math.sin(t * 5.3 + 0.7) * 0.25) * k);
      camera.translateY((Math.sin(t * 1.3 + 2.1) + Math.sin(t * 3.7 + 0.4) * 0.5 + Math.sin(t * 6.1 + 1.9) * 0.2) * k + knock * 0.6);
      // the vibration: fast and fine, like the hull rattling
      camera.translateX(Math.sin(t * 47) * rough * 0.05);
      camera.translateY(Math.sin(t * 53 + 1) * rough * 0.05);
      // and the view itself wobbles: rolling, pitching and yawing, so the turbulence is seen as well as felt
      camera.rotateZ((Math.sin(t * 0.9 + 0.5) + Math.sin(t * 2.3) * 0.4) * (0.002 + rough * 0.06) + knock * 0.05);
      camera.rotateX((Math.sin(t * 0.83 + 1.1) + Math.sin(t * 1.9) * 0.4) * rough * 0.035);
      camera.rotateY((Math.sin(t * 0.67 + 2.3) + Math.sin(t * 1.6 + 0.4) * 0.4) * rough * 0.04);
    }
    /* the whole screen shakes too (the canvas's box, zoomed in a touch so its edges never show) and phones buzz */
    shakeBox.current ??= gl.domElement.closest<HTMLElement>(".story-canvas");
    const jolt = rough * 12 + Math.abs(knock) * 10; // px
    if (shakeBox.current && (jolt > 0.05 || shaken.current)) {
      shaken.current = jolt > 0.05;
      const jx = (Math.sin(t * 13.7) + Math.sin(t * 23.1 + 1) * 0.5) * jolt;
      const jy = (Math.sin(t * 11.3 + 2) + Math.sin(t * 19.7) * 0.5) * jolt;
      shakeBox.current.style.transform = shaken.current ? `translate3d(${jx.toFixed(1)}px, ${jy.toFixed(1)}px, 0) scale(${1 + jolt * 0.004})` : "";
    }
    if (mobile && rough > 0.1 && t > buzzAt.current && typeof navigator.vibrate === "function") {
      navigator.vibrate(Math.round(12 + rough * 40));
      buzzAt.current = t + 0.22 + Math.random() * 0.45; // uneven, like turbulence
    }
    if (Math.abs(heat - heatShown.current) > 0.02 || (heat === 0 && heatShown.current !== 0)) {
      heatShown.current = heat;
      gl.domElement.closest<HTMLElement>(".story-stage")?.style.setProperty("--heat", heat.toFixed(2));
    }

    /* --- the ship: on the route, or (launching) on its way to it --- */
    const sp = launching ? LIFT : wIn > 0 ? W_SHIP : shipPos;
    const sd = launching ? AXIS : wIn > 0 ? W_DIR : shipDir;
    const g = shipRef.current;
    if (g) {
      g.position.set(sp.x, sp.y + Math.sin(t * 1.2) * 0.06, sp.z);
      const want = Math.atan2(-sd.x, -sd.z);
      let d = want - heading.current;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const turn = d / Math.max(dt, 1e-3);
      heading.current += d * Math.min(1, dt * 8);
      bank.current = THREE.MathUtils.damp(bank.current, clamp(turn * 0.1, -0.5, 0.5), 5, dt);
      // nose up as it climbs (it was the other way round, which showed the camera its belly); a little buffeting
      const shake = reduced ? 0 : (Math.sin(t * 2.1) + Math.sin(t * 3.4 + 1) * 0.5) * (0.015 + (mobile ? heat * 0.05 : 0));
      g.rotation.set(sd.y * 0.8 + shake * 0.5, heading.current, bank.current + shake + dodge, "YXZ");
      streamU.uTo.value.copy(g.position);
    }

    /* --- the cockpit (wide windows, arrived): the camera eases from wherever the chase has it into the seat, and
           rides there with the ship, through the warp too; scrolling back eases it out again --- */
    const seatTo = cockpitOn.current && st.p >= ARRIVED ? 1 : 0; // the ship's own (eased) progress: in once it is there
    seat.current = reduced ? seatTo : clamp(seat.current + Math.sign(seatTo - seat.current) * (dt / SEAT_EASE), 0, 1);
    const ck = smooth(seat.current);
    if (ck > 0 && g) {
      g.updateMatrix();
      CK_POS.copy(SEAT).multiplyScalar(shipScale).applyMatrix4(g.matrix);
      camera.position.lerp(CK_POS, ck);
      camera.quaternion.slerp(CK_Q.copy(g.quaternion).multiply(SEAT_TILT), ck);
    }

  });

  return (
    <>
      {/* the Sun is ahead: it lights the ship's nose; Earthshine fills from behind */}
      <directionalLight position={[0.2, 0.4, -1]} intensity={2.4} color={tokens.starlight.clone().lerp(tokens.lit, 0.35)} />
      <directionalLight position={[-0.5, 0.1, 1]} intensity={0.5} color={tokens.dim} />

      <Field tokens={tokens} mobile={mobile} />

      {/* Earth and its satellites: where the ship starts */}
      <group position={L.earth}>
        <Planet kind="earth" radius={EARTH_R} sun={scenery.sunDir.earth} rotation={0.05} low={mobile} />
      </group>
      <Orbiters tokens={tokens} earth={L.earth} />

      <Route curve={curve} tokens={tokens} tp={tp} mobile={mobile} />
      <Beacons tokens={tokens} sf={sf} burst={burst} positions={stops} />

      <WarpTunnel u={warpU} mobile={mobile} anchor={warpRef} />

      <group ref={shipRef}>
        <group ref={xwingRef}>
          <ShipModel tokens={tokens} scale={shipScale} low={mobile} fold={fold} />
        </group>
        {/* the armour it evolves into, in its own units, so at its scale */}
        <ShipArmour morph={morph} fx={sunFx} scale={shipScale} low={mobile} />
      </group>

      {/* Venus, then the asteroid belt with its saucers, then Mercury */}
      <group position={scenery.venus}>
        <Planet kind="venus" radius={portrait ? 7 : 13} sun={scenery.sunDir.venus} rotation={0.02} low={mobile} />
      </group>
      <AsteroidField tokens={tokens} positions={rocks} size={mobile ? 1.1 : 0.9} low={mobile} />
      {scenery.ufos.map((u, i) => (
        <group key={i} position={u.p}>
          <UfoModel tokens={tokens} scale={mobile ? 1.1 : 1.5} beam={u.beam} phase={i * 3} />
        </group>
      ))}
      <group ref={crossRef}>
        <UfoModel tokens={tokens} scale={mobile ? 0.9 : 1.2} phase={7} />
      </group>
      <group position={scenery.mercury}>
        <Planet kind="mercury" radius={portrait ? 5 : 6.5} sun={scenery.sunDir.mercury} rotation={0.015} low={mobile} />
      </group>

      {/* the Sun at the end of the route, in its corona */}
      <group position={L.sun}>
        <Planet kind="sun" radius={60} sun={sunFacing} rotation={0.01} low={mobile} />
        <SolarFlares radius={60} low={mobile} on={flareOn} />
        {/* the eruption (the solar flare that strikes across the route): laptops and desktops only */}
        {!mobile && <Eruption radius={60} dir={erupt.dir} side={erupt.side} u={eruptU} low={mobile} />}
      </group>
      <SunStream u={streamU} low={mobile} />
      {portrait && <SolarSystem sun={L.sun} earth={L.earth} ahead={ahead} low={mobile} />}

      {!mobile && <Bloom intensity={0.85} threshold={0.32} smoothing={0.2} />}
    </>
  );
}

/* Laptops and desktops: once the journey is drawing, time 60 frames (after the first 40, which carry the compiles and
   uploads); if their MEDIAN can't hold FPS_FLOOR at full resolution, draw at 0.75. Integrated graphics are fill-bound
   here: on an Intel UHD at 1440x900, when busy, 0.75 took the journey from ~30 to 60+ fps (2026-10-17), while a strong
   card keeps full sharpness. The median, so a few startup hitches can't trip it. (PerformanceMonitor below never
   declined in those runs; this decides quickly and once.) */
const FPS_FLOOR = 45;
function FpsGuard({ onSlow }: { onSlow: () => void }) {
  const s = useRef({ n: 0, dts: [] as number[], done: false });
  useFrame((_, dt) => {
    const st = s.current;
    if (st.done || dt > 0.25) return; // a pause (tab hidden, scene held), not a frame
    st.n += 1;
    if (st.n <= 40) return;
    st.dts.push(dt);
    if (st.dts.length < 60) return;
    st.done = true;
    const median = st.dts.sort((x, y) => x - y)[30];
    if (median > 1 / FPS_FLOOR) onSlow();
  });
  return null;
}

/* ---------------- Canvas wrapper ---------------- */

/** Links every shader in parallel (off the main thread) before the first frame is drawn, then says so
 *  (after `until` too, if given: the story waits for Earth's map). With bloom the scene is drawn through
 *  the composer's float buffer, and three keys programs by render target, so the compile runs against a
 *  matching one. */
export function Prewarm({ bloom, onReady, until, onStep }: { bloom: boolean; onReady: (ready: boolean) => void; until?: Promise<unknown>; onStep?: (share: number) => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onReady(true);
    };
    const target = bloom ? new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false }) : null;
    const prev = gl.getRenderTarget();
    /* A linked program still stalls on its first draw (three reads its uniforms and log then). Draw everything
       once now, off-screen and hidden things too (the warp), so that wait lands under the loader and not mid-flight (the planets
       first come into view during the launch: ~180ms of hitches). */
    const firstUse = () => {
      const culled: THREE.Object3D[] = [];
      const hidden: THREE.Object3D[] = [];
      scene.traverse((o) => {
        if (o.frustumCulled) {
          culled.push(o);
          o.frustumCulled = false;
        }
        if (!o.visible) {
          hidden.push(o);
          o.visible = true;
        }
      });
      const was = gl.getRenderTarget();
      try {
        gl.setRenderTarget(target);
        gl.render(scene, camera);
      } finally {
        gl.setRenderTarget(was);
        culled.forEach((o) => (o.frustumCulled = true));
        hidden.forEach((o) => (o.visible = false));
      }
    };
    try {
      gl.setRenderTarget(target);
      onStep?.(0.4);
      gl.compileAsync(scene, camera)
        .then(() => {
          onStep?.(0.7);
          if (!done) firstUse();
          onStep?.(0.85);
        })
        .then(() => until)
        .then(finish, finish);
    } catch {
      finish();
    } finally {
      gl.setRenderTarget(prev);
    }
    const guard = window.setTimeout(finish, 4000); // never hold the scene back for long
    return () => {
      clearTimeout(guard);
      target?.dispose();
    };
  }, [gl, scene, camera, bloom, onReady, until, onStep]);
  return null;
}

export default function SpaceScene({
  progress,
  lead,
  active,
  reduced,
  onWarm,
  onLoad,
  warp,
}: {
  progress: MutableRefObject<number>;
  /** the fly-in under the hero, 0 to 1 */
  lead: MutableRefObject<number>;
  active: boolean;
  reduced: boolean;
  /** called once the shaders are compiled and the scene starts drawing */
  onWarm?: () => void;
  /** how far its build has got, 0 to 1, for the page's loader */
  onLoad?: (share: number) => void;
  /** when the warp to a page began (performance.now()), or 0 */
  warp: MutableRefObject<number>;
}) {
  const mobile = useMemo(() => isMobileViewport(), []);
  const earth = useMemo(() => earthMap(mobile), [mobile]); // painting starts now, in a worker
  const settled = useSettled();
  const [warm, setWarm] = useState(false);
  /* A watchdog: if the scene should be drawing but has not drawn for 2s (its render loop died, or the browser took
     its GPU context back, after a heavy page or a hot reload), it is built afresh, so the ship never sits frozen
     while the page scrolls past it. `gen` remounts the canvas. */
  const [gen, setGen] = useState(0);
  const beat = useRef(0);
  const running = active && warm;
  useEffect(() => {
    if (!running) return;
    beat.current = performance.now();
    const id = window.setInterval(() => {
      if (document.hidden) beat.current = performance.now();
      else if (performance.now() - beat.current > 2000) {
        setWarm(false);
        setGen((g) => g + 1);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running]);
  /* The scene is bound by pixels (its planets are noise shaders), so the resolution follows the GPU: if frames run
     slow (a laptop's integrated GPU) it steps down once. Only once: each change reallocates the buffers, a hitch. */
  const [dpr, setDpr] = useState(() => (mobile ? Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, 1.5) : 1));
  useEffect(() => {
    if (warm) onWarm?.();
  }, [warm, onWarm]);
  useEffect(() => onLoad?.(0.25), [onLoad]); // its code is in
  if (!settled) return null;
  return (
    <Canvas
      key={gen}
      flat
      dpr={dpr}
      onCreated={({ gl }) =>
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            setWarm(false);
            setGen((g) => g + 1); // a new canvas, a new context
          },
          { once: true }
        )
      }
      frameloop={active && warm ? "always" : "never"}
      camera={{ fov: 42, position: [0, 2, 10], near: 0.1, far: 5000 }} // far: out to the Oort cloud
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      {/* pitch black */}
      <color attach="background" args={["#000000"]} />
      <Prewarm bloom={!mobile} onReady={setWarm} until={earth} onStep={onLoad} />
      <PerformanceMonitor onDecline={() => setDpr((d) => Math.min(d, mobile ? 1 : 0.75))} />
      {!mobile && warm && dpr > 0.75 && <FpsGuard onSlow={() => setDpr(0.75)} />}
      <Director progress={progress} lead={lead} reduced={reduced} mobile={mobile} warp={warp} beat={beat} />
    </Canvas>
  );
}
