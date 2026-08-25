"use client";

import { useEffect, useRef, useState } from "react";

/* ============================================================================
   THE GATE — the CEG main building, hand-drawn line-by-line in pure JS.
   Phase 1 "drawing"  : the facade draws itself as one continuous stroke flow
   Phase 2 "ready"    : ENTER THE WORLD button appears
   Phase 3 "entering" : the whole drawing floods with theme colour, then the
                        site is revealed.
   No images. Every line is coordinates → canvas.
   ========================================================================== */

type Pt = { x: number; y: number };
type RGB = [number, number, number];
type Path = {
  pts: Pt[];
  theme: RGB;
  w: number;
  glow: number;
  t0: number;
  t1: number;
  len: number;
};

const WHITE: RGB = [255, 255, 255];
const CYAN: RGB = [84, 217, 232];
const MAG: RGB = [215, 124, 203];
const ORG: RGB = [240, 163, 91];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (x: number) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
const easeInOut = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const mix = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

/* ---- geometry helpers (1000-wide virtual space, ground at y=560) -------- */
function line(...xy: number[]): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < xy.length; i += 2) pts.push({ x: xy[i], y: xy[i + 1] });
  return pts;
}
const rect = (x: number, y: number, w: number, h: number) =>
  line(x, y, x + w, y, x + w, y + h, x, y + h, x, y);
/** top-half arch, left → right */
function arch(cx: number, cy: number, r: number, n = 40): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI - (Math.PI * i) / n;
    pts.push({ x: cx + Math.cos(a) * r, y: cy - Math.sin(a) * r });
  }
  return pts;
}
/** full circle, one continuous stroke */
function ring(cx: number, cy: number, r: number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= 72; i++) {
    const a = Math.PI - (2 * Math.PI * i) / 72;
    pts.push({ x: cx + Math.cos(a) * r, y: cy - Math.sin(a) * r });
  }
  return pts;
}
/** balusters as one continuous zigzag stroke */
function balZig(x0: number, x1: number, y0: number, y1: number, step: number): Pt[] {
  const pts: Pt[] = [];
  for (let x = x0; x <= x1; x += step) {
    pts.push({ x, y: y0 }, { x, y: y1 }, { x: x + step, y: y1 });
  }
  return pts;
}
const mirror = (pts: Pt[]): Pt[] => pts.map((p) => ({ x: 1000 - p.x, y: p.y }));

