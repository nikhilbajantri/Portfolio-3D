'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  DoubleSide,
  EdgesGeometry,
  type Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LineBasicMaterial,
  type Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector4,
} from 'three';
import candlesFrag from '@/shaders/candles.frag';
import candlesVert from '@/shaders/candles.vert';
import monolithFrag from '@/shaders/monolith.frag';
import monolithVert from '@/shaders/monolith.vert';
import terrainFrag from '@/shaders/terrain.frag';
import terrainVert from '@/shaders/terrain.vert';
import { REGRESSORS, RESTAURANT_MODEL_SCORES, RESTAURANT_SCORE_METRIC, type RegressorName } from '@/content/data';
import { useLabel } from '@/lib/labels';
import { useAppStore } from '@/lib/store';
import { inRenderWindow, readToken, remap01 } from '@/lib/utils';

/** World origin of the DATA layer; everything below is local to it. */
export const DATA_ORIGIN = [2.2, -46.6, -2] as const;
const FIELD = { width: 10, depth: 6, segX: 320, segZ: 80 };
const CANDLES = 40;
const CANDLE_W = 0.13;
const RIDGE_X0 = -2.4;
const RIDGE_Z = -0.6;
const RIDGE_HALF = 0.8;
const RIDGE_H = 1.6;
/** Candle body and wick thickness (world units); order-block zone depth. */
const CANDLE_BODY = 0.085;
const CANDLE_WICK = 0.014;
const ZONE_DEPTH = 0.5;
const MONOLITH = { spacing: 0.5, x0: -1.0, z: 1.2, width: 0.3, maxHeight: 1.9 };

/** Rendering window for the layer (journey progress). */
const VISIBLE: readonly [number, number] = [0.53, 0.84];
/** Beats: monoliths rise, then the field morphs into the SMC ridge. */
const RISE: readonly [number, number] = [0.595, 0.64];
const MORPH: readonly [number, number] = [0.665, 0.705];

/* ───────────────────────── SMC illustration ───────────────────────── */

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * A fixed illustration of the Smart Money Concepts pattern SMC PRO detects (not
 * market data): range, decline to a swing low, bounce, a sweep of that low,
 * then a bullish displacement away from the last bearish candle (the order block).
 */
function buildCandles(): { candles: Candle[]; sweepLow: number; sweepFrom: number; sweepAt: number; blocks: Array<{ index: number; bullish: boolean }> } {
  const closes = [
    0.55, 0.57, 0.54, 0.58, 0.56, 0.59, 0.57, 0.6, 0.58, 0.61, // range
    0.56, 0.52, 0.5, 0.45, 0.42, 0.4, 0.36, 0.33, 0.31, 0.29, // decline to swing low
    0.33, 0.36, 0.39, 0.42, 0.44, 0.43, 0.41, // bounce
    0.38, 0.35, 0.36, 0.31, // drift down; index 30 sweeps the low
    0.5, 0.56, 0.6, 0.64, 0.7, 0.73, 0.78, 0.81, 0.85, // displacement + trend
  ];
  let seed = 11;
  const rand = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const candles: Candle[] = closes.map((close, i) => {
    const open = i === 0 ? close - 0.02 : closes[i - 1]!;
    const top = Math.max(open, close);
    const bottom = Math.min(open, close);
    return { open, close, high: top + 0.01 + rand() * 0.03, low: bottom - 0.01 - rand() * 0.03 };
  });
  const sweepFrom = 19;
  const sweepAt = 30;
  const sweepLow = candles[sweepFrom]!.low;
  // The sweep candle wicks clearly below the prior low, then closes back above it.
  candles[sweepAt]!.low = sweepLow - 0.06;
  candles[sweepAt]!.open = 0.36;
  return { candles, sweepLow, sweepFrom, sweepAt, blocks: [{ index: 9, bullish: false }, { index: sweepAt, bullish: true }] };
}

const candleX = (i: number): number => RIDGE_X0 + (i + 0.5) * CANDLE_W;

/* ───────────────────────── Pieces ───────────────────────── */

