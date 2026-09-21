"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { SpaceTokens } from "./tokens";

/* ============================================================
   SPACE MODELS - everything is built in three.js from primitives
   and generated geometry. No model files, no textures, no loaders.

   Geometry is built once and shared; materials read the CSS
   tokens. Each model stays well under ~5k triangles.
   ============================================================ */

/** Dispose geometries/materials created by useMemo when the model unmounts. */
function useDispose(...items: ({ dispose(): void } | null | undefined)[]) {
  useEffect(
    () => () => {
      items.forEach((i) => i?.dispose());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    items
  );
}

const edgeMat = (color: THREE.Color, opacity = 0.7) =>
  new THREE.LineBasicMaterial({ color, transparent: true, opacity });

/* ------------------------------------------------------------
   SATELLITE - box body, two large ruled panels, an antenna.
   ------------------------------------------------------------ */
export function SatelliteModel({ tokens, scale = 1 }: { tokens: SpaceTokens; scale?: number }) {
  const parts = useMemo(() => {
    const body = new THREE.BoxGeometry(0.6, 0.5, 0.6);
    const panel = new THREE.BoxGeometry(1.5, 0.02, 0.6);
    const mast = new THREE.CylinderGeometry(0.012, 0.012, 0.6, 5);
    const bodyEdges = new THREE.EdgesGeometry(body);
    const panelEdges = new THREE.EdgesGeometry(panel);
    // hairline grid across each panel
    const grid: number[] = [];
    for (let k = 1; k < 5; k++) {
      const x = -0.75 + (1.5 * k) / 5;
      grid.push(x, 0.012, -0.3, x, 0.012, 0.3);
    }
    grid.push(-0.75, 0.012, 0, 0.75, 0.012, 0);
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute("position", new THREE.Float32BufferAttribute(grid, 3));
    const bodyMat = new THREE.MeshStandardMaterial({ color: tokens.hull, roughness: 0.8, flatShading: true });
    const panelMat = new THREE.MeshStandardMaterial({ color: tokens.hullLit, roughness: 0.6, metalness: 0.2 });
    const lines = edgeMat(tokens.starlight, 0.5);
    const panelLines = edgeMat(tokens.dim, 0.6);
    return { body, panel, mast, bodyEdges, panelEdges, gridGeo, bodyMat, panelMat, lines, panelLines };
  }, [tokens]);

  useDispose(
    parts.body,
    parts.panel,
    parts.mast,
    parts.bodyEdges,
    parts.panelEdges,
    parts.gridGeo,
    parts.bodyMat,
    parts.panelMat,
    parts.lines,
    parts.panelLines
  );

  return (
    <group scale={scale}>
      <mesh geometry={parts.body} material={parts.bodyMat} />
      <lineSegments geometry={parts.bodyEdges} material={parts.lines} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.15, 0, 0]}>
          <mesh geometry={parts.panel} material={parts.panelMat} />
          <lineSegments geometry={parts.panelEdges} material={parts.panelLines} />
          <lineSegments geometry={parts.gridGeo} material={parts.panelLines} />
        </group>
      ))}
      <mesh geometry={parts.mast} material={parts.bodyMat} position={[0, 0.55, 0]} />
    </group>
  );
}
