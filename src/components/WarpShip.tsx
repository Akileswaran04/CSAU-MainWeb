"use client";

/* This scene deliberately mutates refs and three.js objects inside
   useFrame, which is the intended react-three-fiber pattern. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ShipModel } from "./space/bodies";
import { ShipArmour } from "./space/armour";
import { Bloom } from "./space/Bloom";
import { WarpTunnel, warpClock, type WarpUniforms } from "./story/SpaceScene";
import { isMobileViewport, readTokens, reducedMotion } from "./space/tokens";

/* ============================================================
   WARP SHIP - the warp loader (LoadingOverlay, warp) carries on the
   story's own warp, so the jump has no seam: the same armoured ship
   (ShipModel folded + ShipArmour whole, with the charge it keeps
   leaving the Sun), the same WarpTunnel at full speed, and the same
   camera the story's Director uses in the warp:
     cockpit - wide windows: the seat over the canopy (SEAT, SEAT_TILT)
     chase   - phones: behind, above and off the ship's left (W_CAM)
   Loaded only for this loader; its three.js and the scene module are
   already cached from the story. On "ending" the tunnel slows; in the
   chase the ship also pulls away into the light.
   ============================================================ */

/* kept in step with SpaceScene's Director */
const SEAT = new THREE.Vector3(0, 1.0, -1.3);
const SEAT_TILT = 0.08;
const CHASE = new THREE.Vector3(-3.2, 4, 13);
const LOOK = new THREE.Vector3(0, 0, -40);
const END_CHARGE = 0.35; // charge * (1 - 0.65 * away) as the ship leaves the Sun

function Warp({ cockpit, ending, still }: { cockpit: boolean; ending: boolean; still: boolean }) {
  const portrait = useThree((s) => s.size.width / s.size.height < 1); // as the story's Director
  const mobile = useMemo(() => isMobileViewport(), []);
  const tokens = useMemo(() => readTokens(), []);
  const scale = portrait ? 0.7 : mobile ? 0.4 : 0.5;
  const ship = useRef<THREE.Group>(null);
  const anchor = useRef<THREE.Group | null>(null);
  const u = useMemo<WarpUniforms>(() => ({ uTime: { value: 0 }, uSpeed: { value: 1 }, uFade: { value: 1 } }), []);
  const morph = useRef(1);
  const fold = useRef(1);
  const fx = useRef({ heat: 0, charge: END_CHARGE });
  const away = useRef(0);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;

  useEffect(() => {
    camera.fov = (portrait ? 58 : 42) + 26;
    camera.updateProjectionMatrix();
  }, [camera, portrait]);

  useFrame(({ clock }, dt) => {
    const t = still ? 0 : clock.elapsedTime;
    u.uTime.value = warpClock(); // the story's tunnel clock: the streaks are where the story's were
    u.uSpeed.value = ending ? Math.max(0.1, u.uSpeed.value - dt * 1.5) : 1;
    if (anchor.current) anchor.current.visible = true;
    if (ending && !cockpit && !still) away.current += dt * (1 + away.current * 3);
    ship.current?.position.set(0, 0, -away.current * 30);
    if (cockpit) {
      camera.position.copy(SEAT).multiplyScalar(scale);
      camera.rotation.set(SEAT_TILT, 0, 0);
    } else {
      /* the story's chase shakes a little at speed */
      const shake = still ? 0 : 0.06 * u.uSpeed.value;
      camera.position.copy(CHASE);
      camera.position.x += Math.sin(t * 47) * shake;
      camera.position.y += Math.cos(t * 39) * shake;
      camera.lookAt(LOOK);
    }
  });

  return (
    <>
      {/* the story's light: the Sun ahead lights the nose, Earthshine fills from behind */}
      <directionalLight position={[0.2, 0.4, -1]} intensity={2.4} color={tokens.starlight.clone().lerp(tokens.lit, 0.35)} />
      <directionalLight position={[-0.5, 0.1, 1]} intensity={0.5} color={tokens.dim} />
      <WarpTunnel u={u} mobile={mobile} anchor={anchor} />
      <group ref={ship}>
        <ShipModel tokens={tokens} scale={scale} low={mobile} fold={fold} />
        <ShipArmour morph={morph} fx={fx} scale={scale} low={mobile} />
      </group>
      {!mobile && <Bloom intensity={0.85} threshold={0.32} smoothing={0.2} />}
    </>
  );
}

/** `live`: false while readied unseen (drawn once, so its shaders are built, then idle), true once it shows */
export default function WarpShip({ view, ending, live }: { view: string; ending: boolean; live: boolean }) {
  const mobile = useMemo(() => isMobileViewport(), []);
  const still = useMemo(() => reducedMotion(), []);
  return (
    <Canvas
      flat
      dpr={mobile ? [1, 1.5] : 1}
      frameloop={live ? "always" : "demand"}
      gl={{ antialias: true, alpha: false }}
      camera={{ fov: 68, near: 0.1, far: 700 }} // near as the story's: the seat clips the hull pieces beside it
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <color attach="background" args={["#000000"]} />
      <Warp cockpit={view === "cockpit"} ending={ending} still={still} />
    </Canvas>
  );
}