function Terrain({ candles }: { candles: Candle[] }) {
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(FIELD.width, FIELD.depth, FIELD.segX, FIELD.segZ);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: terrainVert,
        fragmentShader: terrainFrag,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        uniforms: {
          uMorph: { value: 0 },
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uCandles: { value: candles.map((c) => new Vector4(c.open, c.high, c.low, c.close)) },
          uRidgeX: { value: new Vector2(RIDGE_X0, CANDLE_W) },
          uRidgeZ: { value: new Vector2(RIDGE_Z, RIDGE_HALF) },
          uRidgeHeight: { value: RIDGE_H },
          uGrid: { value: new Vector2(FIELD.width * 5, FIELD.depth * 5) },
          uLine: { value: new Color(readToken('--color-text-muted', 'gray')).multiplyScalar(0.5) },
          uSignal: { value: new Color(readToken('--color-signal', 'cyan')) },
          uPulse: { value: new Color(readToken('--color-pulse', 'purple')) },
        },
      }),
    [candles],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state) => {
    const { progress, reducedMotion } = useAppStore.getState();
    const u = material.uniforms;
    u.uTime!.value = reducedMotion ? 0 : state.clock.elapsedTime;
    u.uReveal!.value = remap01(progress, 0.57, 0.61) * (1 - remap01(progress, 0.76, 0.8));
    u.uMorph!.value = remap01(progress, MORPH[0], MORPH[1]);
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

function monolithHeights(): number[] {
  const scores = REGRESSORS.map((name) => RESTAURANT_MODEL_SCORES[name]);
  const known = scores.filter((s): s is number => s !== null);
  // Until real scores exist every column is the same height, so nothing is implied.
  if (known.length !== scores.length) return scores.map(() => MONOLITH.maxHeight * 0.7);
  const best = Math.max(...known.map(Math.abs), 1e-6);
  return known.map((s) => Math.max(0.08, (Math.max(s, 0) / best) * MONOLITH.maxHeight));
}

function MonolithLabel({ name, x }: { name: RegressorName; x: number }) {
  const score = RESTAURANT_MODEL_SCORES[name];
  const text = score === null ? name : `${name} · ${RESTAURANT_SCORE_METRIC ? `${RESTAURANT_SCORE_METRIC} ` : ''}${score}`;
  const color = useMemo(() => readToken('--color-text', 'white'), []);
  const label = useLabel(text, { color, size: 40 });
  useFrame(() => {
    if (!label) return;
    const { progress } = useAppStore.getState();
    label.material.opacity = remap01(progress, RISE[0] + 0.02, RISE[1]) * (1 - remap01(progress, MORPH[0] - 0.01, MORPH[0] + 0.015));
  });
  if (!label) return null;
  const h = 0.085;
  return (
    <mesh position={[x, 0.02, MONOLITH.z + 0.36]} rotation={[-0.5, 0, 0]} material={label.material}>
      <planeGeometry args={[h * label.aspect, h]} />
    </mesh>
  );
}

function Monoliths() {
  const { geometry, material } = useMemo(() => {
    const heights = monolithHeights();
    const offsets = new Float32Array(REGRESSORS.length * 3);
    const hs = new Float32Array(REGRESSORS.length);
    const seeds = new Float32Array(REGRESSORS.length);
    REGRESSORS.forEach((_, i) => {
      offsets.set([MONOLITH.x0 + i * MONOLITH.spacing, 0, MONOLITH.z], i * 3);
      hs[i] = heights[i] ?? 1;
      seeds[i] = i / REGRESSORS.length;
    });
    const base = new BoxGeometry(MONOLITH.width, 1, MONOLITH.width);
    const g = new InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    g.setAttribute('normal', base.getAttribute('normal'));
    g.setAttribute('aOffset', new InstancedBufferAttribute(offsets, 3));
    g.setAttribute('aHeight', new InstancedBufferAttribute(hs, 1));
    g.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 1));
    g.instanceCount = REGRESSORS.length;
    const m = new ShaderMaterial({
      vertexShader: monolithVert,
      fragmentShader: monolithFrag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uRise: { value: 0 },
        uReveal: { value: 0 },
        uBase: { value: new Color(readToken('--color-surface-2', 'black')) },
        uSignal: { value: new Color(readToken('--color-signal', 'cyan')) },
      },
    });
    return { geometry: g, material: m };
  }, []);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(() => {
    const { progress } = useAppStore.getState();
    // Rise for the regression beat, sink back into the field as it morphs.
    const rise = remap01(progress, RISE[0], RISE[1]) * (1 - remap01(progress, MORPH[0] - 0.01, MORPH[1] - 0.01));
    material.uniforms.uRise!.value = rise;
    // Fully sunk columns would leave their caps on the floor, so fade with the rise.
    material.uniforms.uReveal!.value = remap01(rise, 0, 0.08);
  });

  return (
    <>
      <mesh geometry={geometry} material={material} frustumCulled={false} />
      {REGRESSORS.map((name, i) => (
        <MonolithLabel key={name} name={name} x={MONOLITH.x0 + i * MONOLITH.spacing} />
      ))}
    </>
  );
}

