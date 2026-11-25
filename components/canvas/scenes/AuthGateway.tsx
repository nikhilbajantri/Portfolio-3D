'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  DoubleSide,
  type Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from 'three';
import gateFrag from '@/shaders/gate.frag';
import gateVert from '@/shaders/gate.vert';
import packetsFrag from '@/shaders/packets.frag';
import packetsVert from '@/shaders/packets.vert';
import { PROJECTS } from '@/content/data';
import { useLabel } from '@/lib/labels';
import { scaledCount } from '@/lib/quality';
import { useAppStore } from '@/lib/store';
import { inRenderWindow, readToken, remap01 } from '@/lib/utils';

/** World layout of the AUTH layer (lib/spline keyframes frame it). */
export const AUTH_LAYOUT = {
  center: [2.2, -30] as const,
  gates: [0, -4, -8] as const,
  gateSize: 2.2,
  spawnZ: 4,
  length: 18,
  cluster: [3.4, -29.7, -11] as const,
};
const GATE_NAMES = ['Keycloak', 'JWT', 'RBAC'] as const;
const BASE_PACKETS = 700;
/** Fraction of packets rejected, spread over the three gates. */
const REJECT_RATE = 0.3;
const LANES = 8;

/** Rendering window for the whole layer (journey progress). */
const VISIBLE: readonly [number, number] = [0.37, 0.63];

function rand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function Gate({ index, z, color }: { index: number; z: number; color: Color }) {
  const size = AUTH_LAYOUT.gateSize;
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: gateVert,
        fragmentShader: gateFrag,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        uniforms: {
          uColor: { value: color },
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uIndex: { value: index },
          uSize: { value: [size, size] },
        },
      }),
    [color, index, size],
  );
  const signal = useMemo(() => readToken('--color-signal', 'cyan'), []);
  const label = useLabel(`${String(index + 1).padStart(2, '0')} ${GATE_NAMES[index]}`, { color: signal });
  const geometry = useMemo(() => new PlaneGeometry(size, size), [size]);

  useEffect(
    () => () => {
      material.dispose();
      geometry.dispose();
    },
    [material, geometry],
  );

  useFrame((state) => {
    const { progress, reducedMotion } = useAppStore.getState();
    const reveal = remap01(progress, 0.42 + index * 0.012, 0.46 + index * 0.012) * (1 - remap01(progress, 0.575, 0.6));
    material.uniforms.uTime!.value = reducedMotion ? 0 : state.clock.elapsedTime;
    material.uniforms.uReveal!.value = reveal;
    if (label) label.material.opacity = reveal;
  });

  const labelHeight = 0.16;
  return (
    <group position={[AUTH_LAYOUT.center[0], AUTH_LAYOUT.center[1], z]}>
      <mesh geometry={geometry} material={material} />
      {label ? (
        <mesh position={[-size / 2 + (labelHeight * label.aspect) / 2, size / 2 + 0.16, 0]} material={label.material}>
          <planeGeometry args={[labelHeight * label.aspect, labelHeight]} />
        </mesh>
      ) : null}
    </group>
  );
}

