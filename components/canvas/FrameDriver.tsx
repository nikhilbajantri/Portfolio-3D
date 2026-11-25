'use client';

import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

/**
 * Renders R3F from gsap.ticker so the whole site runs on one requestAnimationFrame.
 * The Canvas uses frameloop="never"; this listener is added without priority, so it
 * always runs after the scroll tick has written fresh progress/velocity.
 *
 * Nothing is rendered until the scene is ready: before that every layer is kept
 * visible so compileAsync can see it, and the canvas is still transparent, so a
 * frame would draw the whole world for no one while blocking the main thread.
 */
export function FrameDriver() {
  const advance = useThree((s) => s.advance);

  useEffect(() => {
    const render = (): void => {
      if (useAppStore.getState().sceneReady) advance(performance.now());
    };
    gsap.ticker.add(render);
    return () => gsap.ticker.remove(render);
  }, [advance]);

  return null;
}
