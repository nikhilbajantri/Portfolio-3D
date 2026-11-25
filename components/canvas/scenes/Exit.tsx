'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, CanvasTexture, DoubleSide, type Group, MeshBasicMaterial, type Sprite, SpriteMaterial, SRGBColorSpace } from 'three';
import { ANCHORS } from '@/lib/spline';
import { useAppStore } from '@/lib/store';
import { readToken, remap01 } from '@/lib/utils';

/** Y of every machine layer the pull-back passes through, top to bottom. */
const STRATA = [ANCHORS.chip[1], ANCHORS.studio[1], ANCHORS.auth[1], ANCHORS.data[1], ANCHORS.kernel[1]];
const EXIT_FROM = 0.915;

function starTexture(core: string, glow: string): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;
  const radial = ctx.createRadialGradient(c, c, 0, c, c, c);
  radial.addColorStop(0, core);
  radial.addColorStop(0.08, core);
  radial.addColorStop(0.25, glow);
  radial.addColorStop(1, 'transparent');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, size, size);
  // Thin cross flare.
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = core;
  ctx.fillRect(c - size * 0.45, c - 1, size * 0.9, 2);
  ctx.fillRect(c - 1, c - size * 0.45, 2, size * 0.9);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function strataTexture(color: string): CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;
  ctx.strokeStyle = color;
  for (let r = 40; r < c; r += 38) {
    ctx.globalAlpha = 0.5 * (1 - r / c);
    ctx.lineWidth = r % 152 === 40 ? 3 : 1;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * 40, c + Math.sin(a) * 40);
    ctx.lineTo(c + Math.cos(a) * c, c + Math.sin(a) * c);
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * EXIT: the pull-back streaks through a glowing stratum at every layer's depth
 * (stars stretch with velocity; chromatic aberration joins in PostFX), and the
 * chip shrinks into a star.
 */
export function Exit() {
  const star = useRef<Sprite>(null);
  const group = useRef<Group>(null);

  const { starMat, strataMat } = useMemo(() => {
    const signal = readToken('--color-signal', 'cyan');
    return {
      starMat: new SpriteMaterial({
        map: starTexture(readToken('--color-text', 'white'), signal),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        blending: AdditiveBlending,
        sizeAttenuation: false,
      }),
      strataMat: new MeshBasicMaterial({
        map: strataTexture(signal),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      }),
    };
  }, []);

  useEffect(
    () => () => {
      starMat.map?.dispose();
      starMat.dispose();
      strataMat.map?.dispose();
      strataMat.dispose();
    },
    [starMat, strataMat],
  );

  useFrame(() => {
    const { progress, sceneReady } = useAppStore.getState();
    if (group.current) group.current.visible = !sceneReady || progress > EXIT_FROM - 0.01;
    strataMat.opacity = remap01(progress, EXIT_FROM, 0.935) * (1 - remap01(progress, 0.975, 0.995)) * 0.8;
    // The chip becomes a star as the camera recedes.
    const s = remap01(progress, 0.955, 1);
    starMat.opacity = s;
    star.current?.scale.setScalar(0.012 + s * 0.05);
  });

  return (
    <group ref={group}>
      {STRATA.map((y) => (
        <mesh key={y} position={[1, y, 0]} rotation={[-Math.PI / 2, 0, 0]} material={strataMat}>
          <circleGeometry args={[40, 96]} />
        </mesh>
      ))}
      <sprite ref={star} position={ANCHORS.chip} material={starMat} renderOrder={20} />
    </group>
  );
}
