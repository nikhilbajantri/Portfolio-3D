'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  type Mesh,
  Plane,
  PlaneGeometry,
  Raycaster,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';
import fragmentShader from '@/shaders/traces.frag';
import vertexShader from '@/shaders/traces.vert';
import { scaledCount } from '@/lib/quality';
import { useAppStore } from '@/lib/store';
import { damp, inRenderWindow, readToken, remap01 } from '@/lib/utils';

/** Chip-local heights of the package top and the die top (see Boot). */
const PACKAGE_Y = 0.082;
const DIE_Y = 0.112;
const DIE_HALF = 0.5;
const EDGE = 0.93;
const GRID = 0.04;
const BASE_OUT_PATHS = 110;
const BASE_DIE_PATHS = 64;
/** Traces fade out by 0.25 (uIntensity). */
const TRACES_WINDOW: readonly [number, number] = [-1, 0.26];

interface Circuit {
  a: Float32Array;
  b: Float32Array;
  dist: Float32Array;
  width: Float32Array;
  seed: Float32Array;
  y: Float32Array;
  count: number;
  maxDist: number;
}

/** Small deterministic PRNG so the layout is identical on every load. */
function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const snap = (v: number): number => Math.round(v / GRID) * GRID;

/**
 * Manhattan routing with occasional 45° jogs: buses leave the die edge for the
 * package rim, and shorter logic runs stay on the die.
 */
function generateCircuit(outPaths: number, diePaths: number): Circuit {
  const rand = mulberry32(20_26);
  const segs: number[][] = [];
  let maxDist = 0;

  const walk = (x0: number, z0: number, dx: number, dz: number, onDie: boolean): void => {
    let x = x0;
    let z = z0;
    let dist = 0;
    let dirX = dx;
    let dirZ = dz;
    const limit = onDie ? DIE_HALF - 0.04 : EDGE;
    const width = onDie ? 0.006 + rand() * 0.004 : 0.009 + rand() * 0.007;
    const seed = rand();
    for (let step = 0; step < (onDie ? 5 : 7); step++) {
      const diagonal = dirX !== 0 && dirZ !== 0;
      const cells = diagonal ? 2 + Math.floor(rand() * 3) : 3 + Math.floor(rand() * 7);
      let nx = x + dirX * cells * GRID;
      let nz = z + dirZ * cells * GRID;
      const clipped = Math.abs(nx) > limit || Math.abs(nz) > limit;
      nx = Math.max(-limit, Math.min(limit, nx));
      nz = Math.max(-limit, Math.min(limit, nz));
      const len = Math.hypot(nx - x, nz - z);
      if (len < GRID * 0.5) break;
      segs.push([x, z, nx, nz, dist, width, seed, onDie ? DIE_Y : PACKAGE_Y]);
      dist += len;
      x = nx;
      z = nz;
      if (clipped) break;
      // Alternate between straight runs and short 45° jogs, then straighten out.
      if (diagonal) {
        if (rand() < 0.5) dirX = 0;
        else dirZ = 0;
      } else if (rand() < 0.4) {
        if (dirX === 0) dirX = rand() < 0.5 ? 1 : -1;
        else dirZ = rand() < 0.5 ? 1 : -1;
      }
    }
    maxDist = Math.max(maxDist, dist);
  };

  for (let i = 0; i < outPaths; i++) {
    const side = Math.floor(rand() * 4);
    const along = snap((rand() * 2 - 1) * (DIE_HALF - 0.04));
    if (side === 0) walk(along, DIE_HALF, 0, 1, false);
    else if (side === 1) walk(DIE_HALF, along, 1, 0, false);
    else if (side === 2) walk(along, -DIE_HALF, 0, -1, false);
    else walk(-DIE_HALF, along, -1, 0, false);
  }
  for (let i = 0; i < diePaths; i++) {
    const x = snap((rand() * 2 - 1) * (DIE_HALF - 0.06));
    const z = snap((rand() * 2 - 1) * (DIE_HALF - 0.06));
    const horizontal = rand() < 0.5;
    const sign = rand() < 0.5 ? 1 : -1;
    walk(x, z, horizontal ? sign : 0, horizontal ? 0 : sign, true);
  }

  const count = segs.length;
  const out: Circuit = {
    a: new Float32Array(count * 2),
    b: new Float32Array(count * 2),
    dist: new Float32Array(count),
    width: new Float32Array(count),
    seed: new Float32Array(count),
    y: new Float32Array(count),
    count,
    maxDist,
  };
  segs.forEach((s, i) => {
    out.a.set([s[0]!, s[1]!], i * 2);
    out.b.set([s[2]!, s[3]!], i * 2);
    out.dist[i] = s[4]!;
    out.width[i] = s[5]!;
    out.seed[i] = s[6]!;
    out.y[i] = s[7]!;
  });
  return out;
}

