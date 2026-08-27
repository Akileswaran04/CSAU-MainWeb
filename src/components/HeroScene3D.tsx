"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import * as THREE from "three";

/* ============================================================
   HERO SCENE 3D — A cinematic cyberpunk gate scene.
   
   • Wireframe gate structure that splits on scroll
   • Floating data cubes orbiting the scene
   • Particle field drifting through space
   • City silhouette wireframe on the horizon
   • Camera dolly on scroll
   ============================================================ */

const CYAN = new THREE.Color("#00f0ff");
const MAGENTA = new THREE.Color("#ff00aa");

/* ---- Floating Particles ---- */
function ParticleField({ count = 500 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null!);

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      sz[i] = Math.random() * 0.08 + 0.02;
    }
    return [pos, sz];
  }, [count]);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    const posAttr = mesh.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += delta * (0.05 + Math.sin(i) * 0.02);
      if (arr[i * 3 + 1] > 20) arr[i * 3 + 1] = -20;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color={CYAN}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ---- Wireframe Gate ---- */
function CyberGate({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const leftDoor = useRef<THREE.Group>(null!);
  const rightDoor = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (!leftDoor.current || !rightDoor.current) return;
    // Split the gate open based on scroll
    const openAmount = scrollProgress * 8;
    leftDoor.current.position.x = -openAmount;
    leftDoor.current.rotation.y = THREE.MathUtils.lerp(0, -0.3, scrollProgress);
    rightDoor.current.position.x = openAmount;
    rightDoor.current.rotation.y = THREE.MathUtils.lerp(0, 0.3, scrollProgress);
  });

  const gateMaterial = (
    <meshStandardMaterial
      color={CYAN}
      wireframe
      transparent
      opacity={0.3}
      emissive={CYAN}
      emissiveIntensity={0.5}
    />
  );

  const frameMaterial = (
    <meshStandardMaterial
      color={CYAN}
      transparent
      opacity={0.6}
      emissive={CYAN}
      emissiveIntensity={0.8}
    />
  );

  return (
    <group ref={groupRef} position={[0, 0, -3]}>
      {/* Left door */}
      <group ref={leftDoor}>
        {/* Gate panel */}
        <mesh position={[-1.2, 0, 0]}>
          <planeGeometry args={[2.4, 5, 8, 12]} />
          {gateMaterial}
        </mesh>
        {/* Frame edge */}
        <mesh position={[-2.4, 0, 0]}>
          <boxGeometry args={[0.06, 5, 0.06]} />
          {frameMaterial}
        </mesh>
        <mesh position={[-1.2, 2.5, 0]}>
          <boxGeometry args={[2.4, 0.06, 0.06]} />
          {frameMaterial}
        </mesh>
        <mesh position={[-1.2, -2.5, 0]}>
          <boxGeometry args={[2.4, 0.06, 0.06]} />
          {frameMaterial}
        </mesh>
      </group>

      {/* Right door */}
      <group ref={rightDoor}>
        <mesh position={[1.2, 0, 0]}>
          <planeGeometry args={[2.4, 5, 8, 12]} />
          {gateMaterial}
        </mesh>
        <mesh position={[2.4, 0, 0]}>
          <boxGeometry args={[0.06, 5, 0.06]} />
          {frameMaterial}
        </mesh>
        <mesh position={[1.2, 2.5, 0]}>
          <boxGeometry args={[2.4, 0.06, 0.06]} />
          {frameMaterial}
        </mesh>
        <mesh position={[1.2, -2.5, 0]}>
          <boxGeometry args={[2.4, 0.06, 0.06]} />
          {frameMaterial}
        </mesh>
      </group>

      {/* Top arch */}
      <mesh position={[0, 2.8, 0]}>
        <torusGeometry args={[2.8, 0.04, 8, 32, Math.PI]} />
        {frameMaterial}
      </mesh>

      {/* Corner accents */}
      {[[-2.5, 2.6], [2.5, 2.6], [-2.5, -2.4], [2.5, -2.4]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.03]}>
          <boxGeometry args={[0.2, 0.2, 0.02]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? CYAN : MAGENTA}
            emissive={i % 2 === 0 ? CYAN : MAGENTA}
            emissiveIntensity={1}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---- Floating Data Cubes ---- */
function DataCubes() {
  const groupRef = useRef<THREE.Group>(null!);

  const cubes = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      pos: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
        -5 - Math.random() * 15,
      ] as [number, number, number],
      scale: 0.1 + Math.random() * 0.3,
      speed: 0.3 + Math.random() * 0.8,
      axis: Math.random() > 0.5 ? "x" : "y",
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const cube = cubes[i];
      child.rotation.x += 0.003 * cube.speed;
      child.rotation.y += 0.005 * cube.speed;
      child.position.y =
        cube.pos[1] + Math.sin(state.clock.elapsedTime * cube.speed) * 0.5;
    });
  });

  return (
    <group ref={groupRef}>
      {cubes.map((cube, i) => (
        <mesh key={i} position={cube.pos} scale={cube.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? CYAN : i % 3 === 1 ? MAGENTA : new THREE.Color("#39ff14")}
            wireframe
            transparent
            opacity={0.4}
            emissive={i % 3 === 0 ? CYAN : i % 3 === 1 ? MAGENTA : new THREE.Color("#39ff14")}
            emissiveIntensity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---- City Wireframe Skyline ---- */
function CitySkyline() {
  const buildings = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      x: (i - 25) * 1.2,
      w: 0.4 + Math.random() * 0.8,
      h: 0.5 + Math.random() * 3,
      d: 0.4 + Math.random() * 0.6,
    }));
  }, []);

  return (
    <group position={[0, -4, -20]}>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, 0]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial
            color={CYAN}
            wireframe
            transparent
            opacity={0.12}
            emissive={CYAN}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---- Horizon Grid ---- */
