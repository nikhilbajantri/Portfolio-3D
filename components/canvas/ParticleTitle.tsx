'use client';

import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  type Group,
  type PerspectiveCamera,
  type Points,
  Plane,
  Raycaster,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';
import fragmentShader from '@/shaders/particles.frag';
import vertexShader from '@/shaders/particles.vert';
import { scaledCount } from '@/lib/quality';
import { applyNarrowPullback, BOOT_POSE } from '@/lib/spline';
import { useAppStore } from '@/lib/store';
import { damp, inRenderWindow, readToken, remap01 } from '@/lib/utils';

/** HIGH-tier particle count; scaled per tier. */
const BASE_COUNT = 40_000;
/** Canvas oversampling for glyph sampling. */
const SAMPLE_SCALE = 2;
/** The title plane sits this far in front of the boot camera, between it and the chip. */
const TITLE_DISTANCE = 4.2;
/** Journey window in which the title is drawn (uScatter reaches 1 at 0.07). */
const TITLE_WINDOW: readonly [number, number] = [-1, 0.075];

interface Samples {
  targets: Float32Array;
  starts: Float32Array;
  seeds: Float32Array;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Rasterise the DOM h1 with its own computed font, then scatter `count` samples
 * over the inked pixels and map them onto a plane in front of the boot camera (in
 * the anchor group's local space), so the particles land exactly where the h1 is.
 */
async function sampleTitle(el: HTMLElement, count: number, camera: PerspectiveCamera): Promise<Samples | null> {
  // Measure only after webfonts settle, otherwise the rect belongs to the fallback font.
  await document.fonts.ready;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  const cs = getComputedStyle(el);
  const fontSize = parseFloat(cs.fontSize);
  const lineHeight = parseFloat(cs.lineHeight) || fontSize * 0.95;
  const letterSpacing = parseFloat(cs.letterSpacing) || 0;
  const font = `${cs.fontWeight} ${fontSize * SAMPLE_SCALE}px ${cs.fontFamily}`;
  // A missing local() fallback face rejects with NetworkError; the real font may still be loaded.
  await document.fonts.load(font).catch(() => undefined);

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(rect.width * SAMPLE_SCALE);
  canvas.height = Math.ceil(rect.height * SAMPLE_SCALE);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.font = font;
  ctx.letterSpacing = `${letterSpacing * SAMPLE_SCALE}px`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';

  const text = (el.textContent ?? '').toUpperCase();
  const lines = wrapLines(ctx, text, canvas.width);
  const blockTop = (rect.height - lines.length * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, (blockTop + (i + 0.5) * lineHeight) * SAMPLE_SCALE);
  });

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const inked: number[] = [];
  for (let i = 3; i < data.length; i += 4) if ((data[i] ?? 0) > 127) inked.push((i - 3) / 4);
  if (inked.length === 0) return null;

  const viewH = 2 * Math.tan((camera.fov * Math.PI) / 360) * TITLE_DISTANCE;
  const viewW = viewH * (window.innerWidth / window.innerHeight);
  const top = rect.top + window.scrollY;

  const targets = new Float32Array(count * 3);
  const starts = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const pixel = inked[Math.floor(Math.random() * inked.length)] ?? 0;
    const px = (pixel % canvas.width) + Math.random();
    const py = Math.floor(pixel / canvas.width) + Math.random();
    const sx = rect.left + px / SAMPLE_SCALE;
    const sy = top + py / SAMPLE_SCALE;
    const x = (sx / window.innerWidth - 0.5) * viewW;
    const y = (0.5 - sy / window.innerHeight) * viewH;
    targets.set([x, y, 0], i * 3);

    const angle = Math.random() * Math.PI * 2;
    const radius = 1.5 + Math.random() * 3.5;
    starts.set([x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * 0.6, -2 + Math.random() * 4], i * 3);
    seeds[i] = Math.random();
  }
  return { targets, starts, seeds };
}

