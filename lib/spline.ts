import { CatmullRomCurve3, Vector3 } from 'three';
import { SECTIONS, type SectionId } from '@/content/data';
import { clamp } from '@/lib/utils';

/**
 * The camera journey. World is axis-aligned: the chip lies flat at the origin and
 * each machine layer sits deeper along −y. Every keyframe pins a camera position and
 * a look-at target to an exact journey progress, so scene beats land where the DOM
 * content for that section is.
 */

type Vec = readonly [number, number, number];

export interface Keyframe {
  at: number;
  pos: Vec;
  look: Vec;
}

/** World anchors every scene builds around. */
export const ANCHORS = {
  chip: [0, 0, 0],
  studio: [1.2, -14, -2.6],
  auth: [2.2, -30, -4],
  data: [2.2, -46.6, -2],
  kernel: [1.8, -62, 0],
} as const satisfies Record<string, Vec>;

export const KEYFRAMES: readonly Keyframe[] = [
  // BOOT: chip below the particle title.
  { at: 0.0, pos: [0, 2.4, 5.6], look: [0, 0.25, 0] },
  { at: 0.04, pos: [0, 2.3, 4.6], look: [0, 0.1, 0] },
  // DIE: dive onto the die. Camera and target share x so the view pitches without
  // rolling; x < 0 frames the die right of centre, clear of the left-hand copy.
  { at: 0.1, pos: [-0.4, 2.4, 1.3], look: [-0.4, 0, 0] },
  { at: 0.16, pos: [-0.45, 1.5, 0.9], look: [-0.45, 0, -0.05] },
  { at: 0.21, pos: [-0.2, 0.6, 0.35], look: [-0.15, -1, 0] },
  // STUDIO: through the die; both frames held right of the copy column.
  { at: 0.26, pos: [1.0, -13.1, 6.0], look: [0.3, -14, -2.6] },
  { at: 0.38, pos: [1.7, -13.5, 5.6], look: [0.55, -14, -2.7] },
  // AUTH: fly alongside the gate stack (gates right of the copy), ending on the cluster.
  { at: 0.45, pos: [0.2, -29.2, 8.0], look: [1.4, -30, 0] },
  { at: 0.5, pos: [0.0, -29.4, 3.6], look: [1.6, -30, -4] },
  { at: 0.56, pos: [0.3, -29.4, -1.5], look: [2.4, -29.8, -11] },
  // DATA: monoliths first, then pull back over the candlestick ridge (scene right of the copy).
  { at: 0.62, pos: [1.4, -44.4, 4.8], look: [1.6, -46.1, -1.2] },
  { at: 0.68, pos: [1.4, -44.3, 6.0], look: [1.3, -45.9, -2.0] },
  { at: 0.74, pos: [1.4, -44.4, 7.4], look: [1.1, -45.9, -2.6] },
  // KERNEL: approach and orbit the core, which stays right of the copy.
  { at: 0.8, pos: [-0.4, -60.6, 8.6], look: [-0.4, -62, 0] },
  { at: 0.86, pos: [2.6, -60.8, 8.0], look: [0.0, -62, 0] },
  { at: 0.9, pos: [5.6, -61.2, 6.0], look: [0.4, -62, 0.3] },
  // EXIT: fast pull-back through every layer out to space.
  { at: 0.96, pos: [1, -25, 30], look: [0, -35, 0] },
  { at: 1.0, pos: [0, 10, 70], look: [0, -4, 0] },
];

const toVec = (v: Vec): Vector3 => new Vector3(v[0], v[1], v[2]);
const posCurve = new CatmullRomCurve3(KEYFRAMES.map((k) => toVec(k.pos)), false, 'centripetal');
const lookCurve = new CatmullRomCurve3(KEYFRAMES.map((k) => toVec(k.look)), false, 'centripetal');
const LAST = KEYFRAMES.length - 1;

/**
 * Journey progress → curve parameter. CatmullRomCurve3.getPoint(u) spends equal u
 * per control-point segment, so map piecewise-linearly between keyframe `at` values.
 */
export function curveParam(progress: number): number {
  const p = clamp(progress, 0, 1);
  for (let i = 0; i < LAST; i++) {
    const a = KEYFRAMES[i]!.at;
    const b = KEYFRAMES[i + 1]!.at;
    if (p <= b) return (i + (p - a) / (b - a)) / LAST;
  }
  return 1;
}

/** Writes the camera position and look-at target for `progress` into the given vectors. */
export function sampleJourney(progress: number, pos: Vector3, look: Vector3): void {
  const u = curveParam(progress);
  posCurve.getPoint(u, pos);
  lookCurve.getPoint(u, look);
}

/** Progress at which a section's camera holds (reduced motion uses only these). */
export function holdProgress(id: SectionId): number {
  const section = SECTIONS.find((s) => s.id === id);
  if (!section) return 0;
  const [start, end] = section.range;
  return id === 'boot' ? 0 : start + (end - start) * 0.5;
}

export const BOOT_POSE = { pos: toVec(KEYFRAMES[0]!.pos), look: toVec(KEYFRAMES[0]!.look) } as const;

/** Narrow screens pull the camera back along its view line to keep scenes framed. */
const NARROW_ASPECT = 0.8;
const NARROW_PULLBACK = 1.35;

/**
 * KERNEL's desktop framing pushes the core far right of a copy column that phones
 * don't have; on narrow screens slide the camera toward it (world units along x).
 */
const NARROW_SHIFT: ReadonlyArray<readonly [number, number]> = [
  [0.74, 0],
  [0.78, 1.0],
  [0.92, 1.0],
  [0.95, 0],
];

function narrowShiftX(progress: number): number {
  for (let i = 0; i < NARROW_SHIFT.length - 1; i++) {
    const [a, va] = NARROW_SHIFT[i]!;
    const [b, vb] = NARROW_SHIFT[i + 1]!;
    if (progress >= a && progress <= b) return va + ((progress - a) / (b - a)) * (vb - va);
  }
  return 0;
}

export function applyNarrowPullback(pos: Vector3, look: Vector3, aspect: number, progress = 0): void {
  if (aspect >= NARROW_ASPECT) return;
  pos.sub(look).multiplyScalar(NARROW_PULLBACK).add(look);
  const dx = narrowShiftX(progress);
  pos.x += dx;
  look.x += dx;
}
