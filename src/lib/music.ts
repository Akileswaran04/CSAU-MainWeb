/* ============================================================
   MUSIC - the owner's track, from the Earth tap on (2026-10-14).
   One module-level <audio>, so it keeps playing across client
   navigations. It must start inside the tap itself: browsers
   refuse play() outside a user gesture. MusicToggle mutes it.
   ============================================================ */

const SRC = "/music/Leaving_the_Horizon.mp3";
const VOLUME = 0.6;

let audio: HTMLAudioElement | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function startMusic() {
  if (audio) return;
  audio = new Audio(SRC);
  audio.loop = true;
  audio.volume = VOLUME;
  audio.addEventListener("play", emit);
  audio.addEventListener("pause", emit);
  audio.play().catch(() => {});
  emit();
}

export function toggleMusic() {
  if (!audio) return;
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
}

/** "off" before the tap, then "on" or "paused" */
export const musicState = () => (!audio ? "off" : audio.paused ? "paused" : "on");

export function subscribeMusic(f: () => void) {
  subs.add(f);
  return () => void subs.delete(f);
}