export function ParticleTitle() {
  const tier = useAppStore((s) => s.qualityTier) ?? 'medium';
  const sceneReady = useAppStore((s) => s.sceneReady);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const dpr = useThree((s) => s.viewport.dpr);
  const [samples, setSamples] = useState<Samples | null>(null);
  const assembled = useRef(false);

  const count = scaledCount(BASE_COUNT, tier);

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
          uAssemble: { value: 0 },
          uScatter: { value: 0 },
          uVelocity: { value: 0 },
          uSize: { value: 7.7 },
          uPixelRatio: { value: 1 },
          uMouse: { value: new Vector2(999, 999) },
          uMouseRadius: { value: 0.55 },
          uMouseStrength: { value: 0 },
          uColor: { value: new Color(readToken('--color-text', 'white')) },
          uAccent: { value: new Color(readToken('--color-signal', 'cyan')) },
        },
      }),
    [],
  );

  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    if (samples) {
      g.setAttribute('position', new BufferAttribute(samples.targets, 3));
      g.setAttribute('aStart', new BufferAttribute(samples.starts, 3));
      g.setAttribute('aSeed', new BufferAttribute(samples.seeds, 1));
    }
    return g;
  }, [samples]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  // Sample on mount and after resizes (debounced).
  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    const run = (): void => {
      const el = document.getElementById('hero-title');
      if (!el) return;
      void sampleTitle(el, count, camera)
        .catch(() => null)
        .then((result) => {
          if (cancelled) return;
          if (result) setSamples(result);
          // Settled either way: on failure the boot continues and the DOM h1 stays visible.
          useAppStore.getState().setTitleSampled(true);
        });
    };
    const onResize = (): void => {
      window.clearTimeout(timer);
      timer = window.setTimeout(run, 250);
    };
    run();
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [count, camera]);

  // Assemble once the scene is revealed; the DOM h1 hands over as particles arrive.
  useEffect(() => {
    if (!sceneReady || !samples || assembled.current) return;
    assembled.current = true;
    useAppStore.getState().setParticleTitle(true);
    const tween = gsap.to(material.uniforms.uAssemble!, { value: 1, duration: 2.6, ease: 'expo.out', delay: 0.15 });
    return () => {
      tween.kill();
    };
  }, [sceneReady, samples, material]);

  // Scratch objects reused every frame (no allocations in the loop).
  const scratch = useMemo(
    () => ({
      raycaster: new Raycaster(),
      plane: new Plane(),
      hit: new Vector3(),
      pos: new Vector3(),
      look: new Vector3(),
      forward: new Vector3(),
    }),
    [],
  );
  const anchor = useRef<Group>(null);
  const points = useRef<Points>(null);
  const size = useThree((s) => s.size);

  // Pin the title group to the boot camera pose (same pullback the CameraRig applies).
  useLayoutEffect(() => {
    const group = anchor.current;
    if (!group) return;
    const { pos, look, forward, plane } = scratch;
    pos.copy(BOOT_POSE.pos);
    look.copy(BOOT_POSE.look);
    applyNarrowPullback(pos, look, size.width / size.height);
    group.position.copy(pos);
    // Object3D.lookAt aims +z; aim it away from the target so local −z faces it, like a camera.
    group.lookAt(forward.copy(pos).multiplyScalar(2).sub(look));
    group.updateMatrixWorld();
    forward.copy(look).sub(pos).normalize();
    plane.setFromNormalAndCoplanarPoint(forward, pos.addScaledVector(forward, TITLE_DISTANCE));
  }, [scratch, size, samples]);
  const fine = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches, []);

  useFrame((state, delta) => {
    const u = material.uniforms;
    const { progress, velocity, sceneReady } = useAppStore.getState();
    // Fully scattered past BOOT: stop paying for 40K vertices.
    if (points.current) points.current.visible = inRenderWindow(progress, sceneReady, TITLE_WINDOW);
    u.uTime!.value = state.clock.elapsedTime;
    u.uScatter!.value = remap01(progress, 0.005, 0.07);
    u.uVelocity!.value = velocity;
    u.uPixelRatio!.value = dpr;

    scratch.raycaster.setFromCamera(state.pointer, state.camera);
    const hit = scratch.raycaster.ray.intersectPlane(scratch.plane, scratch.hit);
    const mouse = u.uMouse!.value as Vector2;
    if (hit && points.current) {
      points.current.worldToLocal(hit);
      mouse.x = damp(mouse.x, hit.x, 10, delta);
      mouse.y = damp(mouse.y, hit.y, 10, delta);
    }
    const strength = fine && hit ? 1 : 0;
    u.uMouseStrength!.value = damp(u.uMouseStrength!.value as number, strength, 4, delta);
  });

  return (
    <group ref={anchor}>
      {samples ? (
        <points
          ref={points}
          position={[0, 0, -TITLE_DISTANCE]}
          geometry={geometry}
          material={material}
          frustumCulled={false}
        />
      ) : null}
    </group>
  );
}