/* ---- the CEG main building, stroke by stroke ---------------------------- */
function buildPaths(): Path[] {
  const paths: Path[] = [];
  const add = (pts: Pt[], theme: RGB = CYAN, w = 1.5, glow = 6) => {
    let len = 0;
    for (let i = 1; i < pts.length; i++)
      len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (len < 1) return;
    paths.push({ pts, theme, w, glow, t0: 0, t1: 1, len });
  };

  /* ground + plinth */
  add(line(100, 560, 900, 560), CYAN, 1.8, 8);
  add(line(118, 540, 882, 540), CYAN, 1.4, 5);

  /* ---------------- one side wing pair (mirrored for the other) ---------- */
  function sideWings() {
    /* ---- outer wing ---- */
    add(line(128, 332, 298, 332));            // cornice top
    add(line(128, 346, 298, 346));            // cornice band
    add(line(128, 332, 128, 540));            // outer edge
    add(line(298, 332, 298, 540));            // inner edge
    add(line(146, 346, 146, 540));            // pilaster
    add(line(162, 346, 162, 540));
    add(line(146, 346, 162, 346));
    /* twin arcade arches with springs, drawn in one stroke each */
    add([{ x: 180, y: 470 }, { x: 180, y: 414 }, ...arch(210, 414, 30), { x: 240, y: 414 }, { x: 240, y: 470 }]);
    add([{ x: 240, y: 470 }, { x: 240, y: 414 }, ...arch(270, 414, 30), { x: 300, y: 414 }, { x: 300, y: 470 }]);
    /* balustrade under the arcade */
    add(line(178, 470, 302, 470), MAG, 1.2, 5);
    add(line(178, 486, 302, 486), MAG, 1.2, 5);
    add(balZig(186, 294, 470, 486, 12), MAG, 1, 4);
    /* two windows below */
    add(rect(196, 506, 30, 38));
    add(line(211, 506, 211, 544));
    add(line(196, 525, 226, 525));
    add(rect(254, 506, 30, 38));
    add(line(269, 506, 269, 544));
    add(line(254, 525, 284, 525));

    /* ---- mid wing ---- */
    add(line(300, 298, 415, 298));            // cornice top
    add(line(300, 312, 415, 312));            // cornice band
    add(line(415, 298, 415, 540));            // inner edge
    add(ring(357, 340, 15), MAG, 1.3, 6);     // quatrefoil
    add(ring(357, 340, 8), MAG, 1, 5);
    add(rect(328, 362, 58, 64));              // framed window
    add(line(357, 362, 357, 426));
    add(line(328, 394, 386, 394));
    add(line(324, 426, 390, 426));
    add(line(320, 436, 394, 436), MAG, 1.2, 5);   // balcony
    add(line(320, 450, 394, 450), MAG, 1.2, 5);
    add(balZig(324, 390, 436, 450, 10), MAG, 1, 4);
    add(rect(330, 470, 54, 60));              // lower window
    add(line(357, 470, 357, 530));
    add(line(330, 500, 384, 500));
    /* quoin ticks */
    for (const y of [336, 376, 416, 456, 496]) add(line(300, y, 311, y), CYAN, 1, 3);
  }
  sideWings();            // left (drawn first)
  const rightStart = paths.length;
  sideWings();
  /* mirror the just-added right half */
  for (let i = rightStart; i < paths.length; i++) {
    paths[i].pts = mirror(paths[i].pts);
  }

  /* ---------------- central block ----------------------------------------- */
  add(line(398, 266, 602, 266), CYAN, 1.7, 7);  // main cornice
  add(line(398, 280, 602, 280), CYAN, 1.4, 6);
  add(line(415, 280, 415, 540));                // pilasters
  add(line(585, 280, 585, 540));
  /* triple arcade */
  add([{ x: 468, y: 388 }, { x: 468, y: 342 }, ...arch(500, 342, 32), { x: 532, y: 342 }, { x: 532, y: 388 }]);
  add([{ x: 432, y: 388 }, { x: 432, y: 346 }, ...arch(450, 346, 18), { x: 468, y: 346 }, { x: 468, y: 388 }]);
  add([{ x: 568, y: 388 }, { x: 568, y: 346 }, ...arch(550, 346, 18), { x: 532, y: 346 }, { x: 532, y: 388 }]);
  add(line(440, 388, 560, 388));
  /* balcony + lantern */
  add(line(428, 398, 572, 398), MAG, 1.2, 5);
  add(line(428, 422, 572, 422), MAG, 1.2, 5);
  add(balZig(432, 568, 398, 422, 10), MAG, 1, 4);
  add(ring(500, 380, 7), ORG, 1.3, 8);          // lantern
  add(line(500, 373, 500, 362), ORG, 1.2, 8);
  add(line(494, 387, 506, 387), ORG, 1.2, 8);
  /* grand entrance arch */
  add([{ x: 434, y: 540 }, { x: 434, y: 482 }, ...arch(500, 482, 66), { x: 566, y: 482 }, { x: 566, y: 540 }], CYAN, 1.8, 8);
  add(arch(500, 482, 50), CYAN, 1.4, 6);
  for (let i = 1; i < 10; i++) {                // voussoir ticks
    const a = (Math.PI * i) / 10;
    add(
      line(
        500 + Math.cos(a) * 52, 482 - Math.sin(a) * 52,
        500 + Math.cos(a) * 64, 482 - Math.sin(a) * 64
      ),
      ORG, 1.2, 5
    );
  }
  add(rect(489, 410, 22, 24), ORG, 1.4, 7);     // keystone
  /* doors + grill */
  add(rect(462, 482, 76, 58), ORG, 1.5, 7);
  add(line(500, 482, 500, 540), ORG, 1.2, 5);
  add(line(462, 511, 538, 511), ORG, 1, 4);
  add(line(466, 486, 534, 536), MAG, 0.9, 4);
  add(line(534, 486, 466, 536), MAG, 0.9, 4);
  /* steps + sentinel pedestals */
  add(line(452, 548, 548, 548));
  add(line(442, 556, 558, 556));
  add(rect(424, 498, 20, 42));
  add(ring(434, 490, 8), MAG, 1.2, 6);
  add(rect(556, 498, 20, 42));
  add(ring(566, 490, 8), MAG, 1.2, 6);

  /* ---------------- cupola, clock, dome ----------------------------------- */
  add(line(386, 244, 614, 244), CYAN, 1.6, 7);  // cupola cornice
  add(line(386, 258, 614, 258), CYAN, 1.3, 6);
  add(line(386, 244, 386, 258));
  add(line(614, 244, 614, 258));
  add(line(424, 258, 424, 162));                // drum
  add(line(576, 258, 576, 162));
  add(line(444, 172, 444, 248));                // side panels
  add(line(556, 172, 556, 248));
  add(line(404, 150, 596, 150), CYAN, 1.5, 7);  // crown cornice
  add(line(412, 162, 588, 162), CYAN, 1.2, 6);
  add(ring(500, 205, 30), CYAN, 2, 12);         // clock
  add(ring(500, 205, 23), CYAN, 1.2, 8);
  add(line(500, 205, 491, 193), ORG, 2, 8);     // hour hand
  add(line(500, 205, 511, 190), ORG, 1.6, 8);   // minute hand
  add(arch(500, 150, 88, 64), CYAN, 2, 12);     // the dome
  add(line(500, 62, 500, 30), ORG, 1.6, 9);     // finial
  add(ring(500, 25, 5), ORG, 1.4, 10);

  return paths;
}

