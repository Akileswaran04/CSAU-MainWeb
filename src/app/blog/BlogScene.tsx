"use client";

/* This file mutates the camera and three.js objects inside useFrame, the intended react-three-fiber pattern. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { BlogPost } from "@/lib/blog";
import { ShipModel } from "@/components/space/bodies";
import { Beacons, Field, Prewarm, Route, type Burst } from "@/components/story/SpaceScene";
import { isMobileViewport, readTokens, type SpaceTokens } from "@/components/space/tokens";
import { useSettled } from "@/components/space/useSettled";

/* ============================================================
   BLOG SCENE - the home story's ship, flying the blog.

   Stop 0 is the launch (the page header); every post after it is
   a stop with its cover hanging beside the route. Scroll flies the
   ship from post to post the way the home story flies it from Earth
   to the Sun: the same route, beacons, stars and camera, all a pure
   function of scroll progress, so scrolling back flies back.
   ============================================================ */

const { clamp, smoothstep } = THREE.MathUtils;
const GAP = 30; // world units between stops
const ASPECT = 1.6; // every cover plate is 16:10, the picture cropped to fill it

/** stop i: the home story's gentle S-curve, heading away from the camera */
const stopPos = (i: number) => new THREE.Vector3(3 * Math.sin(i * 0.8 + 0.4), 1.8 * Math.cos(i * 1.1 + 0.5), -34 - i * GAP);

/* a white pixel: each plate is built with a map, so a cover arriving later swaps in without a new shader */
const BLANK = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
BLANK.needsUpdate = true;

/* ---------------- Cover plates, one beside each post's stop ---------------- */

function Covers({
  posts,
  points,
  tokens,
  sf,
  portrait,
  onSettled,
}: {
  posts: BlogPost[];
  points: THREE.Vector3[];
  tokens: SpaceTokens;
  sf: MutableRefObject<number>;
  portrait: boolean;
  onSettled: () => void;
}) {
  const { gl, camera } = useThree();
  const parts = useMemo(
    () => ({
      plane: new THREE.PlaneGeometry(1, 1),
      covers: posts.map(() => new THREE.MeshBasicMaterial({ map: BLANK, color: tokens.hull, transparent: true, toneMapped: false })),
      frames: posts.map(() => new THREE.MeshBasicMaterial({ color: tokens.dim, transparent: true, toneMapped: false })),
    }),
    [posts, tokens],
  );
  useEffect(
    () => () => {
      parts.plane.dispose();
      [...parts.covers, ...parts.frames].forEach((m) => m.dispose());
    },
    [parts],
  );

  /* load the covers (Medium serves them cross-origin), crop each to the plate, upload before first use */
  useEffect(() => {
    let live = true;
    const loader = new THREE.TextureLoader();
    const made: THREE.Texture[] = [];
    const guard = window.setTimeout(() => onSettled(), 4000); // a slow CDN never holds the page
    void Promise.all(
      posts.map((p, i) =>
        p.image
          ? loader.loadAsync(p.image).then(
              (t) => {
                if (!live) return t.dispose();
                const a = t.image.width / t.image.height;
                if (a > ASPECT) t.repeat.set(ASPECT / a, 1);
                else t.repeat.set(1, a / ASPECT);
                t.offset.set((1 - t.repeat.x) / 2, (1 - t.repeat.y) / 2);
                t.colorSpace = THREE.SRGBColorSpace;
                t.anisotropy = 4;
                gl.initTexture(t);
                made.push(t);
                parts.covers[i].map = t;
                parts.covers[i].color.set(0xffffff);
              },
              () => {}, // no picture: the plate stays plain
            )
          : null,
      ),
    ).then(() => {
      if (live) onSettled();
    });
    return () => {
      live = false;
      clearTimeout(guard);
      made.forEach((t) => t.dispose());
    };
  }, [posts, parts, gl, onSettled]);

  const groups = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    for (let i = 0; i < posts.length; i++) {
      const g = groups.current[i];
      if (!g) continue;
      // once the ship leaves a stop its plate fades, well before the chase camera reaches it
      const fade = clamp(1 - (sf.current - (i + 1)) * 5, 0, 1);
      g.visible = fade > 0;
      if (!fade) continue;
      g.quaternion.copy(camera.quaternion); // always face the camera
      const near = clamp(1 - Math.abs(sf.current - (i + 1)) * 1.2, 0, 1); // the plate being visited lights up
      parts.frames[i].color.copy(tokens.dim).lerp(tokens.lit, near);
      parts.frames[i].opacity = parts.covers[i].opacity = fade;
    }
  });

  // above the ship and just ahead of it: on desktop up and to the right, clear of the copy and the rail
  const off = portrait ? new THREE.Vector3(0, 3.6, -6) : new THREE.Vector3(3.6, 3.4, -6);
  const w = portrait ? 7.2 : 7.4;
  return (
    <>
      {posts.map((p, i) => (
        <group
          key={p.id}
          position={points[i + 1].clone().add(off)}
          ref={(el) => {
            groups.current[i] = el;
          }}
        >
          <mesh geometry={parts.plane} material={parts.frames[i]} scale={[w + 0.18, w / ASPECT + 0.18, 1]} position-z={-0.04} />
          <mesh geometry={parts.plane} material={parts.covers[i]} scale={[w, w / ASPECT, 1]} />
        </group>
      ))}
    </>
  );
}

