/* ============================================================================
   CSAU SOUND ENGINE — all audio is synthesized with the Web Audio API.
   No audio files are downloaded. Ambience is strictly opt-in: the user's
   choice is persisted in localStorage under "csau-ambience".
   
   Extended with per-section ambient soundscapes:
     - Gateway:  Deep rumble + digital pulse
     - Core:     CPU hum + electronic oscillation
     - Grounds:  Energy buzz + tension drone
     - Vault:    Wind draft + crystalline tones
     - Command:  Console hum + data stream
     - Portal:   Swirling energy + resonant sweep
   ============================================================================
 */

export interface AudioEngine {
  ctx: AudioContext;
  noise: AudioBuffer;
}

const AMBIENCE_KEY = "csau-ambience";

const engineRef: { current: AudioEngine | null } = { current: null };

/** Lazily create (or resume) the shared AudioContext + noise buffer. */
export function getAudio(): AudioEngine | null {
  if (engineRef.current) {
    if (engineRef.current.ctx.state === "suspended") void engineRef.current.ctx.resume();
    return engineRef.current;
  }
  try {
    const AC =
      typeof window === "undefined"
        ? undefined
        : window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    engineRef.current = { ctx, noise };
    return engineRef.current;
  } catch {
    return null;
  }
}

/** Read the persisted ambience preference (default OFF — never force audio). */
export function isAmbienceOn(): boolean {
  try {
    return window.localStorage.getItem(AMBIENCE_KEY) === "on";
  } catch {
    return false;
  }
}

export function setAmbienceOn(on: boolean): void {
  try {
    window.localStorage.setItem(AMBIENCE_KEY, on ? "on" : "off");
  } catch {
    /* storage unavailable — preference simply won't persist */
  }
}

/* ---- ambient drone ------------------------------------------------------- */

interface Drone {
  oscs: OscillatorNode[];
  gain: GainNode;
  lfo: OscillatorNode;
}

const droneRef: { current: Drone | null } = { current: null };

/** Deep detuned low sines with a slow breathing LFO. */
export function startDrone(): void {
  const a = getAudio();
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

export function stopDrone(fade = 1.6): void {
  const d = droneRef.current;
  const a = engineRef.current;
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

/* ============================================================================
   SECTION AMBIENT SOUNDSCAPES
   
   Each section gets a unique procedural soundscape. Only one section ambient
   plays at a time. Crossfading is handled externally by the AmbientSound
   component — these functions just start/stop.
   ========================================================================== */

type SectionId = "gateway" | "core" | "grounds" | "vault" | "command" | "portal";

interface SectionAmbient {
  nodes: AudioNode[];
  gain: GainNode;
}

const activeRef: { current: SectionAmbient | null } = { current: null };

function cleanupActive(fade: number) {
  const a = engineRef.current;
  const prev = activeRef.current;
  if (!prev || !a) return;
  activeRef.current = null;
  const t = a.ctx.currentTime;
  prev.gain.gain.cancelScheduledValues(t);
  prev.gain.gain.setValueAtTime(prev.gain.gain.value, t);
  prev.gain.gain.linearRampToValueAtTime(0.0001, t + fade);
  setTimeout(() => {
    prev.nodes.forEach((n) => {
      try { if ("stop" in n) (n as OscillatorNode).stop(); } catch {}
      try { n.disconnect(); } catch {}
    });
  }, fade * 1000 + 100);
}

function connectAll(nodes: AudioNode[], dest: AudioNode) {
  for (const n of nodes) n.connect(dest);
}

/** Crossfade to a new section ambient. Stops whatever was playing. */
export function crossfadeTo(id: SectionId): void {
  const a = getAudio();
  if (!a || a.ctx.state !== "running") return;
  const { ctx } = a;
  cleanupActive(1.8);

  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);

  const nodes: AudioNode[] = [];

  switch (id) {
    case "gateway":
      buildGateway(ctx, nodes, gain);
      break;
    case "core":
      buildCore(ctx, nodes, gain);
      break;
    case "grounds":
      buildGrounds(ctx, nodes, gain);
      break;
    case "vault":
      buildVault(a, nodes, gain);
      break;
    case "command":
      buildCommand(ctx, nodes, gain);
      break;
    case "portal":
      buildPortal(ctx, nodes, gain);
      break;
  }

  activeRef.current = { nodes, gain };
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 2);
}

/** Fade out all section ambients (e.g. when ambience is toggled off). */
export function stopSectionAmbient(fade = 1.5): void {
  const a = engineRef.current;
  const prev = activeRef.current;
  if (!prev || !a) return;
  activeRef.current = null;
  const t = a.ctx.currentTime;
  prev.gain.gain.cancelScheduledValues(t);
  prev.gain.gain.setValueAtTime(prev.gain.gain.value, t);
  prev.gain.gain.linearRampToValueAtTime(0.0001, t + fade);
  setTimeout(() => {
    prev.nodes.forEach((n) => {
      try { if ("stop" in n) (n as OscillatorNode).stop(); } catch {}
      try { n.disconnect(); } catch {}
    });
  }, fade * 1000 + 100);
}

