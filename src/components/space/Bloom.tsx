"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BloomEffect, EffectComposer, EffectPass, RenderPass } from "postprocessing";
import * as THREE from "three";

/** Restrained bloom: takes over the render with a composer. Desktop only. */
export function Bloom({
  intensity = 0.4,
  threshold = 0.5,
  smoothing = 0.15,
}: {
  intensity?: number;
  threshold?: number;
  smoothing?: number;
}) {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const c = new EffectComposer(gl, { frameBufferType: THREE.HalfFloatType, multisampling: 0 });
    c.addPass(new RenderPass(scene, camera));
    c.addPass(
      new EffectPass(
        camera,
        new BloomEffect({ intensity, luminanceThreshold: threshold, luminanceSmoothing: smoothing, mipmapBlur: true, radius: 0.5 })
      )
    );
    return c;
  }, [gl, scene, camera, intensity, threshold, smoothing]);
  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size]);
  useEffect(() => () => composer.dispose(), [composer]);
  useFrame((_, dt) => composer.render(dt), 1);
  return null;
}
