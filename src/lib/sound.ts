/* ============================================================================
   CSAU SOUND ENGINE — all audio is synthesized with the Web Audio API.
   No audio files are downloaded. Ambience is strictly opt-in: the user's
   choice is persisted in localStorage under "csau-ambience".
   ========================================================================== */

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
