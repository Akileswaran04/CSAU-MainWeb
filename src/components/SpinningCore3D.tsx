"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ============================================================
   SPINNING CORE 3D — An interactive wireframe cube that
   rotates in 3D space, surrounded by orbiting particles.
   Used in the Origin section as the "CPU Core" visualization.
   ============================================================ */

const CYAN = new THREE.Color("#00f0ff");
const MAGENTA = new THREE.Color("#ff00aa");

/* ---- Wireframe Cube ---- */
function WireframeCube() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const edgesRef = useRef<THREE.LineSegments>(null!);

  const edgesGeom = useMemo(() => {
    const box = new THREE.BoxGeometry(2, 2, 2);
    return new THREE.EdgesGeometry(box);
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.x = t * 0.15;
    meshRef.current.rotation.y = t * 0.25;
    meshRef.current.rotation.z = Math.sin(t * 0.1) * 0.1;
  });

  return (
    <group ref={meshRef}>
      {/* Inner cube (filled, very subtle) */}
      <mesh>
        <boxGeometry args={[1.8, 1.8, 1.8]} />
        <meshStandardMaterial
          color={CYAN}
          transparent
          opacity={0.03}
          wireframe={false}
        />
      </mesh>

      {/* Wireframe edges */}
      <lineSegments ref={edgesRef as React.RefObject<THREE.LineSegments>} geometry={edgesGeom}>
        <lineBasicMaterial
          color={CYAN}
          transparent
          opacity={0.6}
        />
      </lineSegments>

      {/* Center glow sphere */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={CYAN}
          emissive={CYAN}
          emissiveIntensity={2}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color={CYAN}
          emissive={CYAN}
          emissiveIntensity={0.5}
          transparent
          opacity={0.1}
        />
      </mesh>
    </group>
  );
}

/* ---- Orbiting Particles ---- */
function OrbitParticles({ count = 80 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null!);

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 1.5 + Math.random() * 1.5;
      const height = (Math.random() - 0.5) * 2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = height;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return [pos];
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.2;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color={MAGENTA}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ---- Data Rings ---- */
function DataRings() {
  const group1 = useRef<THREE.Group>(null!);
  const group2 = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group1.current) group1.current.rotation.z = t * 0.3;
    if (group2.current) group2.current.rotation.z = -t * 0.2;
  });

  return (
    <>
      <group ref={group1} rotation={[Math.PI / 3, 0, 0]}>
        <mesh>
          <torusGeometry args={[2.2, 0.008, 8, 64]} />
          <meshStandardMaterial color={CYAN} transparent opacity={0.3} emissive={CYAN} emissiveIntensity={0.5} />
        </mesh>
      </group>
      <group ref={group2} rotation={[Math.PI / 2.5, Math.PI / 4, 0]}>
        <mesh>
          <torusGeometry args={[2.6, 0.005, 8, 64]} />
          <meshStandardMaterial color={MAGENTA} transparent opacity={0.2} emissive={MAGENTA} emissiveIntensity={0.3} />
        </mesh>
      </group>
    </>
  );
}

/* ---- Main Component ---- */
export default function SpinningCore3D() {
  return (
    <div className="w-full h-full min-h-[300px]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[3, 3, 3]} intensity={1} color="#00f0ff" />
        <pointLight position={[-3, -2, 2]} intensity={0.5} color="#ff00aa" />

        <WireframeCube />
        <OrbitParticles count={100} />
        <DataRings />

        <fog attach="fog" args={["#090714", 4, 12]} />
      </Canvas>
    </div>
  );
}
