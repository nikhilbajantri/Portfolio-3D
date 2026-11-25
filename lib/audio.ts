import type { Howl } from 'howler';

/**
 * Sound engine. Howler is imported only when sound is first switched on, so it
 * never weighs on the initial bundle. Callers must only start it from a user
 * gesture (see SoundManager), so nothing ever autoplays.
 */

interface Sounds {
  drone: Howl;
  tick: Howl;
  whoosh: Howl;
}

const DRONE_VOLUME = 0.22;
const FADE_MS = 900;
const TICK_GAP_MS = 70;

let loading: Promise<Sounds> | null = null;
let sounds: Sounds | null = null;
let enabled = false;
let lastTick = 0;

const src = (name: string): string[] => [`/audio/${name}.webm`, `/audio/${name}.mp3`];

function load(): Promise<Sounds> {
  loading ??= import('howler').then(({ Howl }) => {
    sounds = {
      drone: new Howl({ src: src('drone'), loop: true, volume: 0, html5: false }),
      tick: new Howl({ src: src('tick'), volume: 0.18 }),
      whoosh: new Howl({ src: src('whoosh'), volume: 0.35 }),
    };
    return sounds;
  });
  return loading;
}

export async function startSound(): Promise<void> {
  enabled = true;
  const s = await load();
  if (!enabled) return;
  if (!s.drone.playing()) s.drone.play();
  s.drone.fade(s.drone.volume(), DRONE_VOLUME, FADE_MS);
}

export function stopSound(): void {
  enabled = false;
  const drone = sounds?.drone;
  if (!drone?.playing()) return;
  drone.fade(drone.volume(), 0, FADE_MS / 2);
  drone.once('fade', () => {
    if (!enabled) drone.pause();
  });
}

export function playTick(): void {
  if (!enabled || !sounds) return;
  const now = performance.now();
  if (now - lastTick < TICK_GAP_MS) return;
  lastTick = now;
  sounds.tick.play();
}

export function playWhoosh(): void {
  if (enabled && sounds) sounds.whoosh.play();
}
