"use client";

/* The React Compiler lint rules below assume React-owned values are
   immutable; this file deliberately mutates three.js objects inside
   useFrame, which is the intended react-three-fiber pattern. */
/* eslint-disable react-hooks/immutability, react-hooks/refs */

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { STOPS, type StopKind } from "./stops";

/* ============================================================
   POND SCENE — a top-down koi pond scrubbed by scroll.

   One large koi follows a path that visits every stop in turn.
   Everything is a pure function of scroll progress, so scrolling
   back swims the koi back. The fish, pads and lotus are all
   procedural — no model files.
   ============================================================ */

const { clamp, damp, lerp } = THREE.MathUtils;
const smooth = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

const POND = {
  deep: "#061a1d",
  mid: "#0b2b2e",
  shallow: "#17545a",
  foam: "#f6f1e4",
  koi: "#d9381e",
  gold: "#f0b73a",
  lily: "#2f6b4f",
  lilyLight: "#3f7d5c",
  lotus: "#f2a7a0",
};

/* ---------------- Path & layout ---------------- */

const DZ = 5.4;
const S = STOPS.length;
const KINDS: StopKind[] = STOPS.map((s) => s.kind);

const stopPos = (i: number) => new THREE.Vector3(1.6 * Math.sin(i * 0.75 + 0.4), 0, -i * DZ);

interface Layout {
  xs: Float32Array;
  zs: Float32Array;
  cum: Float32Array;
  keys: { p: number; s: number }[];
  stops: THREE.Vector3[];
  center: THREE.Vector3; // final lotus
  end: number;
}

function buildLayout(): Layout {
  const pts: THREE.Vector3[] = [new THREE.Vector3(stopPos(0).x - 0.8, 0, 7)];
  const stopCtrl: number[] = [];
  const stops: THREE.Vector3[] = [];
  for (let i = 0; i < S - 1; i++) {
    pts.push(stopPos(i));
    stopCtrl[i] = pts.length - 1;
    stops.push(stopPos(i));
  }
  const prev = stopPos(S - 2);
  const center = new THREE.Vector3(prev.x + 0.4, 0, -(S - 1) * DZ - 1);
  const R = 2.7;
  for (let k = 0; k <= 9; k++) {
    const a = Math.PI / 2 - (k * Math.PI) / 4;
    pts.push(new THREE.Vector3(center.x + R * Math.cos(a), 0, center.z + R * Math.sin(a)));
    if (k === 0) stopCtrl[S - 1] = pts.length - 1;
  }
  stops.push(center.clone());

  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const M = pts.length;
  const per = 50;
  const N = (M - 1) * per;
  const xs = new Float32Array(N + 1);
  const zs = new Float32Array(N + 1);
  const cum = new Float32Array(N + 1);
  const v = new THREE.Vector3();
  for (let j = 0; j <= N; j++) {
    curve.getPoint(j / N, v);
    xs[j] = v.x;
    zs[j] = v.z;
    if (j > 0) cum[j] = cum[j - 1] + Math.hypot(xs[j] - xs[j - 1], zs[j] - zs[j - 1]);
  }

  // scroll progress → arclength keys, koi eases to a halt at each stop
  const W = STOPS.reduce((a, s) => a + s.weight, 0);
  const keys: { p: number; s: number }[] = [];
  let acc = 0;
  STOPS.forEach((st, i) => {
    keys.push({ p: (acc + st.weight / 2) / W, s: cum[stopCtrl[i] * per] });
    acc += st.weight;
  });
  keys.unshift({ p: 0, s: keys[0].s });
  keys.push({ p: 1, s: cum[N] });
  return { xs, zs, cum, keys, stops, center, end: cum[N] };
}

function sAt(L: Layout, p: number): number {
  const k = L.keys;
  if (p <= 0) return k[0].s;
  for (let i = 1; i < k.length; i++) {
    if (p <= k[i].p) {
      const t = (p - k[i - 1].p) / Math.max(1e-6, k[i].p - k[i - 1].p);
      return lerp(k[i - 1].s, k[i].s, smooth(t));
    }
  }
  return k[k.length - 1].s;
}

/** fractional stop index for a progress value (0 … S-1) */
function stopFloat(L: Layout, p: number): number {
  const k = L.keys;
  for (let i = 2; i < k.length - 1; i++) {
    if (p <= k[i].p) {
      const a = k[i - 1];
      return i - 2 + clamp((p - a.p) / (k[i].p - a.p), 0, 1);
    }
  }
  return S - 1;
}

function pathAt(L: Layout, s: number, out: [number, number]) {
  const { cum, xs, zs } = L;
  const n = cum.length;
  if (s <= 0) {
    out[0] = xs[0];
    out[1] = zs[0];
    return;
  }
  if (s >= cum[n - 1]) {
    out[0] = xs[n - 1];
    out[1] = zs[n - 1];
    return;
  }
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= s) lo = mid;
    else hi = mid;
  }
  const t = (s - cum[lo]) / Math.max(1e-6, cum[hi] - cum[lo]);
  out[0] = lerp(xs[lo], xs[hi], t);
  out[1] = lerp(zs[lo], zs[hi], t);
}