/* ---- sequential scheduling: one continuous line ------------------------- */
function schedule(paths: Path[], start = 0.04, end = 0.9, overlap = 0.35) {
  const weights = paths.map((p) => Math.pow(p.len, 1.1));
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  paths.forEach((p, i) => {
    const span = (weights[i] / total) * (end - start);
    p.t0 = start + acc;
    p.t1 = start + acc + span * (1 + overlap);
    acc += span;
  });
}

type Phase = "drawing" | "ready" | "entering";

/* ---- pencil-scratch sound, synthesized with Web Audio (no assets) ------- */
const audioRef: { current: { ctx: AudioContext; noise: AudioBuffer } | null } = {
  current: null,
};

function ensureAudio() {
  if (audioRef.current) {
    if (audioRef.current.ctx.state === "suspended") void audioRef.current.ctx.resume();
    return audioRef.current;
  }
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    audioRef.current = { ctx, noise };
    return audioRef.current;
  } catch {
    return null;
  }
}

/** rising whoosh — noise sweep 180Hz→5kHz + tonal rise, for the colour flood */
function whoosh() {
  const a = ensureAudio();
  if (!a || a.ctx.state !== "running") return;
  const { ctx, noise } = a;
  const t = ctx.currentTime;
  const dur = 1.4;

  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(180, t);
  bp.frequency.exponentialRampToValueAtTime(5200, t + dur * 0.85);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.085, t + dur * 0.55);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp);
  bp.connect(g);
  g.connect(ctx.destination);
  src.start(t);
  src.stop(t + dur + 0.1);

  /* tonal rise underneath — matches the page zoom-out */
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(440, t + dur * 0.9);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.045, t + dur * 0.6);
  og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(og);
  og.connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.1);
}

/** deep ambient drone — detuned low sines with a slow breathing LFO */
const droneRef: {
  current: { oscs: OscillatorNode[]; gain: GainNode; lfo: OscillatorNode } | null;
} = { current: null };

function startDrone() {
  const a = ensureAudio();
  if (!a || droneRef.current || a.ctx.state !== "running") return;
  const { ctx } = a;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 220;
  const oscs: OscillatorNode[] = [];
  const specs: [number, OscillatorType, number][] = [
    [55, "sine", 1], // A0 — the foundation
    [55.7, "sine", 0.8], // detuned twin — slow beating
    [110.3, "triangle", 0.22], // faint octave shimmer
  ];
  for (const [f, type, amp] of specs) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = amp;
    o.connect(g);
    g.connect(lp);
    o.start();
    oscs.push(o);
  }
  /* breathing LFO on the drone volume */
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.011;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  lfo.start();
  lp.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.032, ctx.currentTime + 2.5);
  droneRef.current = { oscs, gain, lfo };
}