/* ---- SECTION BUILDERS --------------------------------------------------- */

/**
 * GATEWAY — Deep rumble + digital pulse
 * Low sub-bass drone with a slow rhythmic pulse, like a massive machine idling.
 */
function buildGateway(ctx: AudioContext, nodes: AudioNode[], dest: AudioNode) {
  // Sub-bass rumble
  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.value = 36;
  const subGain = ctx.createGain();
  subGain.gain.value = 0.6;
  sub.connect(subGain);
  subGain.connect(dest);
  sub.start();
  nodes.push(sub, subGain);

  // Detuned twin for slow beating
  const sub2 = ctx.createOscillator();
  sub2.type = "sine";
  sub2.frequency.value = 36.4;
  const sub2Gain = ctx.createGain();
  sub2Gain.gain.value = 0.5;
  sub2.connect(sub2Gain);
  sub2Gain.connect(dest);
  sub2.start();
  nodes.push(sub2, sub2Gain);

  // Slow rhythmic pulse
  const pulse = ctx.createOscillator();
  pulse.type = "sine";
  pulse.frequency.value = 0.15; // very slow LFO
  const pulseGain = ctx.createGain();
  pulseGain.gain.value = 0.02;
  pulse.connect(pulseGain);
  pulseGain.connect(dest);
  pulse.start();
  nodes.push(pulse, pulseGain);

  // Faint high shimmer
  const shimmer = ctx.createOscillator();
  shimmer.type = "sine";
  shimmer.frequency.value = 440;
  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0.008;
  const shimmerLP = ctx.createBiquadFilter();
  shimmerLP.type = "lowpass";
  shimmerLP.frequency.value = 600;
  shimmer.connect(shimmerGain);
  shimmerGain.connect(shimmerLP);
  shimmerLP.connect(dest);
  shimmer.start();
  nodes.push(shimmer, shimmerGain, shimmerLP);
}

/**
 * CORE — CPU hum + electronic oscillation
 * Mid-frequency hum with slow filter sweep, like a processor under load.
 */
function buildCore(ctx: AudioContext, nodes: AudioNode[], dest: AudioNode) {
  // Main CPU hum
  const hum = ctx.createOscillator();
  hum.type = "sawtooth";
  hum.frequency.value = 110;
  const humLP = ctx.createBiquadFilter();
  humLP.type = "lowpass";
  humLP.frequency.value = 300;
  humLP.Q.value = 2;
  const humGain = ctx.createGain();
  humGain.gain.value = 0.12;
  hum.connect(humLP);
  humLP.connect(humGain);
  humGain.connect(dest);
  hum.start();
  nodes.push(hum, humLP, humGain);

  // Slow filter sweep LFO
  const sweep = ctx.createOscillator();
  sweep.type = "sine";
  sweep.frequency.value = 0.06;
  const sweepGain = ctx.createGain();
  sweepGain.gain.value = 150;
  sweep.connect(sweepGain);
  sweepGain.connect(humLP.frequency);
  sweep.start();
  nodes.push(sweep, sweepGain);

  // Electronic pulse
  const pulse = ctx.createOscillator();
  pulse.type = "square";
  pulse.frequency.value = 220;
  const pulseLP = ctx.createBiquadFilter();
  pulseLP.type = "lowpass";
  pulseLP.frequency.value = 400;
  const pulseGain = ctx.createGain();
  pulseGain.gain.value = 0.025;
  pulse.connect(pulseLP);
  pulseLP.connect(pulseGain);
  pulseGain.connect(dest);
  pulse.start();
  nodes.push(pulse, pulseLP, pulseGain);

  // Sub foundation
  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.value = 55;
  const subGain = ctx.createGain();
  subGain.gain.value = 0.15;
  sub.connect(subGain);
  subGain.connect(dest);
  sub.start();
  nodes.push(sub, subGain);
}

/**
 * TRAINING GROUNDS — Energy buzz + tension drone
 * Higher frequency with slight dissonance, like a combat arena humming with energy.
 */
