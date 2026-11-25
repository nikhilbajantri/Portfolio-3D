'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BoxGeometry,
  CanvasTexture,
  Color,
  type Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix4,
  PlaneGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector3,
  VideoTexture,
} from 'three';
import blocksFrag from '@/shaders/blocks.frag';
import blocksVert from '@/shaders/blocks.vert';
import frameFrag from '@/shaders/frame.frag';
import frameVert from '@/shaders/frame.vert';
import { PROJECTS, SECTIONS, type Project } from '@/content/data';
import { openCaseStudy } from '@/lib/overlay';
import { QUALITY, type QualityTier } from '@/lib/quality';
import { useAppStore } from '@/lib/store';
import { damp, inRenderWindow, readToken, remap01 } from '@/lib/utils';

interface FrameSpec {
  slug: string;
  position: readonly [number, number, number];
  rotationY: number;
  width: number;
  height: number;
  bend: number;
  /** Block grid at HIGH tier. */
  cols: number;
  rows: number;
}

/** World layout of the STUDIO layer (camera keyframes in lib/spline frame these). */
export const STUDIO_FRAMES: readonly FrameSpec[] = [
  { slug: 'great-british-doner', position: [1.2, -14, -2.6], rotationY: 0, width: 2.6, height: 1.625, bend: 0.06, cols: 16, rows: 10 },
  { slug: 'olea-social', position: [3.4, -14.05, -3.0], rotationY: -0.45, width: 1.7, height: 1.0625, bend: 0.08, cols: 11, rows: 7 },
];

const [STUDIO_FROM, STUDIO_TO] = SECTIONS.find((s) => s.id === 'studio')!.range;
/** Blocks start folding up at 0.205; frames are gone by 0.445. */
const STUDIO_WINDOW: readonly [number, number] = [0.19, 0.46];
const TEX_W = 1280;
const TEX_H = 800;

/* ───────────────────────── Frame screen texture ───────────────────────── */

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || 'sans-serif';
}

function hostOf(href: string): string {
  try {
    return new URL(href).host;
  } catch {
    return '';
  }
}

/**
 * Draws a browser window whose page is built only from the project's data.ts
 * entry: used until a screen recording or poster is supplied.
 */
function drawProjectCard(project: Project): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d')!;
  const display = cssVar('--font-clash');
  const sans = cssVar('--font-plex');
  const mono = cssVar('--font-jetbrains');
  const c = {
    bg: readToken('--color-bg', 'black'),
    surface: readToken('--color-surface', 'black'),
    surface2: readToken('--color-surface-2', 'black'),
    border: readToken('--color-border', 'gray'),
    text: readToken('--color-text', 'white'),
    muted: readToken('--color-text-muted', 'gray'),
    signal: readToken('--color-signal', 'cyan'),
  };

  // Window + chrome bar.
  ctx.fillStyle = c.surface;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  ctx.fillStyle = c.surface2;
  ctx.fillRect(0, 0, TEX_W, 64);
  ctx.fillStyle = c.border;
  ctx.fillRect(0, 64, TEX_W, 2);
  [36, 64, 92].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, 32, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = c.bg;
  ctx.beginPath();
  ctx.roundRect(140, 16, TEX_W - 280, 32, 4);
  ctx.fill();
  ctx.fillStyle = c.muted;
  ctx.font = `400 18px ${mono}`;
  ctx.textBaseline = 'middle';
  const live = project.links.find((l) => l.label === 'Visit live site');
  ctx.fillText(live ? hostOf(live.href) : project.title.toLowerCase(), 160, 33);

  // Faint grid on the page body.
  ctx.strokeStyle = c.border;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  for (let x = 72; x < TEX_W; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, 66);
    ctx.lineTo(x, TEX_H);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Page content, all from data.ts.
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = c.signal;
  ctx.font = `500 20px ${mono}`;
  ctx.letterSpacing = '3px';
  ctx.fillText(project.client.toUpperCase(), 72, 170);
  ctx.letterSpacing = '-4px';
  ctx.fillStyle = c.text;
  ctx.font = `600 104px ${display}`;
  ctx.fillText(project.title, 68, 290);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = c.muted;
  ctx.font = `400 32px ${sans}`;
  ctx.fillText(project.summary, 72, 360);

  if (project.metric) {
    ctx.fillStyle = c.signal;
    ctx.font = `600 140px ${display}`;
    const value = `${project.metric.prefix}${project.metric.value.toLocaleString('en-GB')}${project.metric.suffix}`;
    ctx.fillText(value, 68, 560);
    const w = ctx.measureText(value).width;
    ctx.fillStyle = c.muted;
    ctx.font = `500 22px ${mono}`;
    ctx.letterSpacing = '3px';
    ctx.fillText(project.metric.label.toUpperCase(), 68 + w + 28, 552);
    ctx.letterSpacing = '0px';
  }

  // Stack chips.
  let x = 72;
  ctx.font = `500 20px ${mono}`;
  ctx.letterSpacing = '2px';
  for (const item of project.stack) {
    const label = item.toUpperCase();
    const w = ctx.measureText(label).width + 32;
    ctx.strokeStyle = c.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 680, w, 48);
    ctx.fillStyle = c.muted;
    ctx.fillText(label, x + 16, 711);
    x += w + 16;
  }

  // Status badge.
  if (project.badge) {
    ctx.font = `500 20px ${mono}`;
    const w = ctx.measureText(project.badge).width + 56;
    ctx.strokeStyle = c.signal;
    ctx.strokeRect(TEX_W - 72 - w, 130, w, 48);
    ctx.fillStyle = c.signal;
    ctx.beginPath();
    ctx.arc(TEX_W - 72 - w + 22, 154, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(project.badge, TEX_W - 72 - w + 38, 161);
  }
  ctx.letterSpacing = '0px';
  return canvas;
}

