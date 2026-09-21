"use client";

/* This scene deliberately mutates refs and three.js objects inside
   useFrame, which is the intended react-three-fiber pattern. */
/* eslint-disable react-hooks/immutability */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import * as THREE from "three";
import { AsteroidField, ParticlePlanet, ShipModel, UfoModel } from "./bodies";
import { SatelliteModel } from "./models";
import { Bloom } from "./Bloom";
import { isMobileViewport, readTokens, reducedMotion, seeded } from "./tokens";
import { useSettled } from "./useSettled";

/* ============================================================
   START - Earth, alone, and a straight flight through traffic

   Standby shows one thing: Earth, turning in the dark. Tapping it
   launches the flight.

   The camera never turns. It holds one heading (straight ahead, into
   -Z) for the whole trip and only translates: it accelerates forward,
   strafes sideways to slingshot past Earth's limb, then settles back
   onto the corridor. A little roll while it strafes, a widening lens
   with speed and a light shake make it read as a real craft.

   The corridor is busy. Things cross it in different directions -
   satellites left and right, a fighter right to left, a saucer
   falling diagonally, tumbling rocks rising and dropping, a small
   planet drifting past - while the letters C, S, A and U stand in
   the lane and power on (dim, one flicker, steady amber) as the
   camera reaches them. After U the page hands off to the hero.

   Reduced motion: no flight and no traffic; the camera steps from
   letter to letter as each one lights.
   ============================================================ */

const { clamp } = THREE.MathUtils;
const smooth = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

const FONT = "/fonts/Ethnocentric-Regular.otf";
const LETTERS = ["C", "S", "A", "U"] as const;

const EARTH_R = 9;
const LETTER_Z = [-30, -47, -64, -81];
const END_Z = -100;
const T_START = 0.1;
const T_FLIGHT = 5.0; // seconds of flight

/** dim -> one flicker -> steady lit, by seconds since the letter appeared */
const flicker = (s: number) => (s < 0 ? 0 : s < 0.07 ? 0.35 : s < 0.14 ? 1 : s < 0.21 ? 0.15 : 1);

interface Control {
  startedAt: number; // seconds (performance.now / 1000); -1 = standby
  done: boolean;
}

/* ---------- streaked stars: world-fixed, stretched along the flight ---------- */