/* ---------------- Koi ---------------- */

type Pattern = "kohaku" | "showa" | "ogon" | "sanke" | "shiro";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}

function makeKoiTexture(kind: Pattern, seed: number): THREE.CanvasTexture {
  const W = 512;
  const H = 160;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const r = rng(seed);
  const RED = "#d9381e";
  const CREAM = "#f6f1e4";
  const INK = "#131c1b";
  const base = { kohaku: CREAM, showa: INK, ogon: "#e9a326", sanke: CREAM, shiro: CREAM }[kind];
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);

  g.filter = 'blur(2.2px)';
  const blob = (x: number, y: number, rx: number, ry: number, col: string) => {
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(x, y, rx, ry, r() * 0.8 - 0.4, 0, Math.PI * 2);
    g.fill();
  };
  const patches = (cols: string[], n: number, rMin: number, rMax: number, u0: number, u1: number) => {
    for (let i = 0; i < n; i++) {
      const x = (u0 + (u1 - u0) * r()) * W;
      const y = H * (0.25 + 0.5 * r());
      const col = cols[Math.floor(r() * cols.length)];
      const rx = (rMin + (rMax - rMin) * r()) * W;
      blob(x, y, rx, H * (0.18 + 0.2 * r()), col);
      blob(x + rx * 0.7, y + (r() - 0.5) * H * 0.2, rx * 0.5, H * 0.12, col);
    }
  };

  if (kind === "kohaku") {
    blob(W * 0.07, H / 2, W * 0.065, H * 0.36, RED);
    patches([RED], 5, 0.05, 0.1, 0.2, 0.7);
  } else if (kind === "showa") {
    patches([RED], 4, 0.05, 0.1, 0.12, 0.7);
    patches([CREAM], 3, 0.03, 0.06, 0.15, 0.7);
  } else if (kind === "sanke") {
    patches([RED], 4, 0.05, 0.09, 0.1, 0.7);
    patches([INK], 7, 0.012, 0.03, 0.15, 0.72);
  } else if (kind === "ogon") {
    patches(["#cf8a14", "#f3c04a"], 6, 0.04, 0.08, 0.1, 0.72);
  } else {
    blob(W * 0.08, H / 2, W * 0.03, H * 0.2, RED);
  }

  g.filter = 'none';
  // scale scallops
  g.strokeStyle = "rgba(0,0,0,0.07)";
  g.lineWidth = 1.2;
  for (let row = 0; row < 8; row++) {
    for (let x = -10; x < W * 0.78; x += 22) {
      g.beginPath();
      g.arc(x + (row % 2) * 11, 16 + row * 18, 12, 0.15, Math.PI - 0.15);
      g.stroke();
    }
  }
  // body shading: darker along the flanks, a wet highlight down the back
  const flank = g.createLinearGradient(0, 0, 0, H);
  flank.addColorStop(0, 'rgba(0,0,0,0.34)');
  flank.addColorStop(0.28, 'rgba(0,0,0,0.04)');
  flank.addColorStop(0.5, 'rgba(255,255,255,0.10)');
  flank.addColorStop(0.72, 'rgba(0,0,0,0.04)');
  flank.addColorStop(1, 'rgba(0,0,0,0.34)');
  g.fillStyle = flank;
  g.fillRect(0, 0, W * 0.78, H);
  // dorsal fin seen edge-on
  g.strokeStyle = 'rgba(0,0,0,0.22)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(W * 0.33, H / 2);
  g.lineTo(W * 0.68, H / 2);
  g.stroke();
  // gill line + tail-fin streaks
  g.strokeStyle = "rgba(0,0,0,0.12)";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(W * 0.2, H * 0.12);
  g.quadraticCurveTo(W * 0.235, H * 0.5, W * 0.2, H * 0.88);
  g.stroke();

  g.fillStyle = kind === "showa" ? "#3a4240" : kind === "ogon" ? "#e9a326" : CREAM;
  g.fillRect(W * 0.78, 0, W * 0.22, H);
  g.strokeStyle = kind === "ogon" ? "rgba(255,240,200,.6)" : "rgba(217,56,30,.55)";
  g.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    g.beginPath();
    g.moveTo(W * 0.78, H / 2);
    g.lineTo(W, H * (i / 11));
    g.stroke();
  }
  // translucent fin
  g.globalCompositeOperation = "destination-out";
  g.fillStyle = "rgba(0,0,0,0.42)";
  g.fillRect(W * 0.78, 0, W * 0.22, H);
  g.globalCompositeOperation = "source-over";

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const NS = 34;
const NV = 5;