function buildGrounds(ctx: AudioContext, nodes: AudioNode[], dest: AudioNode) {
  // Tension drone (minor interval)
  const drone1 = ctx.createOscillator();
  drone1.type = "sawtooth";
  drone1.frequency.value = 73.42; // D2
  const drone1LP = ctx.createBiquadFilter();
  drone1LP.type = "lowpass";
  drone1LP.frequency.value = 200;
  const drone1Gain = ctx.createGain();
  drone1Gain.gain.value = 0.08;
  drone1.connect(drone1LP);
  drone1LP.connect(drone1Gain);
  drone1Gain.connect(dest);
  drone1.start();
  nodes.push(drone1, drone1LP, drone1Gain);

  // Dissonant second voice
  const drone2 = ctx.createOscillator();
  drone2.type = "sawtooth";
  drone2.frequency.value = 77.78; // slightly detuned — tension
  const drone2LP = ctx.createBiquadFilter();
  drone2LP.type = "lowpass";
  drone2LP.frequency.value = 180;
  const drone2Gain = ctx.createGain();
  drone2Gain.gain.value = 0.06;
  drone2.connect(drone2LP);
  drone2LP.connect(drone2Gain);
  drone2Gain.connect(dest);
  drone2.start();
  nodes.push(drone2, drone2LP, drone2Gain);

  // Energy buzz (fast LFO on volume)
  const buzz = ctx.createOscillator();
  buzz.type = "triangle";
  buzz.frequency.value = 330;
  const buzzGain = ctx.createGain();
  buzzGain.gain.value = 0.015;
  const buzzLFO = ctx.createOscillator();
  buzzLFO.frequency.value = 3.5;
  const buzzLFOGain = ctx.createGain();
  buzzLFOGain.gain.value = 0.01;
  buzzLFO.connect(buzzLFOGain);
  buzzLFOGain.connect(buzzGain.gain);
  buzz.connect(buzzGain);
  buzzGain.connect(dest);
  buzz.start();
  buzzLFO.start();
  nodes.push(buzz, buzzGain, buzzLFO, buzzLFOGain);
}

/**
 * DATA VAULT — Wind draft + crystalline tones
 * Filtered noise like wind through a cave, with high sine chimes.
 */
function buildVault(a: AudioEngine, nodes: AudioNode[], dest: AudioNode) {
  const { ctx, noise } = a;

  // Wind noise (bandpass-filtered white noise)
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noise;
  noiseSrc.loop = true;
  const windBP = ctx.createBiquadFilter();
  windBP.type = "bandpass";
  windBP.frequency.value = 800;
  windBP.Q.value = 0.5;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.035;
  noiseSrc.connect(windBP);
  windBP.connect(windGain);
  windGain.connect(dest);
  noiseSrc.start();
  nodes.push(noiseSrc, windBP, windGain);

  // Slow wind modulation
  const windLFO = ctx.createOscillator();
  windLFO.frequency.value = 0.12;
  const windLFOGain = ctx.createGain();
  windLFOGain.gain.value = 400;
  windLFO.connect(windLFOGain);
  windLFOGain.connect(windBP.frequency);
  windLFO.start();
  nodes.push(windLFO, windLFOGain);

  // Crystalline chime 1
  const chime1 = ctx.createOscillator();
  chime1.type = "sine";
  chime1.frequency.value = 1318.5; // E6
  const chime1Gain = ctx.createGain();
  chime1Gain.gain.value = 0.006;
  chime1.connect(chime1Gain);
  chime1Gain.connect(dest);
  chime1.start();
  nodes.push(chime1, chime1Gain);

  // Crystalline chime 2 (perfect fifth)
  const chime2 = ctx.createOscillator();
  chime2.type = "sine";
  chime2.frequency.value = 1975.5; // B6
  const chime2Gain = ctx.createGain();
  chime2Gain.gain.value = 0.004;
  chime2.connect(chime2Gain);
  chime2Gain.connect(dest);
  chime2.start();
  nodes.push(chime2, chime2Gain);

  // Sub rumble
  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.value = 40;
  const subGain = ctx.createGain();
  subGain.gain.value = 0.06;
  sub.connect(subGain);
  subGain.connect(dest);
  sub.start();
  nodes.push(sub, subGain);
}

/**
 * COMMAND CENTER — Console hum + data stream
 * Steady electronic hum with rhythmic data pulse, like a server room.
 */
