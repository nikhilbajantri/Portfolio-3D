'use client';

import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  type Group,
  IcosahedronGeometry,
  type InstancedMesh,
  LineBasicMaterial,
  type Mesh,
  MeshBasicMaterial,
  Object3D,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three';
import coreFrag from '@/shaders/core.frag';
import coreVert from '@/shaders/core.vert';
import { LEADERSHIP, SKILLS, type SkillCluster } from '@/content/data';
import { useLabel } from '@/lib/labels';
import type { QualityTier } from '@/lib/quality';
import { useAppStore } from '@/lib/store';
import { damp, inRenderWindow, readToken, remap01 } from '@/lib/utils';

/** World centre of the KERNEL layer. */
export const KERNEL_ORIGIN = [1.8, -62, 0] as const;
const CORE_RADIUS = 0.9;
const ORBIT_RADIUS = 2.5;
const NODE_SPREAD = 0.3;
const CORE_DETAIL: Record<QualityTier, number> = { high: 48, medium: 32, low: 20 };
/** Rendering window (journey progress). */
const VISIBLE: readonly [number, number] = [0.72, 0.975];

const revealAt = (progress: number): number => remap01(progress, 0.765, 0.8) * (1 - remap01(progress, 0.93, 0.96));

/* ───────────────────────── Core ───────────────────────── */

function Core() {
  const tier = useAppStore((s) => s.qualityTier) ?? 'medium';
  const geometry = useMemo(() => new IcosahedronGeometry(CORE_RADIUS, CORE_DETAIL[tier]), [tier]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: coreVert,
        fragmentShader: coreFrag,
        uniforms: {
          uTime: { value: 0 },
          uRippleAge: { value: 100 },
          uRippleOrigin: { value: new Vector3(0, 1, 0) },
          uPulse: { value: 0 },
          uReveal: { value: 0 },
          uSignal: { value: new Color(readToken('--color-signal', 'cyan')) },
          uPulseColor: { value: new Color(readToken('--color-pulse', 'purple')) },
          uDeep: { value: new Color(readToken('--color-surface-2', 'black')) },
        },
      }),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  // A focus change restarts the ripple, aimed at the focused cluster.
  const ripple = useRef({ pending: false, start: -100, origin: new Vector3(0, 1, 0) });
  useEffect(
    () =>
      useAppStore.subscribe(
        (s) => s.skillFocus,
        (focus) => {
          if (!focus) return;
          const index = SKILLS.findIndex((c) => c.id === focus);
          const a = (index / SKILLS.length) * Math.PI * 2;
          ripple.current.origin.set(Math.cos(a), index % 2 ? 0.3 : -0.3, Math.sin(a)).normalize();
          ripple.current.pending = true;
        },
      ),
    [],
  );

  useFrame((state) => {
    const u = material.uniforms;
    const { progress, reducedMotion } = useAppStore.getState();
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    if (ripple.current.pending) {
      ripple.current.pending = false;
      ripple.current.start = state.clock.elapsedTime;
      (u.uRippleOrigin!.value as Vector3).copy(ripple.current.origin);
    }
    u.uTime!.value = t;
    u.uPulse!.value = 0.5 + 0.5 * Math.sin(t * 1.8);
    u.uRippleAge!.value = reducedMotion ? 100 : state.clock.elapsedTime - ripple.current.start;
    u.uReveal!.value = revealAt(progress);
  });

  return <mesh geometry={geometry} material={material} />;
}

/* ───────────────────────── Skill clusters ───────────────────────── */

/** Fibonacci-sphere offsets around a hub, one per skill. */
function nodeOffsets(count: number): Vector3[] {
  const out: Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    out.push(new Vector3(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r).multiplyScalar(NODE_SPREAD));
  }
  return out;
}

