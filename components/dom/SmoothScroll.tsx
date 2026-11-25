'use client';

import { useEffect } from 'react';
import { createScroll, type ScrollController } from '@/lib/scroll';
import { useAppStore } from '@/lib/store';

/** Owns the Lenis ↔ ScrollTrigger ↔ gsap.ticker pipeline for the page lifetime. */
export function SmoothScroll() {
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const { setReducedMotion } = useAppStore.getState();
    let scroll: ScrollController;

    const build = (reducedMotion: boolean): void => {
      setReducedMotion(reducedMotion);
      scroll = createScroll({ reducedMotion });
    };
    const onChange = (e: MediaQueryListEvent): void => {
      scroll.destroy();
      build(e.matches);
    };

    build(query.matches);
    query.addEventListener('change', onChange);
    return () => {
      query.removeEventListener('change', onChange);
      scroll.destroy();
    };
  }, []);

  return null;
}