function buildCommand(ctx: AudioContext, nodes: AudioNode[], dest: AudioNode) {
  // Server room hum
  const hum = ctx.createOscillator();
  hum.type = "sine";
  hum.frequency.value = 120; // 120Hz mains hum
  const humGain = ctx.createGain();
  humGain.gain.value = 0.04;
  hum.connect(humGain);
  humGain.connect(dest);
  hum.start();
  nodes.push(hum, humGain);

  // Fan noise approximation (filtered noise)
  // Use a very quiet oscillator with noise-like quality
  const fan = ctx.createOscillator();
  fan.type = "sawtooth";
  fan.frequency.value = 60;
  const fanLP = ctx.createBiquadFilter();
  fanLP.type = "lowpass";
  fanLP.frequency.value = 150;
  const fanGain = ctx.createGain();
  fanGain.gain.value = 0.015;
  fan.connect(fanLP);
  fanLP.connect(fanGain);
  fanGain.connect(dest);
  fan.start();
  nodes.push(fan, fanLP, fanGain);

  // Data stream pulse (rhythmic beeps)
  const data = ctx.createOscillator();
  data.type = "square";
  data.frequency.value = 880;
  const dataLP = ctx.createBiquadFilter();
  dataLP.type = "lowpass";
  dataLP.frequency.value = 2000;
  const dataGain = ctx.createGain();
  dataGain.gain.value = 0.008;
  // LFO to create rhythmic pulsing
  const dataLFO = ctx.createOscillator();
  dataLFO.frequency.value = 2; // 2 Hz = rhythmic pulse
  const dataLFOGain = ctx.createGain();
  dataLFOGain.gain.value = 0.006;
  dataLFO.connect(dataLFOGain);
  dataLFOGain.connect(dataGain.gain);
  data.connect(dataLP);
  dataLP.connect(dataGain);
  dataGain.connect(dest);
  data.start();
  dataLFO.start();
  nodes.push(data, dataLP, dataGain, dataLFO, dataLFOGain);

  // Low foundation
  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.value = 60;
  const subGain = ctx.createGain();
  subGain.gain.value = 0.05;
  sub.connect(subGain);
  subGain.connect(dest);
  sub.start();
  nodes.push(sub, subGain);
}

/**
 * PORTAL — Swirling energy + resonant sweep
 * Sweeping filter with resonant peaks, like a dimensional rift.
 */
function buildPortal(ctx: AudioContext, nodes: AudioNode[], dest: AudioNode) {
  // Sweeping pad
  const pad = ctx.createOscillator();
  pad.type = "sawtooth";
  pad.frequency.value = 82.41; // E2
  const padBP = ctx.createBiquadFilter();
  padBP.type = "bandpass";
  padBP.frequency.value = 400;
  padBP.Q.value = 3;
  const padGain = ctx.createGain();
  padGain.gain.value = 0.07;
  pad.connect(padBP);
  padBP.connect(padGain);
  padGain.connect(dest);
  pad.start();
  nodes.push(pad, padBP, padGain);

  // Sweeping LFO on filter
  const sweepLFO = ctx.createOscillator();
  sweepLFO.type = "sine";
  sweepLFO.frequency.value = 0.1;
  const sweepLFOGain = ctx.createGain();
  sweepLFOGain.gain.value = 600;
  sweepLFO.connect(sweepLFOGain);
  sweepLFOGain.connect(padBP.frequency);
  sweepLFO.start();
  nodes.push(sweepLFO, sweepLFOGain);

  // Resonant peak
  const peak = ctx.createOscillator();
  peak.type = "sine";
  peak.frequency.value = 220;
  const peakBP = ctx.createBiquadFilter();
  peakBP.type = "bandpass";
  peakBP.frequency.value = 220;
  peakBP.Q.value = 12;
  const peakGain = ctx.createGain();
  peakGain.gain.value = 0.03;
  peak.connect(peakBP);
  peakBP.connect(peakGain);
  peakGain.connect(dest);
  peak.start();
  nodes.push(peak, peakBP, peakGain);

  // Resonant sweep LFO
  const resLFO = ctx.createOscillator();
  resLFO.type = "sine";
  resLFO.frequency.value = 0.07;
  const resLFOGain = ctx.createGain();
  resLFOGain.gain.value = 100;
  resLFO.connect(resLFOGain);
  resLFOGain.connect(peakBP.frequency);
  resLFO.start();
  nodes.push(resLFO, resLFOGain);

  // Ethereal high tone
  const ethereal = ctx.createOscillator();
  ethereal.type = "sine";
  ethereal.frequency.value = 660;
  const etherealGain = ctx.createGain();
  etherealGain.gain.value = 0.012;
  const etherealLFO = ctx.createOscillator();
  etherealLFO.type = "sine";
  etherealLFO.frequency.value = 0.2;
  const etherealLFOGain = ctx.createGain();
  etherealLFOGain.gain.value = 0.008;
  etherealLFO.connect(etherealLFOGain);
  etherealLFOGain.connect(etherealGain.gain);
  ethereal.connect(etherealGain);
  etherealGain.connect(dest);
  ethereal.start();
  etherealLFO.start();
  nodes.push(ethereal, etherealGain, etherealLFO, etherealLFOGain);

  // Sub power
  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.value = 41.2; // E1
  const subGain = ctx.createGain();
  subGain.gain.value = 0.08;
  sub.connect(subGain);
  subGain.connect(dest);
  sub.start();
  nodes.push(sub, subGain);
}