function Cluster({ cluster, index, colors }: { cluster: SkillCluster; index: number; colors: { signal: Color; text: string } }) {
  const group = useRef<Group>(null);
  const nodes = useRef<InstancedMesh>(null);
  const offsets = useMemo(() => nodeOffsets(cluster.items.length), [cluster.items.length]);
  const label = useLabel(cluster.name, { color: colors.text, size: 40 });

  const angle = (index / SKILLS.length) * Math.PI * 2;
  const hub: [number, number, number] = [Math.cos(angle) * ORBIT_RADIUS, index % 2 ? 0.35 : -0.35, Math.sin(angle) * ORBIT_RADIUS];

  const { lines, lineMat, nodeMat, hubMat } = useMemo(() => {
    const points: Vector3[] = [];
    offsets.forEach((o, i) => {
      points.push(new Vector3(), o);
      const next = offsets[(i + 1) % offsets.length];
      if (next && offsets.length > 2) points.push(o, next);
    });
    return {
      lines: new BufferGeometry().setFromPoints(points),
      lineMat: new LineBasicMaterial({ color: colors.signal, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }),
      nodeMat: new MeshBasicMaterial({ color: colors.signal, transparent: true, opacity: 0, depthWrite: false }),
      hubMat: new MeshBasicMaterial({ color: colors.signal, transparent: true, opacity: 0, depthWrite: false }),
    };
  }, [offsets, colors.signal]);

  useEffect(() => {
    const mesh = nodes.current;
    if (!mesh) return;
    const dummy = new Object3D();
    offsets.forEach((o, i) => {
      dummy.position.copy(o);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [offsets]);

  useEffect(
    () => () => {
      lines.dispose();
      lineMat.dispose();
      nodeMat.dispose();
      hubMat.dispose();
    },
    [lines, lineMat, nodeMat, hubMat],
  );

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const { progress, skillFocus } = useAppStore.getState();
    const reveal = revealAt(progress);
    const focused = skillFocus === cluster.id;
    const dimmed = skillFocus !== null && !focused;
    const s = damp(g.scale.x, focused ? 1.9 : 1, 8, delta);
    g.scale.setScalar(s);
    const strength = focused ? 1 : dimmed ? 0.35 : 0.7;
    lineMat.opacity = reveal * strength * 0.5;
    nodeMat.opacity = reveal * strength;
    hubMat.opacity = reveal * (focused ? 1 : 0.8);
    if (label) label.material.opacity = reveal * (dimmed ? 0.45 : 1);

  });

  const setFocus = useAppStore.getState().setSkillFocus;
  const labelH = 0.11;
  return (
    <group position={hub}>
      <group ref={group}>
        <lineSegments geometry={lines} material={lineMat} />
        <instancedMesh ref={nodes} args={[undefined, nodeMat, offsets.length]}>
          <sphereGeometry args={[0.028, 10, 10]} />
        </instancedMesh>
        <mesh material={hubMat}>
          <sphereGeometry args={[0.055, 16, 16]} />
        </mesh>
      </group>
      {/* Generous invisible hit target for pointer focus. */}
      <mesh
        visible={false}
        onPointerOver={(e) => {
          e.stopPropagation();
          setFocus(cluster.id);
        }}
        onPointerOut={() => {
          if (useAppStore.getState().skillFocus === cluster.id) setFocus(null);
        }}
      >
        <sphereGeometry args={[0.45, 8, 8]} />
      </mesh>
      {label ? (
        <Billboard position={[0, 0.5, 0]}>
          <mesh material={label.material} renderOrder={10}>
            <planeGeometry args={[labelH * label.aspect, labelH]} />
          </mesh>
        </Billboard>
      ) : null}
    </group>
  );
}

function Clusters() {
  const orbit = useRef<Group>(null);
  const colors = useMemo(() => ({ signal: new Color(readToken('--color-signal', 'cyan')), text: readToken('--color-text', 'white') }), []);

  useFrame((_, delta) => {
    const o = orbit.current;
    if (!o) return;
    const { reducedMotion, skillFocus } = useAppStore.getState();
    // Orbit slowly; hold still while a cluster is focused so it can be read.
    if (!reducedMotion && !skillFocus) o.rotation.y += delta * 0.08;
  });

  return (
    <group rotation={[0.22, 0, 0.06]}>
      <group ref={orbit}>
        {SKILLS.map((cluster, i) => (
          <Cluster key={cluster.id} cluster={cluster} index={i} colors={colors} />
        ))}
      </group>
    </group>
  );
}

/* ───────────────────────── Leadership strip ───────────────────────── */

function drawStrip(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 4096;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const mono = getComputedStyle(document.documentElement).getPropertyValue('--font-jetbrains').trim() || 'monospace';
  const text = readToken('--color-text', 'white');
  const signal = readToken('--color-signal', 'cyan');
  ctx.font = `500 44px ${mono}`;
  ctx.letterSpacing = '7px';
  ctx.textBaseline = 'middle';
  const entries = LEADERSHIP.map((l) => `${l.role} · ${l.organisation}`.toUpperCase());
  const gap = (canvas.width - entries.reduce((w, e) => w + ctx.measureText(e).width, 0)) / entries.length;
  let x = gap / 2;
  for (const entry of entries) {
    ctx.fillStyle = signal;
    ctx.beginPath();
    ctx.arc(x - 28, canvas.height / 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = text;
    ctx.fillText(entry, x, canvas.height / 2);
    x += ctx.measureText(entry).width + gap;
  }
  ctx.fillStyle = signal;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(0, 4, canvas.width, 2);
  ctx.fillRect(0, canvas.height - 6, canvas.width, 2);
  return canvas;
}

function LeadershipStrip() {
  const ring = useRef<Mesh>(null);
  const material = useMemo(() => new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }), []);

  useEffect(() => {
    let texture: CanvasTexture | null = null;
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      texture = new CanvasTexture(drawStrip());
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = 8;
      material.map = texture;
      material.needsUpdate = true;
    });
    return () => {
      cancelled = true;
      texture?.dispose();
      material.dispose();
    };
  }, [material]);

  useFrame((_, delta) => {
    const { progress, reducedMotion } = useAppStore.getState();
    material.opacity = remap01(progress, 0.83, 0.86) * (1 - remap01(progress, 0.93, 0.96));
    if (ring.current && !reducedMotion) ring.current.rotation.y -= delta * 0.05;
  });

  return (
    <mesh ref={ring} position={[0, -1.25, 0]} material={material}>
      <cylinderGeometry args={[2.0, 2.0, 0.26, 128, 1, true]} />
    </mesh>
  );
}

/**
 * KERNEL CORE: a pulsing noise core orbited by the 8 skill clusters, ringed by
 * the leadership timeline.
 */
export function KernelCore() {
  const group = useRef<Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const { progress, sceneReady } = useAppStore.getState();
    group.current.visible = inRenderWindow(progress, sceneReady, VISIBLE);
  });

  return (
    <group ref={group} position={KERNEL_ORIGIN}>
      <Core />
      <Clusters />
      <LeadershipStrip />
    </group>
  );
}
