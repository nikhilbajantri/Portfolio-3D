'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import { Color } from 'three';
import { BootSequence } from '@/components/canvas/BootSequence';
import { CameraRig } from '@/components/canvas/CameraRig';
import { FrameDriver } from '@/components/canvas/FrameDriver';
import { PerfOverlay } from '@/components/canvas/PerfOverlay';
import { PostFX } from '@/components/canvas/PostFX';
import { QualityManager } from '@/components/canvas/QualityManager';
import { AuthGateway } from '@/components/canvas/scenes/AuthGateway';
import { Boot } from '@/components/canvas/scenes/Boot';
import { DataTerrain } from '@/components/canvas/scenes/DataTerrain';
import { Exit } from '@/components/canvas/scenes/Exit';
import { KernelCore } from '@/components/canvas/scenes/KernelCore';
import { StudioLayer } from '@/components/canvas/scenes/StudioLayer';
import { Stars } from '@/components/canvas/Stars';
import { BOOT_POSE } from '@/lib/spline';
import { QUALITY } from '@/lib/quality';
import { useAppStore } from '@/lib/store';
import { readToken } from '@/lib/utils';

export default function Experience({ eventSource }: { eventSource: HTMLElement }) {
  const tier = useAppStore((s) => s.qualityTier) ?? 'medium';
  const background = useMemo(() => new Color(readToken('--color-bg', 'black')), []);

  return (
    <Canvas
      frameloop="never"
      dpr={QUALITY[tier].dpr as [number, number]}
      eventSource={eventSource}
      eventPrefix="client"
      camera={{ fov: 35, near: 0.1, far: 200, position: BOOT_POSE.pos.toArray() }}
      gl={{ antialias: tier !== 'low', alpha: false, powerPreference: 'high-performance', stencil: false }}
      onCreated={({ gl }) => {
        // A lost GPU context (driver reset, memory pressure) hands over to Quick view.
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          useAppStore.getState().setQuickMode(true, 'context-lost');
        });
      }}
    >
      <primitive attach="background" object={background} />
      <FrameDriver />
      <CameraRig />
      <QualityManager>
        <Suspense fallback={null}>
          <Stars />
          <Boot />
          <StudioLayer />
          <AuthGateway />
          <DataTerrain />
          <KernelCore />
          <Exit />
          <BootSequence />
        </Suspense>
        <PostFX />
        <PerfOverlay />
      </QualityManager>
    </Canvas>
  );
}