/** Video (MEDIUM/HIGH) → poster → data card, in that order of availability. */
function useFrameTexture(project: Project, tier: QualityTier): Texture | null {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let disposed = false;
    let current: Texture | null = null;
    let video: HTMLVideoElement | null = null;
    let unsubscribe = (): void => undefined;
    const use = (t: Texture): void => {
      if (disposed) {
        t.dispose();
        return;
      }
      t.colorSpace = SRGBColorSpace;
      current = t;
      setTexture(t);
    };

    if (project.media.video && QUALITY[tier].video) {
      video = document.createElement('video');
      video.src = project.media.video;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.preload = 'auto';
      if (project.media.poster) video.poster = project.media.poster;
      const v = video;
      // Only decode while the studio layer is on screen.
      unsubscribe = useAppStore.subscribe(
        (s) => s.progress > STUDIO_FROM - 0.03 && s.progress < STUDIO_TO + 0.03,
        (active) => {
          if (active) void v.play().catch(() => undefined);
          else v.pause();
        },
        { fireImmediately: true },
      );
      use(new VideoTexture(video));
    } else if (project.media.poster) {
      new TextureLoader().load(project.media.poster, use);
    } else {
      void document.fonts.ready.then(() => use(new CanvasTexture(drawProjectCard(project))));
    }

    return () => {
      disposed = true;
      unsubscribe();
      video?.pause();
      video?.removeAttribute('src');
      video?.load();
      current?.dispose();
    };
  }, [project, tier]);

  return texture;
}

/* ───────────────────────── Browser frame ───────────────────────── */

const SPRING = 70;
const DAMPING = 11;

function BrowserFrame({ spec, project, tier }: { spec: FrameSpec; project: Project; tier: QualityTier }) {
  const tilt = useRef<Group>(null);
  const texture = useFrameTexture(project, tier);
  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const state = useMemo(() => ({ hovered: false, tx: 0, ty: 0, rx: 0, ry: 0, vx: 0, vy: 0 }), []);

  const geometry = useMemo(() => new PlaneGeometry(spec.width, spec.height, 32, 1), [spec.width, spec.height]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: frameVert,
        fragmentShader: frameFrag,
        transparent: true,
        uniforms: {
          uMap: { value: null },
          uFocus: { value: 0.6 },
          uReveal: { value: 0 },
          uBend: { value: spec.bend },
          uEdge: { value: new Color(readToken('--color-signal', 'cyan')) },
          uSize: { value: [spec.width, spec.height] },
        },
      }),
    [spec.bend, spec.width, spec.height],
  );

  useEffect(() => {
    // Frames are seen at an angle; anisotropic filtering keeps their text legible.
    if (texture) {
      texture.anisotropy = Math.min(8, maxAnisotropy);
      texture.needsUpdate = true;
    }
    material.uniforms.uMap!.value = texture;
  }, [material, texture, maxAnisotropy]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, delta) => {
    const g = tilt.current;
    if (!g) return;
    const { progress } = useAppStore.getState();
    const reveal = remap01(progress, 0.265, 0.3) * (1 - remap01(progress, 0.41, 0.445));
    material.uniforms.uReveal!.value = reveal;
    material.uniforms.uFocus!.value = damp(material.uniforms.uFocus!.value as number, state.hovered ? 1 : 0.62, 6, delta);
    g.visible = reveal > 0.001;

    // Critically-damped-ish spring toward the cursor tilt.
    const dt = Math.min(delta, 1 / 30);
    state.vx += ((state.tx - state.rx) * SPRING - state.vx * DAMPING) * dt;
    state.vy += ((state.ty - state.ry) * SPRING - state.vy * DAMPING) * dt;
    state.rx += state.vx * dt;
    state.ry += state.vy * dt;
    g.rotation.set(state.rx, state.ry, 0);
  });

  return (
    <group position={spec.position} rotation={[0, spec.rotationY, 0]}>
      <group ref={tilt}>
        <mesh
          geometry={geometry}
          material={material}
          onPointerMove={(e) => {
            if (!e.uv || useAppStore.getState().reducedMotion) return;
            if (!state.hovered) useAppStore.getState().setCursorLabel('VIEW');
            state.hovered = true;
            state.ty = (e.uv.x - 0.5) * 0.28;
            state.tx = -(e.uv.y - 0.5) * 0.2;
          }}
          onClick={(e) => {
            e.stopPropagation();
            useAppStore.getState().setCursorLabel(null);
            openCaseStudy(project.slug);
          }}
          onPointerOut={() => {
            useAppStore.getState().setCursorLabel(null);
            state.hovered = false;
            state.tx = 0;
            state.ty = 0;
          }}
        />
      </group>
    </group>
  );
}

