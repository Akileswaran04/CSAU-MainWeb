"use client";

/* This file deliberately mutates the camera and three.js objects inside useFrame, which is
   the intended react-three-fiber pattern. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { STOPS } from "./stops";
import { SatelliteModel } from "../space/models";
import { AsteroidField, ParticlePlanet, ShipModel, UfoModel } from "../space/bodies";
import { Bloom } from "../space/Bloom";
import { isMobileViewport, readTokens, seeded, type SpaceTokens } from "../space/tokens";
import { useSettled } from "../space/useSettled";

/* ============================================================
   SPACE SCENE - from Earth to the Sun, on a spaceship.

   A ship leaves a rotating particle Earth and follows a route through
   pitch-black space, one stop at a time: past Venus, through an asteroid
   belt with saucers, past Mercury, and on to the Sun. Scroll drives the
   ship. The camera starts ahead of it looking back at Earth, orbits round
   to its right over the first stops, then chases it from behind.

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

/* ---------------- Sparse stars in pitch-black space ---------------- */

function Field({ tokens, mobile }: { tokens: SpaceTokens; mobile: boolean }) {
  const parts = useMemo(() => {
    const rnd = seeded(9);
    const n = mobile ? 320 : 800;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      p[i * 3] = (rnd() - 0.5) * 520;
      p[i * 3 + 1] = (rnd() - 0.5) * 300;
      p[i * 3 + 2] = -480 + rnd() * 540;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
    const mat = new THREE.PointsMaterial({
      color: tokens.starlight,
      size: 1.4,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    return { geo, mat };
  }, [tokens, mobile]);
  useEffect(
    () => () => {
      parts.geo.dispose();
      parts.mat.dispose();
    },
    [parts]
  );
  return <points geometry={parts.geo} material={parts.mat} frustumCulled={false} />;
}

/* ---------------- The route: dim line, lit up to the ship ---------------- */

function Route({ curve, tokens, tp }: { curve: THREE.CatmullRomCurve3; tokens: SpaceTokens; tp: MutableRefObject<number> }) {
  const N = S * 40;
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

interface Burst {
  id: number;
  pos: THREE.Vector3;
}

function Beacons({ tokens, sf, burst }: { tokens: SpaceTokens; sf: MutableRefObject<number>; burst: MutableRefObject<Burst> }) {
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
  }, [tokens]);
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
  const positions = useMemo(() => Array.from({ length: S }, (_, i) => stopPos(i)), []);
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
        <ParticlePlanet kind="earth" radius={EARTH_R} count={mobile ? 12000 : 90000} sun={scenery.sunDir.earth} rotation={0.05} seed={2} smooth={mobile} />
      </group>
      <Orbiters tokens={tokens} earth={L.earth} />

      <Route curve={curve} tokens={tokens} tp={tp} />
      <Beacons tokens={tokens} sf={sf} burst={burst} />

      <group ref={shipRef}>
        <ShipModel tokens={tokens} scale={portrait ? 0.7 : mobile ? 0.4 : 0.5} low={mobile} />
      </group>

      {/* Venus, then the asteroid belt with its saucers, then Mercury */}
      <group position={scenery.venus}>
        <ParticlePlanet kind="venus" radius={portrait ? 7 : 13} count={mobile ? 5400 : 52000} sun={scenery.sunDir.venus} rotation={0.02} seed={4} smooth={mobile} />
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
        <ParticlePlanet kind="mercury" radius={portrait ? 5 : 6.5} count={mobile ? 6800 : 30000} sun={scenery.sunDir.mercury} rotation={0.015} seed={6} smooth={mobile} />
      </group>

      {/* the Sun at the end of the route: a glowing particle sphere like the planets */}
      <group position={L.sun}>
        <ParticlePlanet kind="sun" radius={60} count={mobile ? 10200 : 90000} sun={sunFacing} rotation={0.01} seed={9} smooth={mobile} />
      </group>

      {!mobile && <Bloom intensity={0.85} threshold={0.32} smoothing={0.2} />}
    </>
  );
}

/* ---------------- Canvas wrapper ---------------- */

export default function SpaceScene({
  progress,
  active,
  reduced,
}: {
  progress: MutableRefObject<number>;
  active: boolean;
  reduced: boolean;
}) {
  const mobile = useMemo(() => isMobileViewport(), []);
  const settled = useSettled();
  if (!settled) return null;
  return (
    <Canvas
      flat
      dpr={[1, mobile ? 2 : 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 42, position: [0, 2, 10], near: 0.1, far: 900 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      {/* pitch black */}
      <color attach="background" args={["#000000"]} />
      <Director progress={progress} reduced={reduced} mobile={mobile} />
    </Canvas>
  );
}