/* ---------------- Director: the ship on the route, the camera on the ship ---------------- */

const CHASE = new THREE.Vector3(); // scratch

function Flight({
  posts,
  progress,
  reduced,
  mobile,
  onCovers,
}: {
  posts: BlogPost[];
  progress: MutableRefObject<number>;
  reduced: boolean;
  mobile: boolean;
  onCovers: () => void;
}) {
  const { camera, size } = useThree();
  const aspect = size.width / size.height;
  const wide = aspect > 1.15;
  const portrait = aspect < 1;
  const tokens = useMemo(() => readTokens(), []);
  const n = posts.length + 1;
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(Array.from({ length: n }, (_, i) => stopPos(i)), false, "centripetal"),
    [n],
  );

  const st = useRef({ p: 0, idx: -1 });
  const sf = useRef(0);
  const tp = useRef(0);
  const burst = useRef<Burst>({ id: 0, pos: new THREE.Vector3() });
  const pointer = useRef({ x: 0, y: 0 });
  const shipRef = useRef<THREE.Group>(null);
  const heading = useRef(0);
  const bank = useRef(0);
  const shipPos = useMemo(() => new THREE.Vector3(), []);
  const shipDir = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    const s = st.current;
    s.p = reduced ? progress.current : THREE.MathUtils.damp(s.p, progress.current, 4.2, dt);
    // each stop owns an equal share of the scroll; the ship halts at the middle of it (as BlogFlight's copy does)
    const x = clamp(s.p * n - 0.5, 0, n - 1);
    const i0 = Math.min(n - 2, Math.floor(x));
    sf.current = i0 + smoothstep(x - i0, 0, 1);
    tp.current = sf.current / (n - 1);

    const idx = Math.round(sf.current);
    if (idx !== s.idx) {
      s.idx = idx;
      burst.current = { id: burst.current.id + 1, pos: curve.points[idx] };
    }

    /* the ship: on the route, nose along it, banking into turns (as in the home story) */
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

    /* camera: at the launch it faces the ship, then swings round behind it and chases it from post to post */
    const k = smoothstep(sf.current, 0, 0.9); // 0 = ahead of the ship, 1 = behind it
    const phi = Math.PI * k;
    const R = THREE.MathUtils.lerp(16, 12, k);
    CHASE.set(Math.sin(phi) * R * 0.9 + 2.8 * k, THREE.MathUtils.lerp(2.4, 2.2, k), -Math.cos(phi) * R);
    if (portrait) CHASE.x *= 0.35;
    const cam = camera as THREE.PerspectiveCamera;
    const wantFov = portrait ? 58 : 42;
    if (cam.fov !== wantFov) {
      cam.fov = wantFov;
      cam.updateProjectionMatrix();
    }
    const px = reduced ? 0 : pointer.current.x * 0.5;
    const py = reduced ? 0 : pointer.current.y * 0.3;
    camera.position.set(shipPos.x + CHASE.x + px, shipPos.y + CHASE.y + py, shipPos.z + CHASE.z);
    target.copy(shipPos).addScaledVector(shipDir, (portrait ? 14 : 18) * k);
    if (portrait) target.y += 1.6 * k;
    camera.lookAt(target);
    if (wide) camera.translateX(-2.4); // the ship and covers stay on the right, clear of the copy
    else if (!portrait) camera.translateY(-2.2);
  });

  return (
    <>
      <directionalLight position={[0.2, 0.4, -1]} intensity={2.4} color={tokens.starlight.clone().lerp(tokens.lit, 0.35)} />
      <directionalLight position={[-0.5, 0.1, 1]} intensity={0.5} color={tokens.dim} />
      <Field tokens={tokens} mobile={mobile} />
      <Route curve={curve} tokens={tokens} tp={tp} />
      <Beacons tokens={tokens} sf={sf} burst={burst} positions={curve.points} />
      <Covers posts={posts} points={curve.points} tokens={tokens} sf={sf} portrait={portrait} onSettled={onCovers} />
      <group ref={shipRef}>
        <ShipModel tokens={tokens} scale={portrait ? 0.7 : mobile ? 0.4 : 0.5} low={mobile} />
      </group>
    </>
  );
}

/* ---------------- Canvas wrapper ---------------- */

export default function BlogScene({
  posts,
  progress,
  active,
  reduced,
  onReady,
}: {
  posts: BlogPost[];
  progress: MutableRefObject<number>;
  active: boolean;
  reduced: boolean;
  /** called once the shaders are compiled and the covers are in (or given up on) */
  onReady: () => void;
}) {
  const mobile = useMemo(() => isMobileViewport(), []);
  const settled = useSettled();
  const [warm, setWarm] = useState(false);
  const [covers, setCovers] = useState(false);
  const onCovers = useMemo(() => () => setCovers(true), []);
  useEffect(() => {
    if (warm && covers) onReady();
  }, [warm, covers, onReady]);
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
      <color attach="background" args={["#000000"]} />
      <Prewarm bloom={false} onReady={setWarm} />
      <Flight posts={posts} progress={progress} reduced={reduced} mobile={mobile} onCovers={onCovers} />
    </Canvas>
  );
}
