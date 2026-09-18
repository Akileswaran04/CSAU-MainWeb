"use client";

import { useEffect, useRef } from "react";

/* ============================================================
   POND BACKDROP — the water every page floats on.

   One fixed, low-resolution WebGL canvas (raw WebGL, no three.js)
   behind all content: deep teal water with slow caustic light,
   two koi drifting far below the surface, and ripples that open
   wherever the pointer moves. Pages must keep their own
   backgrounds transparent so it shows through.
   ============================================================ */

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uScroll;
uniform vec3 uRip[4]; // xy in uv space, z = birth time

float caustic(vec2 uv, float t) {
  vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
  vec2 i = p;
  float c = 1.0;
  float inten = 0.005;
  for (int n = 0; n < 4; n++) {
    float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 4.0;
  c = 1.17 - pow(c, 1.4);
  return clamp(pow(abs(c), 8.0), 0.0, 1.0);
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

// koi seen from above: a chain of discs along a wiggling spine.
// returns x = coverage, y = pattern (0 cream .. 1 red)
vec2 koi(vec2 uv, vec2 c, float ang, float len, float t, float seed) {
  vec2 d = uv - c;
  float ca = cos(ang), sa = sin(ang);
  vec2 q = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y); // q.x along body (head at +x)
  float u = clamp(-q.x / len, -0.05, 1.05);                  // 0 head .. 1 tail
  float wig = sin(t * 2.2 - u * 6.5 + seed) * 0.05 * len * (0.2 + u);
  float w = 0.0;
  if (u < 0.14) w = 0.02 + 0.13 * sqrt(max(u, 0.0) / 0.14);
  else if (u < 0.78) w = mix(0.15, 0.04, pow((u - 0.14) / 0.64, 0.9));
  else w = mix(0.04, 0.16, sin((u - 0.78) / 0.22 * 1.5708));
  w *= len;
  float dist = abs(q.y - wig) - w;
  float inside = (u > -0.02 && u < 1.0) ? 1.0 - smoothstep(-0.012, 0.012, dist) : 0.0;
  float pat = smoothstep(0.45, 0.55, noise(vec2(u * 5.0 + seed, q.y * 9.0 / len) + seed));
  pat = max(pat, 1.0 - smoothstep(0.0, 0.16, u));
  return vec2(inside, pat);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes.y;
  uv.y += uScroll * 0.00018;
  float t = uTime;

  // base water: deep at the edges, a little lighter in the middle
  vec2 sc = gl_FragCoord.xy / uRes - 0.5;
  float vig = smoothstep(0.95, 0.15, length(sc * vec2(1.0, 0.9)));
  vec3 deep = vec3(0.024, 0.102, 0.114);
  vec3 mid = vec3(0.043, 0.169, 0.180);
  vec3 col = mix(deep, mid, vig * 0.85);

  // surface distortion from ripples
  vec2 off = vec2(0.0);
  float ring = 0.0;
  for (int i = 0; i < 4; i++) {
    float age = t - uRip[i].z;
    if (age > 0.0 && age < 4.0) {
      vec2 dv = uv - uRip[i].xy;
      float d = length(dv);
      float front = age * 0.22;
      float e = (d - front) * 22.0;
      float w = exp(-e * e) * exp(-age * 0.9);
      off += normalize(dv + 1e-4) * w * 0.006;
      ring += w * 0.5;
    }
  }
  vec2 wuv = uv + off;

  // koi drifting deep below
  float k1 = 0.0, k2 = 0.0;
  vec2 kp1 = vec2(0.9 + 0.55 * sin(t * 0.07), 0.55 + 0.25 * cos(t * 0.05));
  vec2 kp2 = vec2(1.5 + 0.5 * cos(t * 0.06 + 1.0), 0.3 + 0.22 * sin(t * 0.08 + 2.0));
  vec2 a = koi(wuv, kp1, 0.7 + 0.6 * sin(t * 0.07), 0.36, t, 1.0);
  vec2 b = koi(wuv, kp2, 3.6 + 0.6 * cos(t * 0.06 + 1.0), 0.3, t, 4.0);
  vec3 kcol1 = mix(vec3(0.20, 0.32, 0.30), vec3(0.42, 0.13, 0.09), a.y);
  vec3 kcol2 = mix(vec3(0.05, 0.10, 0.10), vec3(0.34, 0.20, 0.06), b.y);
  col = mix(col, kcol1, a.x * 0.3);
  col = mix(col, kcol2, b.x * 0.36);

  // caustic light on top of everything
  float c1 = caustic(wuv * 0.9, t * 0.35 + 23.0);
  float c2 = caustic(wuv * 0.5 + 0.31, t * 0.24 + 5.0);
  col += vec3(0.22, 0.46, 0.44) * (c1 * 0.20 + c2 * 0.14) * (0.5 + vig);
  col += vec3(0.5, 0.7, 0.68) * ring * 0.18;

  gl_FragColor = vec4(col, 1.0);
}`;

export default function PondBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uScroll = gl.getUniformLocation(prog, "uScroll");
    const uRip = gl.getUniformLocation(prog, "uRip");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 820px)").matches;
    const scale = mobile ? 0.4 : 0.5;
    const rip = new Float32Array(12);
    for (let i = 0; i < 4; i++) rip[i * 3 + 2] = -100;
    let next = 0;
    let lastSpawn = 0;
    const start = performance.now();
    const now = () => (performance.now() - start) / 1000;

    const resize = () => {
      canvas.width = Math.max(2, Math.floor(window.innerWidth * scale));
      canvas.height = Math.max(2, Math.floor(window.innerHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = (clientX: number, clientY: number) => {
      const t = now();
      if (t - lastSpawn < 0.45) return;
      lastSpawn = t;
      const h = window.innerHeight;
      rip[next * 3] = clientX / h;
      rip[next * 3 + 1] = 1 - clientY / h;
      rip[next * 3 + 2] = t;
      next = (next + 1) % 4;
    };
    const onMove = (e: PointerEvent) => spawn(e.clientX, e.clientY);
    const onDown = (e: PointerEvent) => {
      lastSpawn = -1;
      spawn(e.clientX, e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });

    let raf = 0;
    let last = 0;
    const draw = (ts: number) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden) return;
      if (ts - last < 33) return; // ~30fps is plenty for slow water
      last = ts;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, now());
      gl.uniform1f(uScroll, window.scrollY);
      gl.uniform3fv(uRip, rip);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    if (reduced) {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, 12);
      gl.uniform1f(uScroll, 0);
      gl.uniform3fv(uRip, rip);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
        background: "var(--pond-950)",
      }}
    />
  );
}
