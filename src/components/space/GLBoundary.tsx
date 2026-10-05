"use client";

import { Component, type ReactNode } from "react";

/* ============================================================
   GL BOUNDARY - for a <Canvas> that may fail to start.

   A browser can refuse a WebGL context (no GPU, blocked after GPU
   resets, too many contexts open). three.js then throws while the
   canvas mounts; this catches it, renders nothing in its place and
   tells the owner once, so the page can carry on without the scene.
   webglAvailable() checks first, so the usual case never throws.
   ============================================================ */

let cached: boolean | null = null;

/** Can this browser create a WebGL context right now? (asked once; the test context is released at once) */
export function webglAvailable(): boolean {
  if (cached !== null) return cached;
  if (typeof document === "undefined") return true;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") ?? c.getContext("webgl")) as WebGLRenderingContext | null;
    cached = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}

interface Props {
  children: ReactNode;
  onFail(): void;
}

export default class GLBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    cached = false;
    this.props.onFail();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
