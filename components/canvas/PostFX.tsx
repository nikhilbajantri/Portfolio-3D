'use client';

import { useFrame } from '@react-three/fiber';
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction, type ChromaticAberrationEffect } from 'postprocessing';
import { type RefObject, useMemo, useRef } from 'react';
import { Vector2 } from 'three';
import { QUALITY } from '@/lib/quality';
import { useAppStore } from '@/lib/store';
import { damp, remap01 } from '@/lib/utils';

/** Resting aberration, and the extra amount at full scroll velocity / the EXIT pull-back. */
const ABERRATION_BASE = 0.0004;
const ABERRATION_VELOCITY = 0.004;
const ABERRATION_EXIT = 0.006;

/** Drives the chromatic aberration offset from scroll velocity (no allocations per frame). */
function AberrationDriver({ effect }: { effect: RefObject<ChromaticAberrationEffect | null> }) {
  const amount = useRef(ABERRATION_BASE);
  useFrame((_, delta) => {
    const e = effect.current;
    if (!e) return;
    const { velocity, progress, reducedMotion } = useAppStore.getState();
    const exit = remap01(progress, 0.92, 0.97) * (1 - remap01(progress, 0.985, 1));
    const target = reducedMotion ? 0 : ABERRATION_BASE + Math.abs(velocity) * ABERRATION_VELOCITY + exit * ABERRATION_EXIT;
    amount.current = damp(amount.current, target, 6, delta);
    e.offset.set(amount.current, amount.current * 0.6);
  });
  return null;
}

/**
 * Post-processing per tier. HIGH: bloom + velocity chromatic aberration + vignette +
 * grain. MEDIUM: bloom only. LOW: no composer at all.
 */
export function PostFX() {
  const tier = useAppStore((s) => s.qualityTier) ?? 'medium';
  const mode = QUALITY[tier].postFX;
  const aberration = useRef<ChromaticAberrationEffect>(null);
  const offset = useMemo(() => new Vector2(ABERRATION_BASE, ABERRATION_BASE), []);

  if (mode === 'none') return null;

  const bloom = <Bloom mipmapBlur luminanceThreshold={0.62} luminanceSmoothing={0.2} intensity={0.85} radius={0.7} />;

  if (mode === 'bloom') {
    return <EffectComposer multisampling={0}>{bloom}</EffectComposer>;
  }

  return (
    <>
      <EffectComposer multisampling={0}>
        {bloom}
        <ChromaticAberration
          ref={aberration}
          offset={offset}
          radialModulation
          modulationOffset={0.25}
          blendFunction={BlendFunction.NORMAL}
        />
        <Vignette offset={0.3} darkness={0.55} />
        <Noise premultiply opacity={0.035} />
      </EffectComposer>
      <AberrationDriver effect={aberration} />
    </>
  );
}
