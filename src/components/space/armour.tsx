"use client";

import { useEffect, useMemo, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

/* ============================================================
   THE SHIP'S ARMOUR - how the ship evolves at the Contact stop. The
   ship itself stays (its S-foils fold flat first, ShipModel's `fold`)
   and armour locks onto it, after the owner's reference (a gunmetal
   fighter with lime-green armour and cyan lights):
     - a faceted gunmetal body over the fuselage, a dark canopy behind
       a V of cyan light, hexagon plates;
     - a lime-green fork: two long lime blades reaching past the nose
       to a point, two shorter ones under them, and a nose cannon
       between them;
     - a lime roll-bar arching over the cockpit;
     - gull wings over the folded foils: out and level, then bent
       steeply down at an elbow, a fin standing up at each elbow, a
       blue light at each tip, a comb of teeth under the trailing
       edge, lime stripes and cyan leading edges; the foils' cannons
       still reach out ahead of them;
     - thin spikes rising off the wing roots, a V-tail, two dark
       blades raking down under the stern, and an engine block with
       cyan rings.
   Built in ShipModel's own units (nose to -z at z -4, stern at
   z 2.7), so it is drawn at the ship's scale and fits round it.

   `morph` (0 to 1, played over a few seconds by the Director): a
   cyan charge round the ship as its foils fold, then a swarm of
   nano particles streams in from all round, spiralling, and the
   armour grows where they land, a glowing front spreading out from
   the cockpit to the nose and the wingtips; then the lights come
   on and a shockwave rings out. Played backwards the front draws
   back in and the particles stream off again.
   An original design in the reference's spirit, built from three.js
   shapes.
   ============================================================ */

const GREY_TOP = new THREE.Color("#c3cad3");
const GREY_LOW = new THREE.Color("#454b55");
const DARK = "#262a31";
const LIME = "#a5e233";
const CYAN = "#1fb4e0"; // not brighter: the bloom would turn it white
const BLUE = "#3f9fff";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** a faceted solid round a set of points */
const hull = (pts: number[][]) => new ConvexGeometry(pts.map(([x, y, z]) => V(x, y, z)));
/** a thin solid through a few points, made `t` thick across x (a blade or a fin) */
const blade = (pts: number[][], t = 0.04) => hull(pts.flatMap(([x, y, z]) => [[x - t, y, z], [x + t, y, z]]));
/** the same, made thick along y (a plate lying flat) */
const slab = (pts: number[][], t = 0.04) => hull(pts.flatMap(([x, y, z]) => [[x, y - t, z], [x, y + t, z]]));
/** gunmetal, lighter on top, darker underneath (or one colour, `flat`) */
function paint(g: THREE.BufferGeometry, flat?: THREE.Color) {
  const p = g.getAttribute("position");
  const c = new Float32Array(p.count * 3);
  const col = new THREE.Color();
  for (let i = 0; i < p.count; i++) (flat ? col.copy(flat) : col.copy(GREY_LOW).lerp(GREY_TOP, clamp01((p.getY(i) + 0.45) / 1.1))).toArray(c, i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  return g;
}

/* the nano build: where the front starts (the cockpit), and how far it has got over morph */
const ORIGIN = V(0, 0.4, 0.4);
const GROW_AT = 0.12; // morph share when it starts
const GROW_FOR = 0.66; // and how long it takes
const R0 = -0.6; // the front's radius at the start
const R1 = 7.8; // and at the end: past the nose cannon's muzzle
/** a particle's flight in, in morph shares */
const FLY = 0.16;
/** a surface point is built when its distance from ORIGIN, plus a grain of up to 0.5, is inside the front */
const front = (m: number) => R0 + (R1 - R0) * clamp01((m - GROW_AT) / GROW_FOR);
/** the morph at which the front reaches distance d (the grain at its mean, 0.25) */
const arrival = (d: number) => GROW_AT + (GROW_FOR * (d + 0.25 - R0)) / (R1 - R0);

/* the armour's materials, cut away outside the front, with a cyan band where it is growing */
const NANO_VERT_HEAD = "attribute vec3 aNano;\nvarying vec3 vNanoP;\n";
const NANO_FRAG_HEAD = /* glsl */ `
uniform float uFront;
uniform vec3 uNanoGlow;
uniform float uHeat;
uniform float uCharge;
uniform float uTime;
varying vec3 vNanoP;
float nanoEdge;
float nanoGrain(vec3 p) { return fract(sin(dot(floor(p * 9.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
`;
const NANO_FRAG_CLIP = /* glsl */ `
  float nanoD = length(vNanoP - vec3(${ORIGIN.x.toFixed(2)}, ${ORIGIN.y.toFixed(2)}, ${ORIGIN.z.toFixed(2)})) + nanoGrain(vNanoP) * 0.5;
  if (nanoD > uFront) discard;
  nanoEdge = 1.0 - smoothstep(0.0, 0.45, uFront - nanoD);
`;

/* round the Sun (`fx`): the hull glows hot, in slow moving patches, then, charging, bands of cyan light crawl over it */
const NANO_FRAG_FX = /* glsl */ `
  gl_FragColor.rgb += uNanoGlow * nanoEdge;
  gl_FragColor.rgb += vec3(1.0, 0.36, 0.08) * uHeat * (0.3 + 0.25 * sin(vNanoP.x * 2.3 + vNanoP.z * 1.7 + uTime * 5.0));
  float band = smoothstep(0.9, 1.0, sin(vNanoP.z * 1.4 - uTime * 7.0) * 0.5 + 0.5) + 0.6 * smoothstep(0.95, 1.0, sin(vNanoP.x * 2.1 + uTime * 5.0) * 0.5 + 0.5);
  gl_FragColor.rgb += uNanoGlow * band * uCharge * 1.4;
`;

/* sparks in the heat: some of the swarm's points, streaming back off the hull (the nose is -z) and burning out */
const SPARK_VERT = /* glsl */ `
attribute float aAt;
attribute float aSize;
uniform float uTime;
uniform float uHeat;
uniform float uPx;
varying float vA;
varying float vP;
void main() {
  float ph = fract(uTime * 0.8 + fract(aAt * 331.0));
  vec4 mv = modelViewMatrix * vec4(position + vec3(0.0, ph * 0.8, ph * ph * 10.0), 1.0);
  gl_Position = projectionMatrix * mv;
  vP = ph;
  vA = uHeat * (1.0 - ph) * step(fract(aAt * 917.0), 0.3);
  gl_PointSize = vA > 0.001 ? min(5.0, aSize * uPx * 24.0 / max(1.0, -mv.z)) : 0.0;
}`;
const SPARK_FRAG = /* glsl */ `
varying float vA;
varying float vP;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0 || vA <= 0.0) discard;
  gl_FragColor = vec4(mix(vec3(1.0, 0.85, 0.5), vec3(1.0, 0.25, 0.05), vP) * exp(-r2 * 3.0) * vA, 1.0);
  #include <colorspace_fragment>
}`;

/* the heat shield: a shell round the ship, bright at its rim, rippling and flickering */
const SHIELD_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying vec3 vP;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  vP = position;
  gl_Position = projectionMatrix * mv;
}`;
const SHIELD_FRAG = /* glsl */ `
uniform float uTime;
uniform float uHeat;
varying vec3 vN;
varying vec3 vV;
varying vec3 vP;
void main() {
  float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.5);
  float ripple = 0.7 + 0.3 * sin(vP.y * 14.0 + vP.z * 6.0 - uTime * 6.0);
  float flick = 0.65 + 0.35 * sin(uTime * 23.0) * sin(uTime * 7.3);
  gl_FragColor = vec4(mix(vec3(1.0, 0.45, 0.12), vec3(0.12, 0.7, 0.9), 0.35) * rim * ripple * flick * uHeat * 0.4, 1.0);
}`;

/* the swarm: each particle flies from out round the ship to a point on the armour, spiralling round the ship's
   long axis, and fades into the surface as the front reaches it */
const SWARM_VERT = /* glsl */ `
attribute vec3 aFrom;
attribute float aAt;
attribute float aSize;
uniform float uM;
uniform float uPx;
varying float vA;
varying float vK;
void main() {
  float k = clamp((uM - aAt + ${FLY}) / ${FLY}, 0.0, 1.0);
  float e = 1.0 - pow(1.0 - k, 3.0);
  vec3 off = aFrom - position;
  float sw = (1.0 - e) * 2.4;
  off.xy = mat2(cos(sw), sin(sw), -sin(sw), cos(sw)) * off.xy;
  vec4 mv = modelViewMatrix * vec4(position + off * (1.0 - e), 1.0);
  gl_Position = projectionMatrix * mv;
  vK = k;
  vA = smoothstep(0.0, 0.2, k) * (1.0 - smoothstep(0.0, 0.05, uM - aAt));
  gl_PointSize = vA > 0.0 ? min(6.0, aSize * uPx * 30.0 / max(1.0, -mv.z)) : 0.0;
}`;
const SWARM_FRAG = /* glsl */ `
uniform vec3 uCol;
varying float vA;
varying float vK;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(q, q);
  if (r2 > 1.0 || vA <= 0.0) discard;
  gl_FragColor = vec4(mix(uCol, vec3(1.0), vK * vK * 0.6) * exp(-r2 * 3.0) * vA, 1.0);
  #include <colorspace_fragment>
}`;

/** `fx`, round the Sun: `heat` (the hull glowing, sparks, the shield) and `charge` (sunlight soaked up), each 0 to 1 */
export function ShipArmour({ morph, fx, scale = 1, low = false }: { morph: MutableRefObject<number>; fx?: MutableRefObject<{ heat: number; charge: number }>; scale?: number; low?: boolean }) {
  const built = useMemo(() => {
    const root = new THREE.Group();
    const geos: THREE.BufferGeometry[] = [];
    const keep = <G extends THREE.BufferGeometry>(g: G) => (geos.push(g), g);
    const metal = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.35, emissive: new THREE.Color("#1a2028"), flatShading: true, side: THREE.DoubleSide });
    const dark = new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.55, metalness: 0.45, flatShading: true, side: THREE.DoubleSide });
    const lime = new THREE.MeshStandardMaterial({ color: LIME, roughness: 0.35, metalness: 0.2, emissive: new THREE.Color("#2c4a06"), flatShading: true, side: THREE.DoubleSide });
    const glass = new THREE.MeshStandardMaterial({ color: "#0b1a24", roughness: 0.1, metalness: 0.8, emissive: new THREE.Color(CYAN), emissiveIntensity: 0.08, flatShading: true });
    const edges = new THREE.LineBasicMaterial({ color: "#14171c", transparent: true, opacity: 0.8 });
    const cyan = new THREE.MeshBasicMaterial({ color: CYAN, toneMapped: false, transparent: true, opacity: 0 });
    const blue = new THREE.MeshBasicMaterial({ color: BLUE, toneMapped: false, transparent: true, opacity: 0 });
    const additive = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false } as const;
    const halo = new THREE.MeshBasicMaterial({ color: BLUE, opacity: 0, ...additive });
    const exhaust = new THREE.MeshBasicMaterial({ color: CYAN, opacity: 0, side: THREE.DoubleSide, ...additive });
    const chargeMat = new THREE.MeshBasicMaterial({ color: CYAN, opacity: 0, side: THREE.BackSide, ...additive });
    const waveMat = new THREE.MeshBasicMaterial({ color: LIME, opacity: 0, side: THREE.DoubleSide, ...additive });

    /* the nano build on the armour's own materials (the lights only come on once it is whole) */
    const nano = { uFront: { value: R0 }, uNanoGlow: { value: new THREE.Color(CYAN) }, uHeat: { value: 0 }, uCharge: { value: 0 }, uTime: { value: 0 } };
    const grown: THREE.Material[] = [metal, dark, lime, glass, edges];
    grown.forEach((mat) => {
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, nano);
        sh.vertexShader = NANO_VERT_HEAD + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n  vNanoP = aNano;");
        sh.fragmentShader = (NANO_FRAG_HEAD + sh.fragmentShader)
          .replace(/void main\(\) \{/, (s) => s + NANO_FRAG_CLIP)
          .replace("#include <dithering_fragment>", "#include <dithering_fragment>" + NANO_FRAG_FX);
      };
    });

    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const add = (obj: THREE.Object3D) => root.add(obj);
    /** a mesh with its facet edges drawn (the panel lines) */
    const solid = (g: THREE.BufferGeometry, m: THREE.Material) => {
      const grp = new THREE.Group();
      grp.add(new THREE.Mesh(g, m), new THREE.LineSegments(keep(new THREE.EdgesGeometry(g, 20)), edges));
      return grp;
    };
    /** a line of light through a few points */
    const strip = (pts: number[][], r = 0.028, m: THREE.Material = cyan) =>
      new THREE.Mesh(keep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => V(x, y, z))), low ? 16 : 32, r, 5)), m);
    /** a piece for each side: built for the right (+x), mirrored for the left */
    const sides = (make: () => THREE.Object3D) =>
      [1, -1].forEach((s) => {
        const g = new THREE.Group();
        g.scale.x = s;
        g.add(make());
        add(g);
      });
    const hexG = keep(paint(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 6), GREY_TOP));

    /* ---- the body: faceted gunmetal over the fuselage, a hexagon plate on its back ---- */
    add(
      solid(
        keep(paint(hull([[0, 0.05, -4.7], [0, 0.68, -1.8], [0, 0.78, 1.0], [0, 0.62, 2.6], [0.72, 0.28, -1.5], [-0.72, 0.28, -1.5], [0.98, 0.22, 0.8], [-0.98, 0.22, 0.8], [0.85, 0, 2.5], [-0.85, 0, 2.5], [0.6, -0.38, -1.2], [-0.6, -0.38, -1.2], [0.65, -0.42, 1.9], [-0.65, -0.42, 1.9], [0, -0.55, 0.2], [0, -0.3, -3]]))),
        metal
      )
    );
    const backHex = new THREE.Mesh(hexG, metal);
    backHex.position.set(0, 0.79, 0.9);
    add(backHex);
    /* the canopy behind a V of cyan light */
    add(new THREE.Mesh(keep(hull([[0, 0.7, -2.1], [0.24, 0.64, -1.4], [-0.24, 0.64, -1.4], [0.22, 0.72, -0.3], [-0.22, 0.72, -0.3], [0, 0.84, -0.9]])), glass));
    add(strip([[0.58, 0.6, -0.05], [0.25, 0.66, -1.2], [0, 0.7, -2.05], [-0.25, 0.66, -1.2], [-0.58, 0.6, -0.05]]));

    /* ---- the lime fork: two long blades reaching past the nose to a point, two shorter ones under them ---- */
    sides(() => solid(keep(hull([[0.75, 0.25, 0.6], [0.9, 0.05, 0.8], [0.78, -0.15, 0.4], [0.42, 0.18, -2.8], [0.5, -0.08, -2.6], [0.16, 0.02, -6.3], [0.12, -0.1, -6.1]])), lime));
    sides(() => solid(keep(hull([[0.55, -0.32, 0.4], [0.62, -0.45, 0.6], [0.3, -0.4, -3.6], [0.28, -0.5, -3.4], [0.5, -0.25, 0.2]])), lime));
    /* the nose cannon between them, a cyan ring at its muzzle */
    const cannon = new THREE.Group();
    const barrel = keep(new THREE.CylinderGeometry(0.08, 0.14, 3.2, 10));
    barrel.rotateX(Math.PI / 2);
    const muzzleRing = keep(new THREE.TorusGeometry(0.12, 0.025, 6, 16));
    const bm = new THREE.Mesh(barrel, dark);
    const mr = new THREE.Mesh(muzzleRing, cyan);
    mr.position.z = -1.6;
    cannon.add(bm, mr);
    cannon.position.set(0, -0.2, -5.0);
    add(cannon);

    /* ---- the lime roll-bar arching over the cockpit, with its cross-bar ---- */
    const bar = (pts: number[][], r = 0.1) => new THREE.Mesh(keep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => V(x, y, z))), 32, r, 4)), lime);
    sides(() => bar([[0.38, 0.62, 0], [0.55, 1.3, 0.7], [0.42, 1.85, 1.7], [0.12, 1.75, 2.5]]));
    add(bar([[0.36, 1.86, 1.75], [0, 1.95, 1.85], [-0.36, 1.86, 1.75]]));

    /* ---- the gull wings over the folded foils: level out to an elbow, then bent steeply down ---- */
    // the inner wing: a wedge deep enough to close round the folded foils and their engines
    const innerG = keep(paint(hull([[0.6, 0.32, -0.7], [0.6, -0.27, -0.7], [0.6, 0.32, 2.3], [0.6, -0.27, 2.3], [4.3, 0.22, 0.1], [4.3, -0.18, 0.1], [4.5, 0.2, 1.7], [4.5, -0.16, 1.7]])));
    sides(() => {
      const w = new THREE.Group();
      w.add(solid(innerG, metal));
      w.add(strip([[0.7, 0.2, -0.78], [4.35, 0.13, 0.04]], 0.02)); // the leading edge
      // a lime stripe and hexagon plates on top
      w.add(solid(keep(slab([[1.0, 0.36, -0.35], [2.4, 0.33, -0.05], [2.4, 0.33, 0.22], [1.0, 0.36, -0.06]], 0.025)), lime));
      // and a lime plate along the trailing edge, where the chase camera sees it
      w.add(solid(keep(slab([[1.0, 0.33, 1.65], [3.9, 0.25, 1.5], [4.0, 0.25, 1.78], [1.0, 0.33, 2.05]], 0.025)), lime));
      [1.7, 2.6, 3.5].forEach((x) => {
        const h = new THREE.Mesh(hexG, metal);
        h.position.set(x, 0.33 - (x - 0.6) * 0.022, 1.0);
        w.add(h);
      });
      return w;
    });
    // the comb: teeth under the trailing edge, one by one
    for (let k = 0; k < 8; k++) {
      const x = 0.9 + k * 0.45;
      sides(() => solid(keep(hull([[x, -0.2, 1.9], [x + 0.32, -0.2, 1.95], [x + 0.16, -0.62, 2.2], [x, -0.2, 1.97], [x + 0.32, -0.2, 2.02], [x + 0.16, -0.62, 2.27]])), dark));
    }
    // the outer wing, bent down at the elbow: a lime stripe, a cyan outer edge, a blue light at its tip
    const outerG = keep(paint(slab([[0, 0, -1.0], [0, 0, 1.0], [2.9, 0, -0.2], [3.2, 0, 1.3]], 0.09)));
    const tipLight = keep(new THREE.SphereGeometry(0.12, 10, 8));
    const tipHalo = keep(new THREE.SphereGeometry(0.28, 12, 10));
    sides(() => {
      const g = new THREE.Group();
      g.position.set(4.4, 0.02, 0.9);
      g.rotation.z = -1.15;
      g.add(solid(outerG, metal));
      g.add(solid(keep(slab([[0.3, 0.1, -0.8], [2.7, 0.1, -0.2], [2.8, 0.1, 0.25], [0.3, 0.1, -0.35]], 0.02)), lime));
      g.add(strip([[2.9, 0.06, -0.2], [3.2, 0.06, 1.3]]));
      const l = new THREE.Mesh(tipLight, blue);
      l.position.set(3.0, 0, -0.3);
      const h = new THREE.Mesh(tipHalo, halo);
      h.position.copy(l.position);
      h.renderOrder = 12;
      // a dark blade raking back off its lower edge
      g.add(l, h, solid(keep(slab([[1.5, 0, 0.8], [1.6, 0, 1.2], [3.4, 0, 2.6], [3.55, 0, 2.75]], 0.035)), dark));
      const outer = new THREE.Group();
      outer.add(g);
      return outer;
    });
    // a fin standing up at each elbow, cyan along its leading edge
    sides(() => {
      const f = new THREE.Group();
      f.add(solid(keep(paint(blade([[4.3, 0.2, 0.4], [4.3, 0.2, 1.9], [4.55, 2.3, 2.2], [4.5, 2.1, 2.7]], 0.04))), metal));
      f.add(strip([[4.3, 0.25, 0.4], [4.55, 2.3, 2.2]], 0.022));
      return f;
    });

    /* ---- spikes off the wing roots, the V-tail, dark blades under the stern, the engine block ---- */
    sides(() => {
      const f = new THREE.Group();
      f.add(solid(keep(paint(blade([[1.0, 0.3, -0.4], [1.15, 0.3, 0.15], [2.0, 1.7, 0.9], [2.05, 1.75, 1.0]], 0.03))), metal));
      f.add(strip([[1.0, 0.33, -0.4], [2.0, 1.72, 0.9]], 0.018));
      return f;
    });
    sides(() => {
      const f = new THREE.Group();
      f.add(solid(keep(paint(blade([[0.3, 0.5, 1.4], [0.35, 0.45, 2.6], [1.5, 2.1, 3.3], [1.6, 2.2, 3.6]], 0.045))), metal));
      f.add(strip([[0.32, 0.55, 1.4], [1.52, 2.15, 3.3]], 0.02));
      f.add(bar([[0.4, 0.48, 2.6], [1.62, 2.18, 3.62]], 0.05)); // a lime trailing edge
      return f;
    });
    sides(() => solid(keep(blade([[0.4, -0.4, 0.6], [0.42, -0.42, 1.4], [1.1, -1.7, 2.8], [1.15, -1.75, 3.0]], 0.04)), dark));
    const engine = new THREE.Group();
    engine.add(solid(keep(paint(hull([[0.62, 0.36, 2.2], [-0.62, 0.36, 2.2], [0.62, -0.32, 2.2], [-0.62, -0.32, 2.2], [0.5, 0.3, 3.1], [-0.5, 0.3, 3.1], [0.5, -0.26, 3.1], [-0.5, -0.26, 3.1]]))), metal));
    const engRing = keep(new THREE.TorusGeometry(0.17, 0.035, 6, 20));
    const plume = keep(new THREE.ConeGeometry(0.16, 2.4, 14, 1, true));
    plume.rotateX(-Math.PI / 2);
    plume.translate(0, 0, 1.2);
    const plumes: THREE.Mesh[] = [];
    [0.26, -0.26].forEach((x) => {
      const r = new THREE.Mesh(engRing, cyan);
      r.position.set(x, 0.02, 3.13);
      const p = new THREE.Mesh(plume, exhaust);
      p.position.set(x, 0.02, 3.14);
      p.renderOrder = 12;
      plumes.push(p);
      engine.add(r, p);
    });
    add(engine);

    /* ---- the charge round the ship as its foils fold, and the shockwave at the end ---- */
    const charge = new THREE.Mesh(keep(new THREE.SphereGeometry(3.4, 24, 16)), chargeMat);
    charge.scale.set(1.4, 0.7, 1.6);
    const wave = new THREE.Mesh(keep(new THREE.TorusGeometry(1, 0.06, 6, 64)), waveMat);
    wave.rotation.x = Math.PI / 2;
    root.add(charge, wave);

    /* every grown surface gets its place in the armour's own space (aNano), for the front; a geometry used twice is
       copied first. And the swarm is sampled off them, more particles on the bigger surfaces */
    root.updateMatrixWorld(true);
    const seen = new Set<THREE.BufferGeometry>();
    const surfaces: { mesh: THREE.Mesh; sampler: MeshSurfaceSampler; area: number }[] = [];
    root.traverse((o) => {
      const obj = o as THREE.Mesh;
      if (!obj.geometry || !grown.includes(obj.material as THREE.Material)) return;
      if (seen.has(obj.geometry)) obj.geometry = keep(obj.geometry.clone());
      seen.add(obj.geometry);
      const nanoP = (obj.geometry.getAttribute("position") as THREE.BufferAttribute).clone().applyMatrix4(obj.matrixWorld);
      obj.geometry.setAttribute("aNano", nanoP);
      if (obj.isMesh) {
        const sampler = new MeshSurfaceSampler(obj).build();
        surfaces.push({ mesh: obj, sampler, area: sampler.distribution ? sampler.distribution[sampler.distribution.length - 1] : 0 });
      }
    });
    const n = low ? 5000 : 14000;
    const total = surfaces.reduce((a, s) => a + s.area, 0);
    const to = new Float32Array(n * 3);
    const from = new Float32Array(n * 3);
    const at = new Float32Array(n);
    const size = new Float32Array(n);
    const p = V(0, 0, 0);
    let i = 0;
    surfaces.forEach((s, j) => {
      const count = j === surfaces.length - 1 ? n - i : Math.round((n * s.area) / total);
      for (let c = 0; c < count && i < n; c++, i++) {
        s.sampler.sample(p);
        p.applyMatrix4(s.mesh.matrixWorld);
        to.set([p.x, p.y, p.z], i * 3);
        const dir = V(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
        from.set([p.x + dir.x * (3 + rnd() * 5), p.y + dir.y * (2 + rnd() * 3), p.z + dir.z * (3 + rnd() * 5)], i * 3);
        at[i] = arrival(p.distanceTo(ORIGIN));
        size[i] = 0.5 + rnd() * 0.8;
      }
    });
    const swarmGeo = keep(new THREE.BufferGeometry());
    swarmGeo.setAttribute("position", new THREE.BufferAttribute(to, 3));
    swarmGeo.setAttribute("aFrom", new THREE.BufferAttribute(from, 3));
    swarmGeo.setAttribute("aAt", new THREE.BufferAttribute(at, 1));
    swarmGeo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    const swarmU = { uM: { value: 0 }, uPx: { value: 1 }, uCol: { value: new THREE.Color(CYAN) } };
    const swarmMat = new THREE.ShaderMaterial({ uniforms: swarmU, vertexShader: SWARM_VERT, fragmentShader: SWARM_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const swarm = new THREE.Points(swarmGeo, swarmMat);
    swarm.frustumCulled = false;
    swarm.renderOrder = 13;
    root.add(swarm);
    const sparkU = { uTime: nano.uTime, uHeat: nano.uHeat, uPx: swarmU.uPx };
    const sparkMat = new THREE.ShaderMaterial({ uniforms: sparkU, vertexShader: SPARK_VERT, fragmentShader: SPARK_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const sparks = new THREE.Points(swarmGeo, sparkMat);
    sparks.frustumCulled = false;
    sparks.renderOrder = 13;
    const shieldMat = new THREE.ShaderMaterial({ uniforms: { uTime: nano.uTime, uHeat: nano.uHeat }, vertexShader: SHIELD_VERT, fragmentShader: SHIELD_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const shield = new THREE.Mesh(keep(new THREE.SphereGeometry(1, 32, 20)), shieldMat);
    shield.position.set(0, 0.2, -1.4);
    shield.scale.set(7.2, 3.4, 6.6);
    shield.renderOrder = 12;
    root.add(sparks, shield);
    const cyanBase = cyan.color.clone();

    return { root, plumes, cyan, blue, halo, exhaust, charge, chargeMat, wave, waveMat, nano, swarm, swarmU, sparks, shield, cyanBase, geos, mats: [metal, dark, lime, glass, edges, cyan, blue, halo, exhaust, chargeMat, waveMat, swarmMat, sparkMat, shieldMat] };
  }, [low]);

  useEffect(
    () => () => {
      built.geos.forEach((g) => g.dispose());
      built.mats.forEach((m) => m.dispose());
    },
    [built]
  );

  useFrame(({ clock, viewport }) => {
    const m = morph.current;
    const t = clock.elapsedTime;
    built.root.visible = m > 0.001;
    if (!built.root.visible) return;

    /* the nano build: the front grows out over the armour, the swarm streams in to meet it */
    built.nano.uFront.value = front(m);
    built.swarmU.uM.value = m;
    built.swarmU.uPx.value = viewport.dpr;
    built.swarm.visible = m < 1;

    /* round the Sun: hot, then charged */
    const heat = fx?.current.heat ?? 0;
    const charged = fx?.current.charge ?? 0;
    built.nano.uTime.value = t;
    built.nano.uHeat.value = heat;
    built.nano.uCharge.value = charged;
    built.sparks.visible = built.shield.visible = heat > 0.01;
    built.cyan.color.copy(built.cyanBase).multiplyScalar(1 + charged * 0.8);

    /* the lights come on last: cyan seams, blue wingtips (pulsing), the engines' plumes (flickering) */
    const lit = smooth((m - 0.8) / 0.12);
    built.cyan.opacity = lit;
    built.blue.opacity = lit;
    built.halo.opacity = lit * (0.22 + 0.12 * Math.sin(t * 3));
    built.exhaust.opacity = lit * 0.55;
    built.plumes.forEach((p, i) => (p.scale.z = 0.85 + 0.15 * Math.sin(t * 31 + i * 2) + 0.08 * Math.sin(t * 77 + i)));

    /* the charge: a cyan glow round the ship as it begins; the shockwave as it completes */
    const ch = smooth(m / 0.08) * (1 - smooth((m - 0.14) / 0.2));
    built.charge.visible = ch > 0.002;
    built.chargeMat.opacity = ch * (0.3 + 0.2 * Math.sin(t * 30));
    const w = clamp01((m - 0.9) / 0.1);
    built.wave.visible = w > 0 && w < 1;
    built.wave.scale.setScalar(1 + w * 9);
    built.waveMat.opacity = (1 - w) * 0.8;
  });

  return <primitive object={built.root} scale={scale} />;
}