function HorizonGrid() {
  const gridRef = useRef<THREE.GridHelper>(null!);

  useFrame((state) => {
    if (!gridRef.current) return;
    gridRef.current.position.z = -10 + Math.sin(state.clock.elapsedTime * 0.2) * 2;
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[100, 40, CYAN, CYAN]}
      position={[0, -4, -10]}
      material-transparent
      material-opacity={0.08}
    />
  );
}

/* ---- Animated Rings (Portal preview) ---- */
function AnimatedRings() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z = state.clock.elapsedTime * 0.1;
  });

  return (
    <group ref={groupRef} position={[0, 0, -8]}>
      {[3, 2.5, 2, 1.5].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, i * 0.3]}>
          <torusGeometry args={[radius, 0.01, 8, 64]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? CYAN : MAGENTA}
            transparent
            opacity={0.15 - i * 0.03}
            emissive={i % 2 === 0 ? CYAN : MAGENTA}
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---- Camera Controller ---- */
function CameraController({ scrollProgress }: { scrollProgress: number }) {
  const { camera } = useThree();

  useFrame(() => {
    // Camera moves forward through the gate as user scrolls
    camera.position.z = THREE.MathUtils.lerp(8, -2, scrollProgress);
    camera.position.y = THREE.MathUtils.lerp(0.5, 0, scrollProgress);
    camera.lookAt(0, 0, -5);
  });

  return null;
}

/* ---- Main Scene ---- */
export default function HeroScene3D({
  scrollProgress = 0,
}: {
  scrollProgress?: number;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 8], fov: 60 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#00f0ff" />
      <pointLight position={[-5, 3, 3]} intensity={0.4} color="#ff00aa" />
      <pointLight position={[0, -3, 2]} intensity={0.3} color="#39ff14" />

      {/* Scene */}
      <CameraController scrollProgress={scrollProgress} />
      <CyberGate scrollProgress={scrollProgress} />
      <DataCubes />
      <CitySkyline />
      <HorizonGrid />
      <AnimatedRings />
      <ParticleField count={600} />
      <Stars
        radius={50}
        depth={50}
        count={2000}
        factor={2}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Fog for depth */}
      <fog attach="fog" args={["#090714", 5, 35]} />
    </Canvas>
  );
}