function OrderBlock({ from, low, high, bullish }: { from: number; low: number; high: number; bullish: boolean }) {
  const color = useMemo(() => new Color(readToken(bullish ? '--color-signal' : '--color-pulse', 'cyan')), [bullish]);
  const x0 = candleX(from) - CANDLE_W / 2;
  const x1 = RIDGE_X0 + CANDLES * CANDLE_W;
  const { fill, edges, box } = useMemo(() => {
    const geometry = new BoxGeometry(x1 - x0, Math.max(0.02, (high - low) * RIDGE_H), ZONE_DEPTH);
    return {
      box: geometry,
      edges: new EdgesGeometry(geometry),
      fill: new MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }),
    };
  }, [color, x0, x1, low, high]);
  const line = useMemo(
    () => new LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }),
    [color],
  );
  useEffect(
    () => () => {
      box.dispose();
      edges.dispose();
      fill.dispose();
      line.dispose();
    },
    [box, edges, fill, line],
  );
  useFrame((state) => {
    const { progress, reducedMotion } = useAppStore.getState();
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    const on = remap01(progress, MORPH[1], MORPH[1] + 0.02) * (1 - remap01(progress, 0.755, 0.78));
    fill.opacity = on * (0.2 + Math.sin(t * 2 + from) * 0.05);
    line.opacity = on;
  });
  return (
    <group position={[(x0 + x1) / 2, ((low + high) / 2) * RIDGE_H, RIDGE_Z - ZONE_DEPTH / 2]}>
      <mesh geometry={box} material={fill} />
      <lineSegments geometry={edges} material={line} />
    </group>
  );
}

function LiquiditySweep({ low, from, at }: { low: number; from: number; at: number }) {
  const color = useMemo(() => new Color(readToken('--color-signal', 'cyan')), []);
  const lineMat = useMemo(
    () => new MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending }),
    [color],
  );
  const glow = useRef<Mesh>(null);
  const colors = useMemo(() => ({ text: readToken('--color-text', 'white'), plate: readToken('--color-surface', 'black') }), []);
  const label = useLabel('Liquidity sweep', { color: colors.text, size: 44, plate: colors.plate });
  const obLabel = useLabel('Order block', { color: colors.text, size: 44, plate: colors.plate });
  useEffect(() => () => lineMat.dispose(), [lineMat]);

  const x0 = candleX(from);
  const x1 = candleX(at);
  const y = low * RIDGE_H;
  const z = RIDGE_Z + CANDLE_BODY + 0.08;

  useFrame((state) => {
    const { progress, reducedMotion } = useAppStore.getState();
    const on = remap01(progress, MORPH[1] - 0.005, MORPH[1] + 0.015) * (1 - remap01(progress, 0.755, 0.78));
    lineMat.opacity = on * 0.9;
    if (label) label.material.opacity = on;
    if (obLabel) obLabel.material.opacity = on;
    if (glow.current) {
      const t = reducedMotion ? 1 : (state.clock.elapsedTime * 0.35) % 1;
      glow.current.position.x = x0 + (x1 - x0) * t;
      glow.current.visible = on > 0.01;
    }
  });

  const h = 0.13;
  return (
    <group position={[0, y, z]}>
      <mesh position={[(x0 + x1) / 2, 0, 0]} material={lineMat}>
        <boxGeometry args={[x1 - x0, 0.008, 0.008]} />
      </mesh>
      <mesh ref={glow} material={lineMat}>
        <sphereGeometry args={[0.03, 12, 12]} />
      </mesh>
      {label ? (
        // Labels draw last, on their own plates, so bright candles never wash them out.
        <mesh position={[x0 + (h * label.aspect) / 2, -0.14, 0]} material={label.material} renderOrder={10}>
          <planeGeometry args={[h * label.aspect, h]} />
        </mesh>
      ) : null}
      {obLabel ? (
        <mesh position={[x1 + 0.1 + (h * obLabel.aspect) / 2, 0.3, 0.02]} material={obLabel.material} renderOrder={10}>
          <planeGeometry args={[h * obLabel.aspect, h]} />
        </mesh>
      ) : null}
    </group>
  );
}