function widthProfile(u: number) {
  if (u < 0.14) return 0.05 + 0.31 * Math.sqrt(u / 0.14);
  if (u < 0.32) return 0.36 - (u - 0.14) * 0.05;
  if (u < 0.78) {
    const k = (u - 0.32) / 0.46;
    return lerp(0.35, 0.085, Math.pow(k, 0.9));
  }
  const k = (u - 0.78) / 0.22;
  return lerp(0.085, 0.34, Math.sin((k * Math.PI) / 2));
}
function heightProfile(u: number) {
  if (u >= 0.78) return 0.02;
  return 0.2 * Math.pow(Math.sin(Math.PI * clamp((u + 0.04) / 0.84, 0, 1)), 0.7) + 0.02;
}

/* A fan-shaped pectoral fin: x outward from the body, -z toward the tail.
   UVs run outward (u) and across the rays (v) so the ray texture converges at the root. */
function makeFinGeometry() {
  const A = 14;
  const pos: number[] = [0, 0, 0];
  const uv: number[] = [0, 0.5];
  const idx: number[] = [];
  for (let k = 0; k <= A; k++) {
    const t = k / A;
    const ang = t * 1.9; // radians swept back
    const R = 0.62 * (1 - 0.32 * t) * (1 + 0.06 * Math.sin(t * 9));
    pos.push(Math.cos(ang) * R, Math.sin(t * Math.PI) * 0.05, -Math.sin(ang) * R);
    uv.push(1, t);
    if (k < A) idx.push(0, k + 1, k + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function makeFinTexture(tint: string) {
  const W = 128;
  const H = 128;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  const col = new THREE.Color(tint);
  for (let y = 0; y < H; y++) {
    const ray = 0.5 + 0.5 * Math.sin(y * 0.95);
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1);
      const a = (0.1 + 0.5 * ray) * (1 - Math.pow(u, 2.2)) + 0.08 * (1 - u);
      const o = (y * W + x) * 4;
      img.data[o] = col.r * 255;
      img.data[o + 1] = col.g * 255;
      img.data[o + 2] = col.b * 255;
      img.data[o + 3] = Math.min(255, a * 255 * 1.25);
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

type SpineFn = (u: number) => [number, number];

function Koi({
  spine,
  pattern,
  seed,
  len = 3.4,
  speed,
  y = -0.25,
}: {
  spine: SpineFn;
  pattern: Pattern;
  seed: number;
  len?: number;
  speed: MutableRefObject<number>;
  y?: number;
}) {
  const [geo] = useState(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NS * NV * 3), 3));
    const uv = new Float32Array(NS * NV * 2);
    for (let i = 0; i < NS; i++)
      for (let v = 0; v < NV; v++) {
        uv[(i * NV + v) * 2] = i / (NS - 1);
        uv[(i * NV + v) * 2 + 1] = v / (NV - 1);
      }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    const idx: number[] = [];
    for (let i = 0; i < NS - 1; i++)
      for (let v = 0; v < NV - 1; v++) {
        const a = i * NV + v;
        const b = a + 1;
        const c = a + NV;
        const d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    g.setIndex(idx);
    return g;
  });
  const [finGeo] = useState(makeFinGeometry);
  const finTex = useMemo(() => makeFinTexture(pattern === "ogon" ? "#f7cf6a" : "#f6f1e4"), [pattern]);
  useEffect(() => () => finTex.dispose(), [finTex]);
  const tex = useMemo(() => makeKoiTexture(pattern, seed), [pattern, seed]);
  useEffect(() => () => tex.dispose(), [tex]);

  const finL = useRef<THREE.Mesh>(null!);
  const finR = useRef<THREE.Mesh>(null!);
  const eyeL = useRef<THREE.Mesh>(null!);
  const eyeR = useRef<THREE.Mesh>(null!);
  const shadow = useRef<THREE.Mesh>(null!);

  const [work] = useState(() => ({
    px: new Float32Array(NS),
    pz: new Float32Array(NS),
    tx: new Float32Array(NS),
    tz: new Float32Array(NS),
    phase: 0,
    vx: new THREE.Vector3(),
    vy: new THREE.Vector3(),
    vz: new THREE.Vector3(),
    m: new THREE.Matrix4(),
    q: new THREE.Quaternion(),
    qf: new THREE.Quaternion(),
    ax: new THREE.Vector3(0, 0, 1),
  }));

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = len / 3.4;
    work.phase += dt * (2.4 + clamp(speed.current, 0, 1) * 4.2);
    const { px, pz, tx, tz } = work;

    for (let i = 0; i < NS; i++) {
      const [x, z] = spine(i / (NS - 1));
      px[i] = x;
      pz[i] = z;
    }
    // tangent (toward the head) for each ring, before wiggle
    const tangent = () => {
      for (let i = 0; i < NS; i++) {
        const a = Math.max(0, i - 1);
        const b = Math.min(NS - 1, i + 1);
        let dx = px[a] - px[b];
        let dz = pz[a] - pz[b];
        const l = Math.hypot(dx, dz) || 1;
        dx /= l;
        dz /= l;
        tx[i] = dx;
        tz[i] = dz;
      }
    };
    tangent();
    for (let i = 0; i < NS; i++) {
      const u = i / (NS - 1);
      const amp = (0.03 + 0.27 * Math.pow(u, 1.6)) * k * (0.6 + 0.4 * clamp(speed.current * 2, 0, 1) + 0.25);
      const off = Math.sin(work.phase - u * 7) * amp;
      px[i] += -tz[i] * off;
      pz[i] += tx[i] * off;
    }
    tangent();

    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < NS; i++) {
      const u = i / (NS - 1);
      const w = widthProfile(u) * k;
      const h = heightProfile(u) * k;
      const nx = -tz[i];
      const nz = tx[i];
      for (let v = 0; v < NV; v++) {
        const s = (v - 2) / 2;
        let x = px[i] + nx * s * w;
        let z = pz[i] + nz * s * w;
        if (i >= NS - 2) {
          const pull = (i === NS - 1 ? 0.24 : 0.08) * k * (1 - Math.abs(s));
          x += tx[i] * pull;
          z += tz[i] * pull;
        }
        pos.setXYZ(i * NV + v, x, y + h * Math.pow(1 - s * s, 0.8), z);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();

    if (shadow.current) shadow.current.position.set(0.5, -0.44, 0.7);

    // eyes
    const ei = 3;
    const ew = widthProfile(ei / (NS - 1)) * k * 0.66;
    const eh = heightProfile(ei / (NS - 1)) * k * 0.7 + y + 0.02;
    eyeL.current.position.set(px[ei] - tz[ei] * -ew, eh, pz[ei] + tx[ei] * -ew);
    eyeR.current.position.set(px[ei] - tz[ei] * ew, eh, pz[ei] + tx[ei] * ew);

    // pectoral fins
    const fi = 8;
    const fw = widthProfile(fi / (NS - 1)) * k * 0.85;
    const flap = Math.sin(work.phase * 0.9) * 0.28 + 0.1;
    const place = (mesh: THREE.Mesh, side: 1 | -1) => {
      const nx = -tz[fi] * side;
      const nz = tx[fi] * side;
      work.vx.set(nx, 0, nz);
      work.vy.set(0, side, 0);
      work.vz.crossVectors(work.vx, work.vy);
      work.m.makeBasis(work.vx, work.vy, work.vz);
      work.q.setFromRotationMatrix(work.m);
      work.qf.setFromAxisAngle(work.ax, -flap * side);
      mesh.quaternion.copy(work.q.multiply(work.qf));
      mesh.position.set(px[fi] + nx * fw, y + 0.1 * k, pz[fi] + nz * fw);
      mesh.scale.setScalar(k * 1.15);
    };
    place(finL.current, 1);
    place(finR.current, -1);
  });

  return (
    <group>
      <mesh ref={shadow} geometry={geo} renderOrder={1} frustumCulled={false}>
        <meshBasicMaterial color="#000000" transparent opacity={0.28} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geo} renderOrder={3} frustumCulled={false}>
        <meshStandardMaterial map={tex} roughness={0.42} metalness={0} transparent side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {[finL, finR].map((r, i) => (
        <mesh key={i} ref={r} geometry={finGeo} renderOrder={4} frustumCulled={false}>
          <meshStandardMaterial map={finTex} roughness={0.6} transparent depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {[eyeL, eyeR].map((r, i) => (
        <mesh key={i} ref={r} renderOrder={5}>
          <sphereGeometry args={[0.048 * (len / 3.4), 10, 8]} />
          <meshBasicMaterial color="#0a0f0f" />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- Water ---------------- */

const WATER_VERT = /* glsl */ `
varying vec2 vXZ;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vXZ = wp.xz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const CAUSTIC_GLSL = /* glsl */ `
// tileable caustic (after "Tileable Water Caustic" by Dave_Hoskins)
float caustic(vec2 uv, float t) {
  vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
  vec2 i = p;
  float c = 1.0;
  float inten = 0.005;
  for (int n = 0; n < 5; n++) {
    float tt = t * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 5.0;
  c = 1.17 - pow(c, 1.4);
  return clamp(pow(abs(c), 8.0), 0.0, 1.0);
}`;

const WATER_FRAG = /* glsl */ `
uniform float uTime;
uniform vec2 uCenter;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uLight;
varying vec2 vXZ;
${CAUSTIC_GLSL}

vec2 h22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

// pebble bed: x = distance to nearest stone centre, y = stone id
vec2 pebbles(vec2 x) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  float md = 8.0;
  float id = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = h22(n + g);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < md) { md = d; id = fract(sin(dot(n + g, vec2(12.9, 78.2))) * 4375.5); }
    }
  }
  return vec2(sqrt(md), id);
}

void main() {
  float t = uTime * 0.45 + 23.0;
  float c = caustic(vXZ * 0.085, t);
  float c2 = caustic(vXZ * 0.047 + 0.31, t * 0.7);
  float shade = 0.5 + 0.5 * sin(vXZ.x * 0.11 + vXZ.y * 0.07 + uTime * 0.05);
  vec3 col = mix(uDeep, uMid, shade * 0.6 + 0.2);

  // stones on the pond floor, seen through the water
  vec2 pb = pebbles(vXZ * 0.9);
  float gap = smoothstep(0.12, 0.5, pb.x);
  vec3 stone = mix(vec3(0.05, 0.085, 0.085), vec3(0.16, 0.19, 0.17), pb.y);
  col = mix(col, stone * (1.0 - gap * 0.7), 0.5);

  col += uLight * (c * 0.55 + c2 * 0.35);
  float d = length(vXZ - uCenter);
  col = mix(col, uDeep, smoothstep(9.0, 26.0, d));
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

const SURFACE_FRAG = /* glsl */ `
uniform float uTime;
uniform vec2 uCenter;
varying vec2 vXZ;
${CAUSTIC_GLSL}
void main() {
  float t = uTime * 0.5 + 7.0;
  float c = caustic(vXZ * 0.11, t) * 0.7 + caustic(vXZ * 0.07 + 0.5, t * 0.8) * 0.5;
  float d = length(vXZ - uCenter);
  float fade = 1.0 - smoothstep(6.0, 22.0, d);
  vec3 light = vec3(0.42, 0.78, 0.72) * c * 0.42 * fade;
  // a whisper of teal murk so the fish sit under the water, not on it
  gl_FragColor = vec4(light + vec3(0.01, 0.05, 0.05) * fade, 0.16 * fade + c * 0.2 * fade);
}`;

function Water({ focus }: { focus: MutableRefObject<THREE.Vector3> }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const [uniforms] = useState(() => ({
    uTime: { value: 0 },
    uCenter: { value: new THREE.Vector2() },
    uDeep: { value: new THREE.Color(POND.deep) },
    uMid: { value: new THREE.Color(POND.mid) },
    uLight: { value: new THREE.Color("#4fa39a").multiplyScalar(0.55) },
  }));
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uCenter.value.set(focus.current.x, focus.current.z);
    mesh.current.position.set(focus.current.x, -0.7, focus.current.z);
  });
  return (
    <>
      <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[90, 90]} />
        <shaderMaterial vertexShader={WATER_VERT} fragmentShader={WATER_FRAG} uniforms={uniforms} />
      </mesh>
    </>
  );
}

function SurfaceLight({ focus }: { focus: MutableRefObject<THREE.Vector3> }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const [uniforms] = useState(() => ({
    uTime: { value: 0 },
    uCenter: { value: new THREE.Vector2() },
  }));
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uCenter.value.set(focus.current.x, focus.current.z);
    mesh.current.position.set(focus.current.x, -0.05, focus.current.z);
  });
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} renderOrder={6}>
      <planeGeometry args={[60, 60]} />
      <shaderMaterial
        vertexShader={WATER_VERT}
        fragmentShader={SURFACE_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* drifting specks of pollen and petal on the surface */
function Specks({ focus }: { focus: MutableRefObject<THREE.Vector3> }) {
  const N = 70;
  const ref = useRef<THREE.InstancedMesh>(null!);
  const [dummy] = useState(() => new THREE.Object3D());
  const [seeds] = useState(() => {
    const r = rng(5);
    return Array.from({ length: N }, () => ({ x: r() * 34, z: r() * 34, s: 0.03 + r() * 0.05, vx: (r() - 0.5) * 0.12, vz: (r() - 0.5) * 0.12 }));
  });
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const f = focus.current;
    seeds.forEach((p, i) => {
      const wx = (((p.x + p.vx * t - f.x) % 34) + 34) % 34 - 17;
      const wz = (((p.z + p.vz * t - f.z) % 34) + 34) % 34 - 17;
      dummy.position.set(f.x + wx, 0.035, f.z + wz);
      dummy.rotation.set(-Math.PI / 2, 0, i);
      dummy.scale.set(p.s, p.s * 0.6, p.s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <circleGeometry args={[1, 8]} />
      <meshBasicMaterial color={POND.foam} transparent opacity={0.55} depthWrite={false} />
    </instancedMesh>
  );
}

/* ---------------- Pads, lotus, stones ---------------- */

function makePadGeometry() {
  const ROWS = 7;
  const SEGS = 44;
  const notch = 0.34;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let r = 0; r <= ROWS; r++) {
    const t = r / ROWS;
    for (let k = 0; k <= SEGS; k++) {
      const th = notch / 2 + (k / SEGS) * (Math.PI * 2 - notch);
      const curl = 0.11 * Math.pow(t, 3) + 0.012 * Math.sin(th * 5 + t * 4) * t;
      pos.push(t * Math.cos(th), curl, t * Math.sin(th));
      uv.push(0.5 + 0.5 * t * Math.cos(th), 0.5 + 0.5 * t * Math.sin(th));
    }
  }
  for (let r = 0; r < ROWS; r++)
    for (let k = 0; k < SEGS; k++) {
      const a = r * (SEGS + 1) + k;
      const b = a + 1;
      const c = a + SEGS + 1;
      const d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  // the notch reaches the centre: the first ring collapses to the hub
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function makePadTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d')!;
  const rad = g.createRadialGradient(S / 2, S / 2, 6, S / 2, S / 2, S / 2);
  rad.addColorStop(0, '#2b6046');
  rad.addColorStop(0.7, '#3d7a58');
  rad.addColorStop(1, '#2a5a40');
  g.fillStyle = rad;
  g.fillRect(0, 0, S, S);
  const r = rng(9);
  // mottling
  for (let i = 0; i < 90; i++) {
    g.fillStyle = r() > 0.5 ? 'rgba(120,170,110,0.08)' : 'rgba(10,40,30,0.10)';
    g.beginPath();
    g.ellipse(r() * S, r() * S, 6 + r() * 22, 4 + r() * 14, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  // radial veins
  g.lineWidth = 1.4;
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + r() * 0.1;
    g.strokeStyle = i % 2 ? 'rgba(170,215,150,0.28)' : 'rgba(10,45,30,0.32)';
    g.beginPath();
    g.moveTo(S / 2, S / 2);
    g.quadraticCurveTo(S / 2 + Math.cos(a + 0.12) * S * 0.25, S / 2 + Math.sin(a + 0.12) * S * 0.25, S / 2 + Math.cos(a) * S * 0.5, S / 2 + Math.sin(a) * S * 0.5);
    g.stroke();
  }
  // dew
  for (let i = 0; i < 9; i++) {
    const x = S * (0.25 + r() * 0.5);
    const y = S * (0.25 + r() * 0.5);
    g.fillStyle = 'rgba(230,250,240,0.55)';
    g.beginPath();
    g.arc(x, y, 1.6 + r() * 2.2, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function Pad({ x, z, r, tone = 0, rot = 0 }: { x: number; z: number; r: number; tone?: number; rot?: number }) {
  const ref = useRef<THREE.Group>(null!);
  const seed = (x * 7.3 + z * 3.1) % 6;
  const { geo, tex } = usePadAssets();
  useFrame(({ clock }) => {
    ref.current.position.y = 0.02 + Math.sin(clock.elapsedTime * 0.8 + seed) * 0.012;
  });
  return (
    <>
      <group ref={ref} position={[x, 0.02, z]} rotation={[0, rot, 0]} scale={[r, r, r]}>
        <mesh geometry={geo}>
          <meshStandardMaterial map={tex} color={tone ? '#ffffff' : '#c9dcc0'} roughness={0.55} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* soft shadow on the pond floor */}
      <mesh geometry={geo} position={[x + 0.4, -0.66, z + 0.55]} rotation={[0, rot, 0]} scale={[r * 1.02, 0.01, r * 1.02]}>
        <meshBasicMaterial color="#000000" transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

const PadAssetsCtx: { geo: THREE.BufferGeometry | null; tex: THREE.CanvasTexture | null } = { geo: null, tex: null };
function usePadAssets() {
  // built once on first use, then shared by every pad
  if (!PadAssetsCtx.geo) PadAssetsCtx.geo = makePadGeometry();
  if (!PadAssetsCtx.tex) PadAssetsCtx.tex = makePadTexture();
  return { geo: PadAssetsCtx.geo, tex: PadAssetsCtx.tex };
}

function Lotus({ x, z, scale, open }: { x: number; z: number; scale: number; open: MutableRefObject<number> }) {
  const petals = useRef<(THREE.Group | null)[]>([]);
  const [petalGeo] = useState(() => {
    const g = new THREE.SphereGeometry(1, 12, 8);
    g.scale(0.2, 0.6, 0.075);
    g.translate(0, 0.55, 0);
    // white at the base, pink at the tip
    const p = g.getAttribute('position');
    const col = new Float32Array(p.count * 3);
    const base = new THREE.Color(POND.foam);
    const tip = new THREE.Color(POND.lotus);
    const tmp = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      tmp.copy(base).lerp(tip, clamp((p.getY(i) - 0.2) / 0.95, 0, 1) ** 1.3);
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  });
  const N = 14;
  useFrame(() => {
    const o = open.current;
    petals.current.forEach((g, i) => {
      if (!g) return;
      const ring = i < 8 ? 0 : 1;
      const tiltClosed = ring ? 0.1 : 0.32;
      const tiltOpen = ring ? 0.85 : 1.35;
      g.rotation.x = lerp(tiltClosed, tiltOpen, smooth(o));
    });
  });
  return (
    <group position={[x, 0.05, z]} scale={scale}>
      {Array.from({ length: N }, (_, i) => {
        const ring = i < 8 ? 0 : 1;
        const n = ring ? 6 : 8;
        const k = ring ? i - 8 : i;
        return (
          <group key={i} rotation={[0, (k / n) * Math.PI * 2 + ring * 0.4, 0]}>
            <group ref={(el) => { petals.current[i] = el; }} rotation={[0.3, 0, 0]}>
              <mesh geometry={petalGeo}>
                <meshStandardMaterial vertexColors color={ring ? "#fff3f0" : "#ffffff"} roughness={0.6} />
              </mesh>
            </group>
          </group>
        );
      })}
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.2, 14, 10]} />
        <meshStandardMaterial color={POND.gold} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Stone({ x, z, s, y = 0 }: { x: number; z: number; s: number; y?: number }) {
  return (
    <mesh position={[x, y + s * 0.25, z]} scale={[s, s * 0.6, s * 0.85]} rotation={[0, x, 0]}>
      <dodecahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#2c3b3a" roughness={0.95} flatShading />
    </mesh>
  );
}

function Features({ L, wide, near }: { L: Layout; wide: boolean; near: MutableRefObject<number[]> }) {
  const off = wide ? 2.7 : 1.9;
  const scatter = useMemo(() => {
    const r = rng(11);
    const list: { x: number; z: number; r: number }[] = [];
    for (let n = 0; n < 46; n++) {
      const z = 8 - r() * (S * DZ + 14);
      const px = 1.6 * Math.sin((-z / DZ) * 0.75 + 0.4);
      const side = r() > 0.5 ? 1 : -1;
      list.push({ x: px + side * (3.2 + r() * 5.5), z, r: 0.45 + r() * 0.65 });
    }
    return list;
  }, []);
  const opens = useMemo(() => Array.from({ length: S }, () => ({ current: 0 })), []);
  useFrame((_, dt) => {
    for (let i = 0; i < S; i++) opens[i].current = damp(opens[i].current, near.current[i] ?? 0, 4, Math.min(dt, 0.05));
  });

  return (
    <>
      {scatter.map((p, i) => (
        <Pad key={i} x={p.x} z={p.z} r={p.r} tone={i % 3 === 0 ? 1 : 0} rot={i} />
      ))}
      {L.stops.map((sp, i) => {
        const kind = KINDS[i];
        if (kind === "invite") {
          return (
            <group key={i}>
              <Lotus x={sp.x} z={sp.z} scale={wide ? 2.3 : 1.55} open={opens[i]} />
              {[0, 1, 2, 3, 4, 5].map((k) => {
                const a = (k / 6) * Math.PI * 2 + 0.3;
                return <Pad key={k} x={sp.x + Math.cos(a) * 4.7} z={sp.z + Math.sin(a) * 4.7} r={0.9 + (k % 3) * 0.2} rot={k} />;
              })}
            </group>
          );
        }
        const x = sp.x + off;
        return (
          <group key={i}>
            <Pad x={x} z={sp.z} r={1.15} tone={kind === "past" ? 0 : 1} rot={i * 0.7} />
            {kind === "intro" && <Pad x={x + 1.2} z={sp.z - 1} r={0.6} rot={2} />}
            {kind === "past" && <Pad x={x - 0.9} z={sp.z + 1.3} r={0.5} rot={1} />}
            {kind === "upcoming" && <Lotus x={x} z={sp.z} scale={1} open={opens[i]} />}
            {kind === "do" && (
              <>
                <Stone x={x} z={sp.z} s={0.9} />
                <Stone x={x + 1.1} z={sp.z + 0.6} s={0.55} />
                <Stone x={x - 0.9} z={sp.z + 0.9} s={0.4} />
              </>
            )}
          </group>
        );
      })}
    </>
  );
}

/* ---------------- Ripples ---------------- */

const RIPPLES = 7;

function Ripples({ head, speed, burst }: { head: MutableRefObject<THREE.Vector3>; speed: MutableRefObject<number>; burst: MutableRefObject<THREE.Vector3 | null> }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const [st] = useState(() => ({
    age: new Float32Array(RIPPLES).fill(99),
    x: new Float32Array(RIPPLES),
    z: new Float32Array(RIPPLES),
    big: new Float32Array(RIPPLES),
    timer: 0,
    next: 0,
  }));
  const spawn = (x: number, z: number, big: number) => {
    const i = st.next;
    st.next = (st.next + 1) % RIPPLES;
    st.age[i] = 0;
    st.x[i] = x;
    st.z[i] = z;
    st.big[i] = big;
  };
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    st.timer += dt;
    const every = 0.85 - clamp(speed.current, 0, 1) * 0.45;
    if (st.timer > every) {
      st.timer = 0;
      spawn(head.current.x, head.current.z, 1);
    }
    if (burst.current) {
      spawn(burst.current.x, burst.current.z, 2.2);
      burst.current = null;
    }
    for (let i = 0; i < RIPPLES; i++) {
      const m = refs.current[i];
      if (!m) continue;
      st.age[i] += dt;
      const life = st.age[i] / 2.6;
      m.visible = life < 1;
      if (life < 1) {
        m.position.set(st.x[i], 0.03, st.z[i]);
        m.scale.setScalar(0.4 + life * 2.4 * st.big[i]);
        (m.material as THREE.MeshBasicMaterial).opacity = (1 - life) * (1 - life) * 0.2;
      }
    }
  });
  return (
    <>
      {Array.from({ length: RIPPLES }, (_, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.965, 1, 72]} />
          <meshBasicMaterial color={POND.foam} transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

/* ---------------- Director ---------------- */

function Director({ progress, reduced }: { progress: MutableRefObject<number>; reduced: boolean }) {
  const { camera, size } = useThree();
  const wide = size.width / size.height > 1.15;
  const [L] = useState(buildLayout);

  const state = useRef({ p: 0, s: 0, prevS: 0, activeIdx: -1 });
  const head = useRef(new THREE.Vector3());
  const focus = useRef(new THREE.Vector3());
  const speed = useRef(0);
  const near = useRef<number[]>(new Array(S).fill(0));
  const burst = useRef<THREE.Vector3 | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const tmp = useMemo<[number, number]>(() => [0, 0], []);
  const cam = useMemo(() => new THREE.Vector3(), []);
  const still = useRef(true);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const LEN = 3.4;
  const heroSpine = useMemo<SpineFn>(
    () => (u) => {
      const o: [number, number] = [0, 0];
      pathAt(L, state.current.s - u * LEN, o);
      return o;
    },
    [L]
  );

  // ambient companions swim loose circles near the camera
  const ambient = useMemo(() => {
    const make = (r: number, w: number, ph: number, ox: number, oz: number, sq: number): SpineFn => (u) => {
      const t = performance.now() / 1000;
      const th = ph + t * w - u * (2.6 / r);
      const f = focus.current;
      return [f.x + ox + r * Math.cos(th), f.z + oz + r * sq * Math.sin(th)];
    };
    return [
      make(3.6, 0.22, 0.5, wide ? 3.4 : 0, wide ? -2.5 : -2.5, 0.75),
      make(2.6, -0.3, 2.4, wide ? 5.2 : 0.5, wide ? 2.5 : 2.5, 0.8),
    ];
  }, [wide]);
  const calm = useRef(0.25);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const st = state.current;
    st.p = reduced ? progress.current : damp(st.p, progress.current, 4.2, dt);
    st.s = sAt(L, st.p);
    const vel = Math.abs(st.s - st.prevS) / Math.max(dt, 1e-3);
    st.prevS = st.s;
    speed.current = damp(speed.current, clamp(vel / 5, 0, 1), 5, dt);

    pathAt(L, st.s, tmp);
    head.current.set(tmp[0], 0, tmp[1]);

    // proximity to each stop drives lotus bloom
    const sf = stopFloat(L, st.p);
    for (let i = 0; i < S; i++) near.current[i] = clamp(1 - Math.abs(sf - i) * 1.4, 0, 1);
    const idx = Math.round(sf);
    if (idx !== st.activeIdx) {
      st.activeIdx = idx;
      burst.current = L.stops[idx].clone().add(new THREE.Vector3(KINDS[idx] === "invite" ? 0 : wide ? 2.7 : 1.9, 0, 0));
    }

    // camera follows the koi, keeping it on the right (desktop) / upper half (mobile)
    const tx = head.current.x - (wide ? 2.4 : 0.3);
    const tz = head.current.z + (wide ? -1.2 : 2.4);
    if (still.current) {
      focus.current.set(tx, 0, tz);
      still.current = false;
    } else {
      focus.current.x = damp(focus.current.x, tx, 3.5, dt);
      focus.current.z = damp(focus.current.z, tz, 3.5, dt);
    }
    const H = wide ? 15 : 19.5;
    const Zc = wide ? 7.5 : 9.5;
    const px = reduced ? 0 : pointer.current.x * 0.5;
    const py = reduced ? 0 : pointer.current.y * 0.3;
    cam.set(focus.current.x + px, H, focus.current.z + Zc + py);
    camera.position.copy(cam);
    camera.lookAt(focus.current);
  });

  return (
    <>
      <fog attach="fog" args={[POND.deep, 20, 46]} />
      <hemisphereLight args={[0xcfe9e4, 0x0b2b2e, 1.35]} />
      <directionalLight position={[-5, 12, 4]} intensity={1.9} />

      <Water focus={focus} />
      <Specks focus={focus} />
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false} />
      <Features L={L} wide={wide} near={near} />
      <Ripples head={head} speed={speed} burst={burst} />

      <Koi spine={ambient[0]} pattern="ogon" seed={7} len={2.5} speed={calm} y={-0.35} />
      {wide && <Koi spine={ambient[1]} pattern="showa" seed={21} len={2.9} speed={calm} y={-0.4} />}
      <Koi spine={heroSpine} pattern="kohaku" seed={3} len={LEN} speed={speed} y={-0.22} />
      <SurfaceLight focus={focus} />
    </>
  );
}

/* ---------------- Canvas wrapper ---------------- */

export default function PondScene({
  progress,
  active,
  reduced,
}: {
  progress: MutableRefObject<number>;
  active: boolean;
  reduced: boolean;
}) {
  return (
    <Canvas
      flat
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 32, position: [0, 15, 14], near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={[POND.deep]} />
      <Director progress={progress} reduced={reduced} />
    </Canvas>
  );
}