/**
 * DIE SURFACE: procedural circuit traces on the die and package. They draw
 * outward as the camera dives, carry data dashes, and ripple from the cursor.
 * Mounted inside the chip group, so everything is in chip-local space.
 */
export function DieSurface() {
  const tier = useAppStore((s) => s.qualityTier) ?? 'medium';
  const mesh = useRef<Mesh>(null);

  const circuit = useMemo(
    () => generateCircuit(scaledCount(BASE_OUT_PATHS, tier), scaledCount(BASE_DIE_PATHS, tier)),
    [tier],
  );

  const geometry = useMemo(() => {
    const base = new PlaneGeometry(1, 1);
    const g = new InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    g.setAttribute('aA', new InstancedBufferAttribute(circuit.a, 2));
    g.setAttribute('aB', new InstancedBufferAttribute(circuit.b, 2));
    g.setAttribute('aDist', new InstancedBufferAttribute(circuit.dist, 1));
    g.setAttribute('aWidth', new InstancedBufferAttribute(circuit.width, 1));
    g.setAttribute('aSeed', new InstancedBufferAttribute(circuit.seed, 1));
    g.setAttribute('aY', new InstancedBufferAttribute(circuit.y, 1));
    g.instanceCount = circuit.count;
    return g;
  }, [circuit]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        // The XY quad is mapped onto XZ (y → z), which mirrors its winding.
        side: DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uIntensity: { value: 1 },
          uMaxDist: { value: 1 },
          uCursor: { value: new Vector2(99, 99) },
          uCursorActive: { value: 0 },
          uBase: { value: new Color(readToken('--color-text-muted', 'gray')).multiplyScalar(0.55) },
          uSignal: { value: new Color(readToken('--color-signal', 'cyan')) },
          uPulse: { value: new Color(readToken('--color-pulse', 'purple')) },
        },
      }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  const scratch = useMemo(
    () => ({ raycaster: new Raycaster(), plane: new Plane(new Vector3(0, 1, 0), -0.1), hit: new Vector3() }),
    [],
  );
  const fine = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches, []);

  useFrame((state, delta) => {
    const u = material.uniforms;
    const { progress, reducedMotion, sceneReady } = useAppStore.getState();
    if (mesh.current) mesh.current.visible = inRenderWindow(progress, sceneReady, TRACES_WINDOW);
    u.uTime!.value = reducedMotion ? 0 : state.clock.elapsedTime;
    u.uMaxDist!.value = circuit.maxDist;
    // Draw outward during the dive; fade once the camera has passed through the die.
    u.uReveal!.value = reducedMotion ? (progress > 0.06 ? 1 : 0) : remap01(progress, 0.03, 0.15);
    u.uIntensity!.value = 1 - remap01(progress, 0.215, 0.25);

    scratch.raycaster.setFromCamera(state.pointer, state.camera);
    const hit = scratch.raycaster.ray.intersectPlane(scratch.plane, scratch.hit);
    const cursor = u.uCursor!.value as Vector2;
    if (hit && mesh.current) {
      mesh.current.worldToLocal(hit);
      cursor.x = damp(cursor.x, hit.x, 12, delta);
      cursor.y = damp(cursor.y, hit.z, 12, delta);
    }
    const inDie = progress > 0.06 && progress < 0.23;
    u.uCursorActive!.value = damp(u.uCursorActive!.value as number, fine && hit && inDie ? 1 : 0, 4, delta);
  });

  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} />;
}