/** Instanced candlesticks (bodies + wicks) standing on the price ridge. */
function Candles({ candles }: { candles: Candle[] }) {
  const parts = useMemo(() => {
    const colors = { signal: new Color(readToken('--color-signal', 'cyan')), pulse: new Color(readToken('--color-pulse', 'purple')) };
    const build = (wick: boolean) => {
      const n = candles.length;
      const xs = new Float32Array(n);
      const bottoms = new Float32Array(n);
      const tops = new Float32Array(n);
      const ups = new Float32Array(n);
      const index = new Float32Array(n);
      candles.forEach((c, i) => {
        xs[i] = candleX(i);
        bottoms[i] = (wick ? c.low : Math.min(c.open, c.close)) * RIDGE_H;
        tops[i] = (wick ? c.high : Math.max(c.open, c.close)) * RIDGE_H;
        ups[i] = c.close >= c.open ? 1 : 0;
        index[i] = i;
      });
      const base = new BoxGeometry(1, 1, 1);
      const g = new InstancedBufferGeometry();
      g.index = base.index;
      g.setAttribute('position', base.getAttribute('position'));
      g.setAttribute('normal', base.getAttribute('normal'));
      g.setAttribute('aX', new InstancedBufferAttribute(xs, 1));
      g.setAttribute('aBottom', new InstancedBufferAttribute(bottoms, 1));
      g.setAttribute('aTop', new InstancedBufferAttribute(tops, 1));
      g.setAttribute('aUp', new InstancedBufferAttribute(ups, 1));
      g.setAttribute('aIndex', new InstancedBufferAttribute(index, 1));
      g.instanceCount = n;
      const size = wick ? CANDLE_WICK : CANDLE_BODY;
      const m = new ShaderMaterial({
        vertexShader: candlesVert,
        fragmentShader: candlesFrag,
        transparent: true,
        uniforms: {
          uGrow: { value: 0 },
          uCount: { value: n },
          uWidth: { value: size },
          uDepth: { value: size },
          uZ: { value: RIDGE_Z },
          uReveal: { value: 0 },
          uWick: { value: wick ? 1 : 0 },
          uSignal: { value: colors.signal },
          uPulse: { value: colors.pulse },
        },
      });
      return { geometry: g, material: m };
    };
    return [build(false), build(true)] as const;
  }, [candles]);

  useEffect(
    () => () => {
      for (const part of parts) {
        part.geometry.dispose();
        part.material.dispose();
      }
    },
    [parts],
  );

  useFrame(() => {
    const { progress } = useAppStore.getState();
    const grow = remap01(progress, MORPH[0] + 0.01, MORPH[1] + 0.015);
    const reveal = remap01(progress, MORPH[0] + 0.005, MORPH[0] + 0.02) * (1 - remap01(progress, 0.755, 0.78));
    for (const { material } of parts) {
      material.uniforms.uGrow!.value = grow;
      material.uniforms.uReveal!.value = reveal;
    }
  });

  return (
    <>
      {parts.map(({ geometry, material }, i) => (
        <mesh key={i} geometry={geometry} material={material} frustumCulled={false} />
      ))}
    </>
  );
}

/**
 * DATA TERRAIN: six regression monoliths rise from a data landscape (Restaurant
 * Rating Prediction), then the field morphs into a price ridge under instanced
 * candlesticks, with order blocks and a liquidity sweep (SMC PRO).
 */
export function DataTerrain() {
  const group = useRef<Group>(null);
  const smc = useMemo(buildCandles, []);

  useFrame(() => {
    if (!group.current) return;
    const { progress, sceneReady } = useAppStore.getState();
    group.current.visible = inRenderWindow(progress, sceneReady, VISIBLE);
  });

  return (
    <group ref={group} position={DATA_ORIGIN}>
      <Terrain candles={smc.candles} />
      <Monoliths />
      <Candles candles={smc.candles} />
      {smc.blocks.map(({ index, bullish }) => {
        const c = smc.candles[index]!;
        return (
          <OrderBlock
            key={index}
            from={index}
            low={Math.min(c.open, c.close)}
            high={Math.max(c.open, c.close)}
            bullish={bullish}
          />
        );
      })}
      <LiquiditySweep low={smc.sweepLow} from={smc.sweepFrom} at={smc.sweepAt} />
    </group>
  );
}
