'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import { applyNarrowPullback, holdProgress, sampleJourney } from '@/lib/spline';
import { useAppStore } from '@/lib/store';
import { damp, remap01 } from '@/lib/utils';

/** Pointer parallax range in world units. */
const PARALLAX = 0.15;
const BREATHING = 0.02;
/**
 * Narrow screens: lift scenes into the upper part of the view, clear of the docked
 * copy, and pull them back from the right (desktop framing leaves room for a
 * left-hand copy column that phones don't have).
 */
const NARROW_ASPECT = 0.8;
const NARROW_LIFT = 0.28;
const NARROW_RECENTER = 0.28;

/**
 * Scripted camera: position and look-at come from the journey spline at the
 * scrubbed progress; parallax and breathing ride on top. No OrbitControls.
 */
export function CameraRig() {
  const scratch = useMemo(() => ({ pos: new Vector3(), look: new Vector3(), parallax: new Vector3(), lift: -1, w: 0, h: 0 }), []);
  const fine = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches, []);

  useFrame((state, delta) => {
    const { progress, heldSection, reducedMotion } = useAppStore.getState();
    const { pos, look, parallax } = scratch;

    // Reduced motion: hold one pose per section instead of flying between them.
    sampleJourney(reducedMotion ? holdProgress(heldSection) : progress, pos, look);

    applyNarrowPullback(pos, look, state.size.width / state.size.height, progress);

    if (!reducedMotion) {
      const px = fine ? state.pointer.x * PARALLAX : 0;
      const py = fine ? state.pointer.y * PARALLAX : 0;
      parallax.x = damp(parallax.x, px, 3, delta);
      parallax.y = damp(parallax.y, py, 3, delta);
      pos.x += parallax.x;
      pos.y += parallax.y + Math.sin(state.clock.elapsedTime * 0.6) * BREATHING;
    }

    state.camera.position.copy(pos);
    state.camera.lookAt(look);

    // Eases in after BOOT, so the particle title still lines up with the DOM h1.
    const { width, height } = state.size;
    const amount = width / height < NARROW_ASPECT ? remap01(progress, 0.05, 0.1) : 0;
    const resized = width !== scratch.w || height !== scratch.h;
    if ((resized || Math.abs(amount - scratch.lift) > 0.002) && state.camera instanceof PerspectiveCamera) {
      scratch.lift = amount;
      scratch.w = width;
      scratch.h = height;
      if (amount > 0) {
        state.camera.setViewOffset(width, height, width * NARROW_RECENTER * amount, height * NARROW_LIFT * amount, width, height);
      } else state.camera.clearViewOffset();
    }
  });

  return null;
}