/* ───────────────────────── Fold-up blocks ───────────────────────── */

function Blocks({ tier }: { tier: QualityTier }) {
  const { geometry, material } = useMemo(() => {
    const density = Math.sqrt(QUALITY[tier].instanceScale);
    const starts: number[] = [];
    const targets: number[] = [];
    const sizes: number[] = [];
    const seeds: number[] = [];
    const rots: number[] = [];
    const m = new Matrix4();
    const v = new Vector3();
    let seed = 7;
    const rand = (): number => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };

    for (const spec of STUDIO_FRAMES) {
      const cols = Math.max(4, Math.round(spec.cols * density));
      const rows = Math.max(3, Math.round(spec.rows * density));
      m.makeRotationY(spec.rotationY).setPosition(spec.position[0], spec.position[1], spec.position[2]);
      const tw = spec.width / cols;
      const th = spec.height / rows;
      for (let cx = 0; cx < cols; cx++) {
        for (let cy = 0; cy < rows; cy++) {
          const lx = -spec.width / 2 + tw * (cx + 0.5);
          const ly = -spec.height / 2 + th * (cy + 0.5);
          v.set(lx, ly, spec.bend * lx * lx).applyMatrix4(m);
          targets.push(v.x, v.y, v.z);
          // Fold up out of the die area just under the chip.
          starts.push((rand() * 2 - 1) * 0.6, -0.3 - rand() * 1.2, (rand() * 2 - 1) * 0.6);
          sizes.push(tw, th);
          seeds.push(rand());
          rots.push(spec.rotationY);
        }
      }
    }

    const base = new BoxGeometry(1, 1, 1);
    const g = new InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    g.setAttribute('normal', base.getAttribute('normal'));
    g.setAttribute('aStart', new InstancedBufferAttribute(new Float32Array(starts), 3));
    g.setAttribute('aTarget', new InstancedBufferAttribute(new Float32Array(targets), 3));
    g.setAttribute('aSize', new InstancedBufferAttribute(new Float32Array(sizes), 2));
    g.setAttribute('aSeed', new InstancedBufferAttribute(new Float32Array(seeds), 1));
    g.setAttribute('aRotY', new InstancedBufferAttribute(new Float32Array(rots), 1));
    g.instanceCount = seeds.length;

    const mat = new ShaderMaterial({
      vertexShader: blocksVert,
      fragmentShader: blocksFrag,
      transparent: true,
      uniforms: {
        uAssemble: { value: 0 },
        uFade: { value: 1 },
        uBase: { value: new Color(readToken('--color-surface-2', 'black')) },
        uSignal: { value: new Color(readToken('--color-signal', 'cyan')) },
      },
    });
    return { geometry: g, material: mat };
  }, [tier]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(() => {
    const { progress } = useAppStore.getState();
    material.uniforms.uAssemble!.value = remap01(progress, 0.205, 0.29);
    material.uniforms.uFade!.value = 1 - remap01(progress, 0.285, 0.305);
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

/**
 * STUDIO LAYER: blocks fold up out of the die and snap into curved browser
 * frames for Great British Doner (hero) and Olea Social.
 */
export function StudioLayer() {
  const tier = useAppStore((s) => s.qualityTier) ?? 'medium';
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const group = useRef<Group>(null);

  useFrame(() => {
    if (!group.current) return;
    const { progress, sceneReady } = useAppStore.getState();
    group.current.visible = inRenderWindow(progress, sceneReady, STUDIO_WINDOW);
  });

  return (
    <group ref={group}>
      {reducedMotion ? null : <Blocks tier={tier} />}
      {STUDIO_FRAMES.map((spec) => {
        const project = PROJECTS.find((p) => p.slug === spec.slug);
        return project ? <BrowserFrame key={spec.slug} spec={spec} project={project} tier={tier} /> : null;
      })}
    </group>
  );
}