function stopDrone(fade = 1.6) {
  const d = droneRef.current;
  const a = audioRef.current;
  if (!d || !a) return;
  droneRef.current = null;
  const t = a.ctx.currentTime;
  d.gain.gain.cancelScheduledValues(t);
  d.gain.gain.setValueAtTime(d.gain.gain.value, t);
  d.gain.gain.linearRampToValueAtTime(0.0001, t + fade);
  setTimeout(() => {
    d.oscs.forEach((o) => o.stop());
    d.lfo.stop();
  }, fade * 1000 + 100);
}

/** one short filtered-noise burst — sounds like a pencil stroke */
function scratch(dur = 0.15, vol = 1) {
  const a = ensureAudio();
  if (!a || a.ctx.state !== "running") return;
  const { ctx, noise } = a;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.7 + Math.random() * 0.6;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1400 + Math.random() * 1200;
  bp.Q.value = 0.8;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  const peak = 0.045 * vol;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp);
  bp.connect(g);
  g.connect(ctx.destination);
  src.start(t, Math.random() * 0.5, dur + 0.05);
  src.stop(t + dur + 0.06);
}

export default function Preloader() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("drawing");
  const cpRef = useRef(0); // colour-flood progress
  const [phase, setPhase] = useState<Phase>("drawing");
  const [gone, setGone] = useState(false);
  const [btnTop, setBtnTop] = useState<number | null>(null);

  const enter = () => {
    if (phaseRef.current !== "ready") return;
    phaseRef.current = "entering";
    setPhase("entering");
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    /* offscreen buffer — the reflection is rendered here once, then blitted
       in slices with a ripple offset */
    const off = document.createElement("canvas");
    const octx = off.getContext("2d")!;
    let raf = 0;
    let W = 0;
    let H = 0;
    let dpr = 1;

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    interface Star { x: number; y: number; r: number; tw: number }
    interface Petal { x: number; y: number; vx: number; vy: number; s: number; rot: number; vr: number; o: number }
    let stars: Star[] = [];
    const petals: Petal[] = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      off.width = canvas.width;
      off.height = canvas.height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: 110 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: rnd(0.4, 1.6),
        tw: Math.random() * Math.PI * 2,
      }));
    }
    resize();
    window.addEventListener("resize", resize);

    const paths = buildPaths();
    schedule(paths);
    const start = performance.now();
    const MIN_MS = 10000;
    let loaded = document.readyState === "complete";
    const onLoad = () => (loaded = true);
    window.addEventListener("load", onLoad);

    let exiting = false;
    let lastT = start;
    let doneStrokes = 0;

    /* audio unlocks on the first user gesture (browser autoplay policy) */
    const unlock = () => {
      ensureAudio();
      if (phaseRef.current !== "entering") startDrone();
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    function drawPartial(g: CanvasRenderingContext2D, pts: Pt[], frac: number) {
      if (frac <= 0 || pts.length < 2) return;
      let total = 0;
      const segs: number[] = [];
      for (let i = 1; i < pts.length; i++) {
        const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        segs.push(l);
        total += l;
      }
      let remain = total * frac;
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length && remain > 0; i++) {
        if (segs[i - 1] <= remain) {
          g.lineTo(pts[i].x, pts[i].y);
          remain -= segs[i - 1];
        } else {
          const f = remain / segs[i - 1];
          g.lineTo(
            pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f,
            pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f
          );
          remain = 0;
        }
      }
      g.stroke();
    }

    function beginExit() {
      exiting = true;
      (window as Window & { __csauEntered?: boolean }).__csauEntered = true;
      window.dispatchEvent(new CustomEvent("csau:entered"));
      document.documentElement.classList.add("csau-entered");
      const el = wrapRef.current!;
      el.style.transition = "opacity 1000ms ease, visibility 0s linear 1000ms";
      el.style.opacity = "0";
      el.style.visibility = "hidden";
      document.body.style.overflow = "";
      setTimeout(() => setGone(true), 1050);
    }

    function frame(now: number) {
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      const ph = phaseRef.current;

      /* colour flood while entering */
      if (ph === "entering") {
        cpRef.current = Math.min(1, cpRef.current + dt / 1.4);
        if (cpRef.current >= 1 && !exiting) beginExit();
      }

      const t = (now - start) / MIN_MS;
      const cap = loaded ? 1 : 0.94;
      const P = ph === "drawing" ? clamp(Math.min(easeInOut(clamp(t)), cap)) : 1;
      const cp = cpRef.current;

      ctx.clearRect(0, 0, W, H);

      /* stars */
      for (const s of stars) {
        const tw = 0.3 + 0.3 * Math.sin(now / 700 + s.tw);
        ctx.globalAlpha = tw * clamp(P * 4);
        ctx.fillStyle = "#F4F0E8";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      /* artwork transform — larger scale, mild base crop accepted:
         full width with a 20px gap each side, height budget raised to 75%
         of the viewport so the building reads bigger; on very wide screens
         the base/steps crop below the fold. */
      const S = Math.min((W - 40) / 800, (H * 0.75) / 640);
      const topY = H * 0.03;
      ctx.save();
      ctx.translate(W / 2 - 500 * S, topY - 5 * S);
      ctx.scale(S, S);

      /* reflection in the wet ground — rendered once to an offscreen buffer,
         then blitted in horizontal slices with a gentle sine ripple that
         grows with depth, fading out into the background */
      const rAlpha = smooth((P - 0.1) / 0.8) * (0.15 + cp * 0.08);
      if (rAlpha > 0.005) {
        octx.setTransform(dpr, 0, 0, dpr, 0, 0);
        octx.clearRect(0, 0, W, H);
        octx.save();
        octx.translate(W / 2 - 500 * S, topY - 5 * S);
        octx.scale(S, S);
        octx.translate(0, 560 * 1.86);
        octx.scale(1, -0.86);
        for (const p of paths) {
          const frac = smooth((P - p.t0) / (p.t1 - p.t0));
          if (frac <= 0) continue;
          octx.strokeStyle = `rgba(${WHITE[0]},${WHITE[1]},${WHITE[2]},0.9)`;
          octx.lineWidth = p.w * (1 + cp * 0.4);
          drawPartial(octx, p.pts, frac);
        }
        octx.restore();

        const groundY = topY + 555 * S;
        const reflH = Math.min(H - groundY, 470 * S);
        if (reflH > 4) {
          const slices = 22;
          const sh = Math.ceil(reflH / slices);
          for (let i = 0; i < slices; i++) {
            const sy = groundY + i * sh;
            const amp = 1.2 + (i / slices) * 6; // deeper = wider sway
            const dx = Math.sin(now / 1100 + i * 0.55) * amp;
            ctx.globalAlpha = rAlpha;
            ctx.drawImage(
              off,
              0, sy * dpr, W * dpr, (sh + 1) * dpr,
              dx - 8, sy, W + 16, sh + 1
            );
            ctx.globalAlpha = 1;
          }
          /* depth fade — reflection melts into the background */
          const fade = ctx.createLinearGradient(0, groundY, 0, groundY + reflH);
          fade.addColorStop(0, "rgba(9,7,20,0)");
          fade.addColorStop(1, "rgba(9,7,20,1)");
          ctx.fillStyle = fade;
          ctx.fillRect(0, groundY, W, reflH);
        }
      }
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      const breathe = ph === "ready" ? 1 + 0.2 * Math.sin(now / 450) : 1;
      for (const p of paths) {
        const frac = smooth((P - p.t0) / (p.t1 - p.t0));
        if (frac <= 0) continue;
        /* clean white blueprint while drawing; glow + theme colour flood on ENTER */
        const col = mix(WHITE, p.theme, cp);
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},0.92)`;
        ctx.shadowColor = `rgba(${col[0]},${col[1]},${col[2]},0.85)`;
        ctx.lineWidth = p.w * (1 + cp * 0.4);
        ctx.shadowBlur = cp > 0 ? (p.glow + 4) * frac * breathe * (1 + cp * 2) * cp : 0;
        drawPartial(ctx, p.pts, frac);
      }
      ctx.shadowBlur = 0;

      ctx.restore();

      /* wordmark — screen space, top-left, survives any crop */
      const wf = smooth((P - 0.88) / 0.12);
      if (wf > 0) {
        ctx.textAlign = "left";
        ctx.fillStyle = `rgba(${WHITE[0]},${WHITE[1]},${WHITE[2]},${0.95 * wf})`;
        ctx.shadowColor = `rgba(${CYAN[0]},${CYAN[1]},${CYAN[2]},${0.7 * wf})`;
        ctx.shadowBlur = 18 * wf * cp;
        ctx.font = `700 ${30}px var(--font-space-grotesk), sans-serif`;
        ctx.fillText("CSAU", 28, 48);
        ctx.shadowBlur = 0;
        ctx.font = `400 ${10}px var(--font-geist-mono), monospace`;
        ctx.fillStyle = `rgba(${WHITE[0]},${WHITE[1]},${WHITE[2]},${0.5 * wf})`;
        const sub = "THE DIGITAL REALM";
        for (let i = 0; i < sub.length; i++) {
          const cf = smooth((wf - i / sub.length) * sub.length * 0.6);
          if (cf <= 0) continue;
          ctx.globalAlpha = cf;
          ctx.fillText(sub[i], 30 + i * 9, 68);
        }
        ctx.globalAlpha = 1;
      }

      /* sakura petals */
      if (P > 0.5 && petals.length < 26 && Math.random() < 0.3) {
        petals.push({
          x: rnd(W * 0.1, W),
          y: -20,
          vx: rnd(-30, -8),
          vy: rnd(35, 70),
          s: rnd(3, 6),
          rot: Math.random() * Math.PI * 2,
          vr: rnd(-2, 2),
          o: rnd(0.35, 0.8),
        });
      }
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.y > H + 20 || p.x < -20) {
          petals.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = `rgba(${MAG[0]},${MAG[1]},${MAG[2]},${p.o})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      /* pencil scratch each time a new stroke begins */
      if (ph === "drawing") {
        let completed = 0;
        for (const p of paths) if (P >= p.t1) completed++;
        if (completed > doneStrokes) {
          doneStrokes = completed;
          scratch(0.09 + Math.random() * 0.09, 0.5);
        }
      }

      /* phase transition: drawing complete */
      if (ph === "drawing" && P >= 1) {
        phaseRef.current = "ready";
        /* park the ENTER button just below the building's ground line
           (screen y of virtual y=560), clamped to stay on screen */
        const groundY = topY + 555 * S;
        setBtnTop(Math.min(Math.max(groundY + 14, H * 0.55), H - 110));
        setPhase("ready");
      }

      /* DOM readouts */
      if (pctRef.current) pctRef.current.textContent = String(Math.floor(P * 100)).padStart(3, "0");
      if (barRef.current) barRef.current.style.transform = `scaleX(${P})`;

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      stopDrone(0.3);
      document.body.style.overflow = "";
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={wrapRef}
      id="preloader"
      className="fixed inset-0 z-[100] bg-[#090714] flex items-center justify-center"
      aria-label="Loading"
      role="status"
    >
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden />

      {/* progress rail — drawing phase only */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 transition-opacity duration-500"
        style={{ opacity: phase === "drawing" ? 1 : 0 }}
      >
        <div className="w-64 h-px bg-white/10 overflow-hidden rounded-full">
          <div
            ref={barRef}
            className="h-full w-full origin-left bg-cyan"
            style={{ transform: "scaleX(0)", boxShadow: "0 0 12px rgba(84,217,232,0.9)" }}
          />
        </div>
        <span
          ref={pctRef}
          className="text-xs tracking-[0.4em] text-cyan/80 font-[family-name:var(--font-geist-mono)] tabular-nums"
        >
          000
        </span>
      </div>

      {/* ENTER — appears once the drawing completes, just below the building */}
      <div
        className="absolute left-1/2 flex flex-col items-center gap-4 transition-all duration-700"
        style={{
          top: btnTop ?? "72%",
          opacity: phase === "ready" ? 1 : 0,
          transform: `translateX(-50%) translateY(${phase === "ready" ? 0 : 14}px)`,
          pointerEvents: phase === "ready" ? "auto" : "none",
        }}
      >
        <span className="text-[10px] tracking-[0.5em] uppercase text-foreground/40 font-[family-name:var(--font-geist-mono)]">
          The gate is drawn
        </span>
        <button
          onClick={() => {
            whoosh();
            stopDrone(1.8);
            enter();
          }}
          onMouseEnter={() => scratch(0.2, 1.1)}
          className="px-10 py-4 border border-cyan rounded-lg text-cyan font-medium tracking-wide hover:bg-cyan/10 transition-all duration-300 animate-pulse-cyan cursor-pointer"
        >
          ENTER THE WORLD →
        </button>
      </div>
    </div>
  );
}