function Packets() {
  const tier = useAppStore((s) => s.qualityTier) ?? 'medium';
  const count = scaledCount(BASE_PACKETS, tier);

  const { geometry, material } = useMemo(() => {
    const r = rand(42);
    const lanes = new Float32Array(count * 2);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);
    const seeds = new Float32Array(count);
    const rejects = new Float32Array(count);
    const half = AUTH_LAYOUT.gateSize * 0.36;
    for (let i = 0; i < count; i++) {
      // Packets ride a grid of lanes, matching the rails.
      const lane = Math.floor(r() * LANES);
      const lx = -half + (lane / (LANES - 1)) * half * 2;
      const ly = -half + Math.floor(r() * 5) * ((half * 2) / 4);
      lanes.set([lx, ly], i * 2);
      speeds[i] = 0.05 + r() * 0.05;
      phases[i] = r();
      seeds[i] = r();
      rejects[i] = r() < REJECT_RATE ? Math.floor(r() * 3) : -1;
    }

    const base = new BoxGeometry(1, 1, 1);
    const g = new InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    g.setAttribute('aLane', new InstancedBufferAttribute(lanes, 2));
    g.setAttribute('aSpeed', new InstancedBufferAttribute(speeds, 1));
    g.setAttribute('aPhase', new InstancedBufferAttribute(phases, 1));
    g.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 1));
    g.setAttribute('aReject', new InstancedBufferAttribute(rejects, 1));
    g.instanceCount = count;

    const m = new ShaderMaterial({
      vertexShader: packetsVert,
      fragmentShader: packetsFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uGather: { value: 0 },
        uVelocity: { value: 0 },
        uOrigin: { value: new Vector3(AUTH_LAYOUT.center[0], AUTH_LAYOUT.center[1], AUTH_LAYOUT.spawnZ) },
        uLength: { value: AUTH_LAYOUT.length },
        uGates: { value: new Vector3(...AUTH_LAYOUT.gates) },
        uCluster: { value: new Vector3(...AUTH_LAYOUT.cluster) },
        uNeutral: { value: new Color(readToken('--color-text-muted', 'gray')) },
        uSignal: { value: new Color(readToken('--color-signal', 'cyan')) },
        uThreat: { value: new Color(readToken('--color-threat', 'red')) },
      },
    });
    return { geometry: g, material: m };
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state) => {
    const u = material.uniforms;
    const { progress, velocity, reducedMotion } = useAppStore.getState();
    u.uTime!.value = reducedMotion ? 12 : state.clock.elapsedTime;
    u.uVelocity!.value = velocity;
    u.uReveal!.value = remap01(progress, 0.43, 0.47) * (1 - remap01(progress, 0.585, 0.61));
    u.uGather!.value = remap01(progress, 0.53, 0.565);
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

/** Lane rails under the stream, so packets read as travelling along traces. */
function Rails({ color }: { color: Color }) {
  const half = AUTH_LAYOUT.gateSize * 0.36;
  const material = useMemo(
    () => new MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }),
    [color],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame(() => {
    const { progress } = useAppStore.getState();
    material.opacity = 0.35 * remap01(progress, 0.42, 0.46) * (1 - remap01(progress, 0.575, 0.6));
  });

  const midZ = AUTH_LAYOUT.spawnZ - AUTH_LAYOUT.length / 2;
  return (
    <group position={[AUTH_LAYOUT.center[0], AUTH_LAYOUT.center[1] - AUTH_LAYOUT.gateSize / 2 - 0.02, midZ]}>
      {Array.from({ length: LANES }, (_, lane) => (
        <mesh
          key={lane}
          position={[-half + (lane / (LANES - 1)) * half * 2, 0, 0]}
          material={material}
        >
          <boxGeometry args={[0.008, 0.008, AUTH_LAYOUT.length]} />
        </mesh>
      ))}
    </group>
  );
}

/** "NEXT · ML Network Anomaly Detector · IN PROGRESS" over the rejected-packet cluster. */
function ClusterLabel() {
  const project = PROJECTS.find((p) => p.slug === 'ml-network-anomaly-detector');
  const colors = useMemo(() => ({ text: readToken('--color-text', 'white'), threat: readToken('--color-threat', 'red') }), []);
  const label = useLabel(`Next · ${project?.title ?? ''} · ${project?.badge ?? ''}`, {
    color: colors.text,
    dot: colors.threat,
    size: 40,
  });
  useFrame(() => {
    if (!label) return;
    const { progress } = useAppStore.getState();
    label.material.opacity = remap01(progress, 0.545, 0.565) * (1 - remap01(progress, 0.585, 0.61));
  });
  if (!label) return null;
  const height = 0.13;
  const [x, y, z] = AUTH_LAYOUT.cluster;
  return (
    <mesh position={[x, y + 0.85, z]} material={label.material}>
      <planeGeometry args={[height * label.aspect, height]} />
    </mesh>
  );
}

/**
 * AUTH GATEWAY: packets stream through KEYCLOAK → JWT → RBAC. Authorized traffic
 * passes in cyan; rejected traffic flashes threat-red and dissolves at its gate,
 * then gathers into the anomaly-detector teaser cluster.
 */
export function AuthGateway() {
  const group = useRef<Group>(null);
  const color = useMemo(() => new Color(readToken('--color-signal', 'cyan')), []);

  useFrame(() => {
    if (!group.current) return;
    const { progress, sceneReady } = useAppStore.getState();
    group.current.visible = inRenderWindow(progress, sceneReady, VISIBLE);
  });

  return (
    <group ref={group}>
      <Rails color={color} />
      {AUTH_LAYOUT.gates.map((z, i) => (
        <Gate key={z} index={i} z={z} color={color} />
      ))}
      <Packets />
      <ClusterLabel />
    </group>
  );
}
