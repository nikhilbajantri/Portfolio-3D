'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial } from 'three';
import fragmentShader from '@/shaders/stars.frag';
import vertexShader from '@/shaders/stars.vert';
import { scaledCount } from '@/lib/quality';
import { useAppStore } from '@/lib/store';
import { readToken } from '@/lib/utils';

const BASE_COUNT = 6000;

/** Dust around the machine column (descent parallax) plus a far shell (the EXIT sky). */
export function Stars() {
  const tier = useAppStore((s) => s.qualityTier) ?? 'medium';
  const dpr = useThree((s) => s.viewport.dpr);
  const count = scaledCount(BASE_COUNT, tier);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      if (i % 4 === 0) {
        // Far shell around the whole machine.
        const r = 120 + Math.random() * 60;
        const phi = Math.acos(2 * Math.random() - 1);
        positions.set([r * Math.sin(phi) * Math.cos(angle), -30 + r * Math.cos(phi), r * Math.sin(phi) * Math.sin(angle)], i * 3);
      } else {
        // Column dust, kept clear of the camera path (radius ≥ 9).
        const r = 9 + Math.pow(Math.random(), 0.6) * 50;
        positions.set([Math.cos(angle) * r, 20 - Math.random() * 100, Math.sin(angle) * r], i * 3);
      }
      seeds[i] = Math.random();
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(positions, 3));
    g.setAttribute('aSeed', new BufferAttribute(seeds, 1));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uVelocity: { value: 0 },
          uPixelRatio: { value: 1 },
          uSize: { value: 40 },
          uColor: { value: new Color(readToken('--color-text-muted', 'gray')) },
        },
      }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime!.value = useAppStore.getState().reducedMotion ? 0 : state.clock.elapsedTime;
    u.uVelocity!.value = useAppStore.getState().velocity;
    u.uPixelRatio!.value = dpr;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
