'use client';

import { useProgress } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

/**
 * Reports real load stages to the DOM preloader:
 *   canvasMounted → assetProgress (drei useProgress) → sceneReady (shaders compiled).
 * Lives inside the Canvas so it sees the scene, camera and renderer.
 */
export function BootSequence() {
  const { active, progress, total } = useProgress();
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const titleSampled = useAppStore((s) => s.titleSampled);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const sceneReady = useAppStore((s) => s.sceneReady);

  // Development only: expose the scene graph for headless QA scripts.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    (window as unknown as { __r3f?: unknown }).__r3f = { scene, camera, gl };
  }, [scene, camera, gl]);

  useEffect(() => {
    const { setCanvasMounted } = useAppStore.getState();
    setCanvasMounted(true);
    return () => setCanvasMounted(false);
  }, []);

  const assetsDone = !active && (total === 0 || progress >= 100);

  useEffect(() => {
    useAppStore.getState().setAssetProgress(assetsDone ? 1 : progress / 100);
  }, [assetsDone, progress]);

  // Particles are skipped under reduced motion, so there is nothing to wait for.
  const contentReady = assetsDone && (titleSampled || reducedMotion);

  useEffect(() => {
    if (!contentReady || sceneReady) return;
    let cancelled = false;
    // Compile every program now so the reveal and first scroll never hitch on a
    // shader, one top-level layer at a time with a yield between, so no single
    // main-thread task links every program at once.
    const yieldToMain = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
    void (async () => {
      for (const layer of [...scene.children]) {
        if (cancelled) return;
        await gl.compileAsync(layer, camera, scene).catch(() => undefined);
        await yieldToMain();
      }
      if (!cancelled) useAppStore.getState().setSceneReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [contentReady, sceneReady, gl, scene, camera]);

  return null;
}
