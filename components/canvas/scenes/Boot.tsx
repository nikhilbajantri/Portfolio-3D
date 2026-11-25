'use client';

import { Environment, Lightformer, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, type DirectionalLight, type Group, type InstancedMesh, Object3D } from 'three';
import { ParticleTitle } from '@/components/canvas/ParticleTitle';
import { DieSurface } from '@/components/canvas/scenes/DieSurface';
import { useAppStore } from '@/lib/store';
import { inRenderWindow, readToken } from '@/lib/utils';

const CHIP_SIZE = 2;
const PINS_PER_SIDE = 14;
const CHIP_WINDOW: readonly [number, number] = [-1, 0.27];

/** Pins along all four package edges, drawn as one instanced mesh. */
function Pins({ color }: { color: Color }) {
  const mesh = useRef<InstancedMesh>(null);
  const count = PINS_PER_SIDE * 4;

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const dummy = new Object3D();
    const half = CHIP_SIZE / 2;
    const step = (CHIP_SIZE * 0.82) / (PINS_PER_SIDE - 1);
    let i = 0;
    for (let side = 0; side < 4; side++) {
      for (let p = 0; p < PINS_PER_SIDE; p++) {
        const along = -CHIP_SIZE * 0.41 + p * step;
        const out = half + 0.07;
        const x = side === 0 ? along : side === 1 ? out : side === 2 ? along : -out;
        const z = side === 0 ? out : side === 1 ? along : side === 2 ? -out : along;
        dummy.position.set(x, -0.04, z);
        dummy.rotation.set(0, side % 2 === 0 ? 0 : Math.PI / 2, 0);
        dummy.updateMatrix();
        m.setMatrixAt(i++, dummy.matrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.035, 0.03, 0.16]} />
      <meshStandardMaterial color={color} metalness={1} roughness={0.35} />
    </instancedMesh>
  );
}

/**
 * BOOT: an obsidian-glass chip floating in darkness under a slow cyan rim light,
 * with the particle title in front of it.
 */
export function Boot() {
  const chip = useRef<Group>(null);
  const rim = useRef<DirectionalLight>(null);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const colors = useMemo(
    () => ({
      surface: new Color(readToken('--color-surface', 'black')),
      surface2: new Color(readToken('--color-surface-2', 'black')),
      border: new Color(readToken('--color-border', 'gray')),
      signal: new Color(readToken('--color-signal', 'cyan')),
      pulse: new Color(readToken('--color-pulse', 'purple')),
    }),
    [],
  );

  useFrame((state) => {
    const group = chip.current;
    const light = rim.current;
    if (!group || !light) return;
    const { progress, sceneReady } = useAppStore.getState();
    // The chip is only on screen until the dive is through it, and again as EXIT pulls back.
    group.visible = inRenderWindow(progress, sceneReady, CHIP_WINDOW) || progress > 0.92;
    const t = reducedMotion ? 0 : state.clock.elapsedTime;

    // Lies flat at the origin; the camera does the diving. Idle float only.
    group.position.y = Math.sin(t * 0.7) * 0.04;
    group.rotation.x = Math.sin(t * 0.5) * 0.015;
    group.rotation.z = Math.sin(t * 0.4) * 0.015;

    // The rim light orbits slowly behind the chip.
    light.position.set(Math.cos(t * 0.25) * 4, 1.5 + Math.sin(t * 0.3) * 0.5, -3 + Math.sin(t * 0.25) * 1.5);
  });

  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight ref={rim} intensity={7} color={colors.signal} />
      <directionalLight position={[3, -2, 4]} intensity={0.35} color={colors.pulse} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={1.6} color={colors.signal} position={[-3, 2, -4]} scale={[4, 0.4, 1]} />
        <Lightformer form="rect" intensity={0.8} color={colors.pulse} position={[4, -1, -3]} scale={[3, 0.3, 1]} />
      </Environment>

      <group ref={chip}>
        {/* Package */}
        <RoundedBox args={[CHIP_SIZE, 0.16, CHIP_SIZE]} radius={0.05} smoothness={4}>
          <meshPhysicalMaterial
            color={colors.surface}
            metalness={0.2}
            roughness={0.12}
            clearcoat={1}
            clearcoatRoughness={0.05}
            envMapIntensity={1.4}
          />
        </RoundedBox>
        {/* Die */}
        <RoundedBox args={[CHIP_SIZE * 0.5, 0.04, CHIP_SIZE * 0.5]} radius={0.01} position={[0, 0.09, 0]}>
          <meshPhysicalMaterial
            color={colors.surface2}
            metalness={0.6}
            roughness={0.25}
            emissive={colors.signal}
            emissiveIntensity={0.025}
            envMapIntensity={1.2}
          />
        </RoundedBox>
        {/* Die outline */}
        <mesh position={[0, 0.112, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[CHIP_SIZE * 0.36, CHIP_SIZE * 0.365, 4, 1, Math.PI / 4]} />
          <meshBasicMaterial color={colors.signal} transparent opacity={0.35} />
        </mesh>
        <Pins color={colors.border} />
        <DieSurface />
      </group>

      {reducedMotion ? null : <ParticleTitle />}
    </>
  );
}