const STREAK_VERT = /* glsl */ `
attribute float aEnd;
uniform float uStreak;
uniform float uOpacity;
varying float vA;
void main() {
  vec3 p = position;
  p.z -= aEnd * uStreak;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = uOpacity * (1.0 - aEnd * 0.8) * smoothstep(110.0, 8.0, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;

const STREAK_FRAG = /* glsl */ `
uniform vec3 uColor;
varying float vA;
void main() {
  gl_FragColor = vec4(uColor, vA);
  #include <colorspace_fragment>
}`;

function Stars({
  count,
  tokens,
  uniforms,
}: {
  count: number;
  tokens: ReturnType<typeof readTokens>;
  uniforms: { uStreak: { value: number }; uOpacity: { value: number } };
}) {
  const parts = useMemo(() => {
    const rnd = seeded(41);
    const pos: number[] = [];
    const end: number[] = [];
    const dot = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // a wide slab around the whole flight, kept clear of the corridor itself
      const r = 7 + Math.pow(rnd(), 0.7) * 46;
      const a = rnd() * Math.PI * 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r * 0.62;
      const z = -130 + rnd() * 190;
      pos.push(x, y, z, x, y, z);
      end.push(0, 1);
      dot.set([x, y, z], i * 3);
    }
    const lines = new THREE.BufferGeometry();
    lines.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    lines.setAttribute("aEnd", new THREE.Float32BufferAttribute(end, 1));
    const lineMat = new THREE.ShaderMaterial({
      vertexShader: STREAK_VERT,
      fragmentShader: STREAK_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: { uStreak: uniforms.uStreak, uOpacity: uniforms.uOpacity, uColor: { value: tokens.starlight.clone() } },
    });
    const points = new THREE.BufferGeometry();
    points.setAttribute("position", new THREE.BufferAttribute(dot, 3));
    const pointMat = new THREE.PointsMaterial({ color: tokens.starlight, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false });
    return { lines, lineMat, points, pointMat };
  }, [count, tokens, uniforms]);
  useEffect(
    () => () => {
      parts.lines.dispose();
      parts.lineMat.dispose();
      parts.points.dispose();
      parts.pointMat.dispose();
    },
    [parts]
  );
  return (
    <>
      <lineSegments geometry={parts.lines} material={parts.lineMat} frustumCulled={false} />
      <points geometry={parts.points} material={parts.pointMat} frustumCulled={false} />
    </>
  );
}

/* ---------- crossing traffic ---------- */

interface Crosser {
  /** the z the object crosses the corridor at */
  z: number;
  /** where it is at the moment the camera reaches z + lead */
  at: [number, number];
  /** direction of travel in the x/y plane, and speed in units per second */
  dir: [number, number];
  speed: number;
}

const CROSSERS: Record<string, Crosser> = {
  satA: { z: 6, at: [0, 4.2], dir: [-1, 0.05], speed: 8 }, // right to left, above
  satB: { z: -6, at: [1, -3.4], dir: [1, 0.12], speed: 7 }, // left to right, below
  rockA: { z: -12, at: [-3.4, -5], dir: [0.15, 1], speed: 6 }, // rising
  rockB: { z: -17, at: [4, 5.4], dir: [-0.25, -1], speed: 7 }, // falling
  fighter: { z: -38, at: [0.5, 1.4], dir: [-1, -0.04], speed: 15 }, // right to left, fast
  saucer: { z: -56, at: [0, 0.4], dir: [-0.8, -0.6], speed: 11 }, // falling diagonally
  fighter2: { z: -72, at: [-0.5, -1.6], dir: [1, 0.08], speed: 15 }, // left to right, fast
};

/* ---------- the flight ---------- */

function IntroScene({
  ctl,
  mobile,
  reduced,
  onPress,
  onDone,
}: {
  ctl: MutableRefObject<Control>;
  mobile: boolean;
  reduced: boolean;
  onPress: () => void;
  onDone: () => void;
}) {
  const tokens = useMemo(() => readTokens(), []);
  const { camera, size } = useThree();
  const aspect = size.width / size.height;
  const narrow = aspect < 0.9;
  const [gone, setGone] = useState(false);

  /* Earth stays in view whatever the screen: back the camera off until it fits */
  const zStart = clamp(10.6 / (0.344 * Math.min(aspect, 1.5)), 32, 66);
  const sun = useMemo(() => new THREE.Vector3(-0.6, 0.5, 0.8), []);
  const lx = narrow ? 2.5 : 3.8; // how far the letters stand off the lane (phones: close in, but clear of the camera)
  const tFlight = narrow ? 6.4 : T_FLIGHT; // phones fly a little slower so each letter is seen
  const tDone = tFlight + 0.15;
  // phones: the letters start further down the lane, after the camera has lined up again
  const letterZ = useMemo(() => (narrow ? [-46, -59, -72, -85] : LETTER_Z), [narrow]);

  /* camera position as a function of time: forward with an ease, a strafe past Earth's limb */
  const camAt = useMemo(() => {
    const strafe = narrow ? 12.5 : 13.5;
    return (u: number) => {
      const s = 0.4 * u + 0.6 * smooth(u); // 0..1 along the flight
      const z = zStart + (END_Z - zStart) * s;
      const bump = Math.exp(-Math.pow((z - 2) / 17, 2)); // 1 when level with Earth
      return { z, x: strafe * bump, y: 1.6 * bump, s };
    };
  }, [zStart, narrow]);

  /* the moment (in flight time u) at which the camera reaches a given z */
  const uAtZ = useMemo(() => {
    const table: number[] = [];
    for (let i = 0; i <= 400; i++) table.push(camAt(i / 400).z);
    return (z: number) => {
      for (let i = 0; i <= 400; i++) if (table[i] <= z) return i / 400;
      return 1;
    };
  }, [camAt]);

  const letterPos = useMemo(() => letterZ.map((z, k) => new THREE.Vector3(lx * (k % 2 ? 1 : -1), (narrow ? 0.15 : 0.3) * (k % 2 ? -1 : 1), z)), [lx, narrow, letterZ]);
  const rocks = useMemo(() => [new THREE.Vector3(0, 0, -400), new THREE.Vector3(0, 0, -400)], []);

  const geo = useMemo(() => {
    const ringGeo = new THREE.RingGeometry(0.996, 1, 96);
    const ringMats = [0, 1].map(() => new THREE.MeshBasicMaterial({ color: tokens.dim, transparent: true, opacity: 0, depthWrite: false }));
    return { ringGeo, ringMats };
  }, [tokens]);
  useEffect(
    () => () => {
      geo.ringGeo.dispose();
      geo.ringMats.forEach((m) => m.dispose());
    },
    [geo]
  );

  const uniforms = useMemo(() => ({ uStreak: { value: 0 }, uOpacity: { value: 0 } }), []);
  const letterMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const letterGroups = useRef<(THREE.Group | null)[]>([]);
  const arrival = useRef<number[]>([-1, -1, -1, -1]);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const traffic = useRef<Record<string, THREE.Group | null>>({});
  const pressed = useRef(false);
  const lastX = useRef(0);
  const roll = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const now = performance.now() / 1000;
    const st = ctl.current;
    const t = st.startedAt < 0 ? -1 : now - st.startedAt;
    const cam = camera as THREE.PerspectiveCamera;

    /* --- standby: Earth alone, dead centre, a slow drift, pings around it --- */
    if (t < 0) {
      camera.position.set(reduced ? 0 : Math.sin(now * 0.25) * 0.5, reduced ? 0 : Math.sin(now * 0.31) * 0.3, zStart);
      camera.rotation.set(0, 0, 0);
      geo.ringMats.forEach((m, i) => {
        const age = reduced ? 0.4 : ((now + i * 1.5) % 3) / 3;
        m.opacity = (1 - age) * 0.4;
        rings.current[i]?.scale.setScalar(EARTH_R * (1.12 + age * 0.5));
      });
      uniforms.uOpacity.value = 0;
      Object.values(traffic.current).forEach((g) => g && (g.visible = false));
      return;
    }
    if (!pressed.current) {
      pressed.current = true;
      setGone(true);
      onPress();
    }
    geo.ringMats.forEach((m) => (m.opacity = 0));
    uniforms.uOpacity.value = smooth(t / 0.6) * 0.9;

    let speed = 0;
    if (reduced) {
      // no flight: step from letter to letter as each one lights
      const step = Math.min(3, Math.floor(Math.max(0, t - 0.1) / 0.55));
      camera.position.set(0, 0, letterPos[step].z + 16);
      camera.rotation.set(0, 0, 0);
    } else {
      const u = clamp((t - T_START) / (tFlight - T_START), 0, 1);
      const c = camAt(u);
      const shake = 0.03 + 0.05 * c.s * (1 - c.s) * 4;
      camera.position.set(
        c.x + Math.sin(t * 23) * shake * 0.3,
        c.y + Math.sin(t * 31 + 1) * shake * 0.3,
        c.z
      );
      // roll into the strafe (the heading itself never changes)
      const vx = (c.x - lastX.current) / Math.max(dt, 1e-3);
      lastX.current = c.x;
      roll.current = THREE.MathUtils.damp(roll.current, clamp(-vx * 0.012, -0.22, 0.22), 6, dt);
      camera.rotation.set(0, 0, roll.current);
      speed = u < 1 ? (Math.abs(END_Z - zStart) / (tFlight - T_START)) * (0.4 + 0.6 * 6 * u * (1 - u)) : 0;
      // the lens widens with speed
      const wantFov = 38 + Math.min(16, speed * 0.32);
      if (Math.abs(cam.fov - wantFov) > 0.05) {
        cam.fov = wantFov;
        cam.updateProjectionMatrix();
      }
    }
    uniforms.uStreak.value = reduced ? 0 : Math.min(speed * 0.06, 4.2);

    /* --- crossing traffic: each thing follows its own line through the corridor --- */
    if (!reduced) {
      const uNow = clamp((t - T_START) / (tFlight - T_START), 0, 1);
      const place = (key: string, lead: number) => {
        const g = traffic.current[key];
        const c = CROSSERS[key];
        if (!g) return;
        const tc = uAtZ(c.z + lead) * (tFlight - T_START) + T_START; // when the camera is `lead` short of it
        const dtc = t - tc;
        g.visible = t > 0.2 && Math.abs(dtc) < 6;
        g.position.set(c.at[0] + c.dir[0] * c.speed * dtc, c.at[1] + c.dir[1] * c.speed * dtc, c.z);
      };
      place("satA", 14);
      place("satB", 14);
      place("fighter", 15);
      place("saucer", 15);
      place("fighter2", 15);
      // tumbling rocks are instanced: move their positions in place
      (["rockA", "rockB"] as const).forEach((key, i) => {
        const c = CROSSERS[key];
        const tc = uAtZ(c.z + 14) * (tFlight - T_START) + T_START;
        const dtc = t - tc;
        rocks[i].set(c.at[0] + c.dir[0] * c.speed * dtc, c.at[1] + c.dir[1] * c.speed * dtc, Math.abs(dtc) < 6 && uNow > 0 ? c.z : -400);
      });
      // spin the fighters through a bank as they cross
      const f1 = traffic.current.fighter;
      if (f1) f1.rotation.set(0, Math.PI / 2 + 0.12, Math.sin(t * 2.2) * 0.35);
      const f2 = traffic.current.fighter2;
      if (f2) f2.rotation.set(0, -Math.PI / 2 - 0.12, Math.sin(t * 2.4 + 1) * 0.35);
    }

    /* --- letters: power on when the camera comes within reach --- */
    for (let k = 0; k < 4; k++) {
      const dz = camera.position.z - letterPos[k].z;
      const inLane = Math.abs(camera.position.x - letterPos[k].x) < (narrow ? 4.5 : 9);
      if (arrival.current[k] < 0 && dz < (reduced ? 30 : narrow ? 36 : 26) && dz > -40 && (reduced || inLane)) arrival.current[k] = t;
      const lvl = arrival.current[k] < 0 ? 0 : reduced ? clamp((t - arrival.current[k]) / 0.25, 0, 1) : flicker(t - arrival.current[k]);
      const m = letterMats.current[k];
      if (m) {
        m.emissive.copy(tokens.dim).lerp(tokens.lit, lvl);
        m.emissiveIntensity = 0.1 + lvl * 0.9;
      }
      const g = letterGroups.current[k];
      if (g) g.visible = lvl > 0;
    }

    if (t >= (reduced ? 2.9 : tDone) && !st.done) {
      st.done = true;
      onDone();
    }
  });

  const d = Math.min(size.width * 0.86, size.height * 0.7);

  return (
    <>
      <color attach="background" args={["#000000"]} />
      <directionalLight position={[-3, 5, 6]} intensity={1.3} color={tokens.starlight} />
      <directionalLight position={[4, -2, -5]} intensity={0.6} color={tokens.starlight} />

      <Stars count={mobile ? 460 : 1000} tokens={tokens} uniforms={uniforms} />

      {/* Earth: the whole start page. Tap it to launch. */}
      <group>
        <ParticlePlanet kind="earth" radius={EARTH_R} count={mobile ? 16000 : 90000} sun={sun} rotation={0.07} seed={2} grain={mobile ? 0.7 : 0.8} smooth={mobile} />
        {geo.ringMats.map((m, i) => (
          <mesh
            key={i}
            geometry={geo.ringGeo}
            material={m}
            ref={(el) => {
              rings.current[i] = el;
            }}
          />
        ))}
        {!gone && (
          <Html center zIndexRange={[30, 20]}>
            <StartControl diameter={d} onPress={() => (ctl.current.startedAt < 0 ? (ctl.current.startedAt = performance.now() / 1000) : null)} />
          </Html>
        )}
      </group>

      {/* the corridor's traffic, each crossing on its own line */}
      {!reduced && (
        <>
          <group ref={(el) => {
              traffic.current.satA = el;
            }} visible={false}>
            <SatelliteModel tokens={tokens} scale={narrow ? 0.9 : 1.2} />
          </group>
          <group ref={(el) => {
              traffic.current.satB = el;
            }} visible={false}>
            <SatelliteModel tokens={tokens} scale={narrow ? 0.8 : 1.05} />
          </group>
          <AsteroidField tokens={tokens} positions={rocks} size={narrow ? 0.9 : 1.2} low={mobile} />
          <group ref={(el) => {
              traffic.current.fighter = el;
            }} visible={false}>
            <ShipModel tokens={tokens} scale={narrow ? 0.32 : 0.45} low={mobile} />
          </group>
          <group ref={(el) => {
              traffic.current.saucer = el;
            }} visible={false}>
            <UfoModel tokens={tokens} scale={narrow ? 0.9 : 1.3} beam phase={2} />
          </group>
          <group ref={(el) => {
              traffic.current.fighter2 = el;
            }} visible={false}>
            <ShipModel tokens={tokens} scale={narrow ? 0.32 : 0.45} low={mobile} />
          </group>
        </>
      )}

      {/* The font loads asynchronously. Catch that suspend here, inside the 3D scene: if it
          bubbled out, fiber would hide the whole page-level loader and tear the canvas down. */}
      <Suspense fallback={null}>
        {LETTERS.map((ch, k) => (
          <group
            key={ch}
            position={letterPos[k]}
            ref={(el) => {
              letterGroups.current[k] = el;
            }}
            visible={false}
          >
            <Text font={FONT} fontSize={narrow ? 3 : 3.4} anchorX="center" anchorY="middle" characters="CSAU">
              {ch}
              <meshStandardMaterial
                ref={(m) => {
                  letterMats.current[k] = m;
                }}
                color={tokens.hull}
                roughness={0.6}
                emissive={tokens.dim}
                emissiveIntensity={0.1}
                toneMapped={false}
              />
            </Text>
          </group>
        ))}
      </Suspense>

      {!mobile && <Bloom intensity={0.75} threshold={0.35} smoothing={0.2} />}
    </>
  );
}

/** The real, accessible control laid over Earth: one big round button. */
function StartControl({ diameter, onPress }: { diameter: number; onPress: () => void }) {
  return (
    <>
      <style>{`
        .st-earth { border-radius: 50%; background: transparent; border: 0; cursor: pointer; touch-action: manipulation; }
        .st-earth:focus-visible { outline: 2px solid var(--signal); outline-offset: 6px; }
      `}</style>
      <button type="button" className="st-earth" aria-label="Start" style={{ width: diameter, height: diameter }} onClick={onPress} />
    </>
  );
}

export default function PowerOnIntro({
  onPowerOn,
  onEnter,
}: {
  /** Earth was tapped - the landing chrome can appear */
  onPowerOn?: () => void;
  /** the flight finished - hand off to the hero */
  onEnter: () => void;
}) {
  const ctl = useRef<Control>({ startedAt: -1, done: false });
  const settled = useSettled();
  const [status, setStatus] = useState("");
  const mobile = useMemo(() => isMobileViewport(), []);
  const reduced = useMemo(() => reducedMotion(), []);
  const enterRef = useRef(onEnter);
  const powerRef = useRef(onPowerOn);
  useEffect(() => {
    enterRef.current = onEnter;
    powerRef.current = onPowerOn;
  }, [onEnter, onPowerOn]);

  const handlePress = useCallback(() => {
    setStatus("Starting");
    powerRef.current?.();
  }, []);
  const handleDone = useCallback(() => enterRef.current(), []);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {settled && (
        <Canvas
          flat
          dpr={mobile ? [1, 2] : [1, 1.75]}
          camera={{ fov: 38, position: [0, 0, 40], near: 0.1, far: 700 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          style={{ position: "absolute", inset: 0 }}
        >
          <IntroScene ctl={ctl} mobile={mobile} reduced={reduced} onPress={handlePress} onDone={handleDone} />
        </Canvas>
      )}
      <p className="sr-only" role="status">
        {status}
      </p>
    </div>
  );
}
