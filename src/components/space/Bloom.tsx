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
  const dpr = useThree((s) => s.viewport.dpr); // the buffers follow the pixel ratio too (it adapts to the GPU)
  const composer = useMemo(() => {
    // a lost context (a hot reload, the GPU dropping it) has no attributes and the composer cannot be built on it:
    // draw plainly until the canvas is rebuilt with a new one (SpaceScene's watchdog)
    if (!gl.getContext().getContextAttributes()) return null;
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
    composer?.setSize(size.width, size.height);
  }, [composer, size, dpr]);
  useEffect(() => () => composer?.dispose(), [composer]);
  useFrame((_, dt) => (composer ? composer.render(dt) : gl.render(scene, camera)), 1);
  return null;
}
