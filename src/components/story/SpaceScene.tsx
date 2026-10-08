"use client";

/* This file deliberately mutates the camera and three.js objects inside useFrame, which is
   the intended react-three-fiber pattern. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { STOP_LAYOUT as STOPS } from "./stops";
import { SatelliteModel } from "../space/models";
import { AsteroidField, ShipModel, UfoModel } from "../space/bodies";
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
   Scroll drives the ship. The camera starts ahead of it looking
   back at Earth, orbits round to its right over the first stops,
   then chases it from behind.

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
  sun: portrait ? new THREE.Vector3(26, 14, Z1 - 250) : new THREE.Vector3(88, 24, Z1 - 250),
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

/** 0 … S-1, easing to a halt at every stop */
function stopFloat(p: number): number {
  if (p <= KEYS[0]) return 0;
  for (let i = 1; i < S; i++) {
    if (p <= KEYS[i]) {
      const f = (p - KEYS[i - 1]) / Math.max(1e-6, KEYS[i] - KEYS[i - 1]);
      return i - 1 + smooth(f);
    }
  }
  return S - 1;
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
const BAND_FRAG = /* glsl */ `
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
  gl_FragColor = vec4(uColor * k, 1.0);
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
    return { near, far, starMat, bandGeo, bandMat, time, px };
  }, [tokens, mobile]);
  useEffect(
    () => () => {
      [parts.near, parts.far, parts.starMat, parts.bandGeo, parts.bandMat].forEach((x) => x.dispose());
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
        <mesh geometry={parts.bandGeo} material={parts.bandMat} renderOrder={-2} />
        <points geometry={parts.far} material={parts.starMat} frustumCulled={false} renderOrder={-1} />
      </group>
      <points geometry={parts.near} material={parts.starMat} frustumCulled={false} />
    </>
  );
}

/* ---------------- The route: dim line, lit up to the ship ---------------- */

export function Route({ curve, tokens, tp }: { curve: THREE.CatmullRomCurve3; tokens: SpaceTokens; tp: MutableRefObject<number> }) {
  const N = curve.points.length * 40;
  const parts = useMemo(() => {
    const pos = new Float32Array((N + 1) * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i <= N; i++) {
      curve.getPoint(i / N, v);
      pos.set([v.x, v.y, v.z], i * 3);
    }
    const mk = () => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      return g;
    };
    const dimGeo = mk();
    const litGeo = mk();
    const dimMat = new THREE.LineBasicMaterial({ color: tokens.dim, transparent: true, opacity: 0.28 });
    const litMat = new THREE.LineBasicMaterial({ color: tokens.lit });
    return { dimGeo, litGeo, dimMat, litMat, dim: new THREE.Line(dimGeo, dimMat), lit: new THREE.Line(litGeo, litMat) };
  }, [curve, tokens, N]);
  useEffect(
    () => () => {
      parts.dimGeo.dispose();
      parts.litGeo.dispose();
      parts.dimMat.dispose();
      parts.litMat.dispose();
    },
    [parts]
  );
  useFrame(() => {
    parts.litGeo.setDrawRange(0, Math.max(0, Math.floor(tp.current * N) + 1));
  });
  return (
    <>
      <primitive object={parts.dim} />
      <primitive object={parts.lit} />
    </>
  );
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

/* ---------------- Director ---------------- */

const CHASE = new THREE.Vector3(); // scratch

function Director({ progress, reduced, mobile }: { progress: MutableRefObject<number>; reduced: boolean; mobile: boolean }) {
  const { camera, size } = useThree();
  const aspect = size.width / size.height;
  const wide = aspect > 1.15;
  const portrait = aspect < 1;
  const L = useMemo(() => layoutFor(portrait), [portrait]);
  const tokens = useMemo(() => readTokens(), []);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(Array.from({ length: S }, (_, i) => stopPos(i)), false, "centripetal"), []);

  const state = useRef({ p: 0, activeIdx: -1 });
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
     right of the route, clear of the copy. */
  const scenery = useMemo(() => {
    const at = (f: number, x: number, y: number, z: number) => curve.getPoint(f).add(new THREE.Vector3(x, y, z));
    const venus = at(0.34, 30 * L.reach, 3, -2);
    const mercury = at(0.66, 24 * L.reach, -3, 0);
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
      cross: curve.getPoint(0.44),
    };
  }, [curve, L]);
  const rocks = useMemo(() => {
    const rnd = seeded(31);
    const n = mobile ? 16 : 40;
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const v = curve.getPoint(0.4 + rnd() * 0.2);
      const side = rnd() > 0.5 ? 1 : -1;
      out.push(new THREE.Vector3(v.x + side * (7 + rnd() * 14), v.y + (rnd() - 0.5) * 18, v.z + (rnd() - 0.5) * 10));
    }
    return out;
  }, [curve, mobile]);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    const st = state.current;
    st.p = reduced ? progress.current : THREE.MathUtils.damp(st.p, progress.current, 4.2, dt);
    sf.current = stopFloat(st.p);
    tp.current = clamp(sf.current / (S - 1), 0, 1);

    const idx = Math.round(sf.current);
    if (idx !== st.activeIdx) {
      st.activeIdx = idx;
      burst.current = { id: burst.current.id + 1, pos: stopPos(idx) };
    }

    /* --- the ship: on the route, nose along it, banking into turns --- */
    curve.getPoint(tp.current, shipPos);
    curve.getTangent(tp.current, shipDir);
    const g = shipRef.current;
    if (g) {
      g.position.set(shipPos.x, shipPos.y + Math.sin(t * 1.2) * 0.06, shipPos.z);
      const want = Math.atan2(-shipDir.x, -shipDir.z);
      let d = want - heading.current;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const turn = d / Math.max(dt, 1e-3);
      heading.current += d * Math.min(1, dt * 8);
      bank.current = THREE.MathUtils.damp(bank.current, clamp(turn * 0.1, -0.5, 0.5), 5, dt);
      g.rotation.set(-shipDir.y * 0.8, heading.current, bank.current, "YXZ");
    }

    /* --- a saucer crossing the route, in front of the ship --- */
    if (crossRef.current) {
      const sweep = ((t * 1.6) % 46) - 23;
      crossRef.current.position.set(scenery.cross.x + sweep, scenery.cross.y + 4.5, scenery.cross.z);
    }

    /* --- camera: starts ahead of the ship looking back at Earth, orbits round to the
           ship's right, then chases it from behind for the rest of the trip --- */
    const k = smooth((sf.current - 1.0) / 1.8); // 0 = ahead of the ship, 1 = behind it
    const phi = Math.PI * k;
    const R = THREE.MathUtils.lerp(19, 12, k);
    CHASE.set(Math.sin(phi) * R * 0.9 + 2.8 * k, THREE.MathUtils.lerp(2.4, 2.2, k), -Math.cos(phi) * R);
    const px = reduced ? 0 : pointer.current.x * 0.5;
    const py = reduced ? 0 : pointer.current.y * 0.3;
    const cam = camera as THREE.PerspectiveCamera;
    const wantFov = portrait ? 58 : 42;
    if (cam.fov !== wantFov) {
      cam.fov = wantFov;
      cam.updateProjectionMatrix();
    }
    if (portrait) CHASE.x *= 0.35;
    camera.position.set(shipPos.x + CHASE.x + px, shipPos.y + CHASE.y + py, shipPos.z + CHASE.z);
    // look at the ship, sliding the aim forward along the route as the camera swings behind it
    target.copy(shipPos).addScaledVector(shipDir, (portrait ? 22 : 30) * k * 0.9);
    if (portrait) target.y += 1.6 * k; // the ship sits low, the destination high
    camera.lookAt(target);
    // landscape: the ship stays on the right, clear of the copy. Portrait needs no shift:
    // the scene has its own area above the copy panel.
    if (wide) camera.translateX(-2.4);
    else if (!portrait) camera.translateY(-2.2);
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

      <Route curve={curve} tokens={tokens} tp={tp} />
      <Beacons tokens={tokens} sf={sf} burst={burst} positions={curve.points} />

      <group ref={shipRef}>
        <ShipModel tokens={tokens} scale={portrait ? 0.7 : mobile ? 0.4 : 0.5} low={mobile} />
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
      </group>

      {!mobile && <Bloom intensity={0.85} threshold={0.32} smoothing={0.2} />}
    </>
  );
}

/* ---------------- Canvas wrapper ---------------- */

/** Links every shader in parallel (off the main thread) before the first frame is drawn, then says so
 *  (after `until` too, if given: the story waits for Earth's map). With bloom the scene is drawn through
 *  the composer's float buffer, and three keys programs by render target, so the compile runs against a
 *  matching one. */
export function Prewarm({ bloom, onReady, until }: { bloom: boolean; onReady: (ready: boolean) => void; until?: Promise<unknown> }) {
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
    try {
      gl.setRenderTarget(target);
      gl.compileAsync(scene, camera)
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
  }, [gl, scene, camera, bloom, onReady, until]);
  return null;
}

export default function SpaceScene({
  progress,
  active,
  reduced,
  onWarm,
}: {
  progress: MutableRefObject<number>;
  active: boolean;
  reduced: boolean;
  /** called once the shaders are compiled and the scene starts drawing */
  onWarm?: () => void;
}) {
  const mobile = useMemo(() => isMobileViewport(), []);
  const earth = useMemo(() => earthMap(mobile), [mobile]); // painting starts now, in a worker
  const settled = useSettled();
  const [warm, setWarm] = useState(false);
  useEffect(() => {
    if (warm) onWarm?.();
  }, [warm, onWarm]);
  if (!settled) return null;
  return (
    <Canvas
      flat
      dpr={[1, mobile ? 2 : 1.5]}
      frameloop={active && warm ? "always" : "never"}
      camera={{ fov: 42, position: [0, 2, 10], near: 0.1, far: 900 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      {/* pitch black */}
      <color attach="background" args={["#000000"]} />
      <Prewarm bloom={!mobile} onReady={setWarm} until={earth} />
      <Director progress={progress} reduced={reduced} mobile={mobile} />
    </Canvas>
  );
}
