'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { detectQuality } from '@/lib/quality';
import { useAppStore } from '@/lib/store';
import { cx } from '@/lib/utils';

/** Reduced-motion fade between held section poses. */
const DIP_MS = 260;

// three.js and R3F load in their own chunk, after first paint.
const Experience = dynamic(() => import('@/components/canvas/Experience'), { ssr: false });

/**
 * Decides whether the 3D path runs at all. No WebGL2 or a blocklisted GPU switches
 * to Quick view; otherwise the detected tier seeds the store and the canvas mounts.
 */
export function CanvasRoot() {
  const tier = useAppStore((s) => s.qualityTier);
  const quickMode = useAppStore((s) => s.quickMode);
  const sceneReady = useAppStore((s) => s.sceneReady);
  const [eventSource, setEventSource] = useState<HTMLElement | null>(null);
  const [dip, setDip] = useState(false);

  // Reduced motion: no camera flight. Fade the canvas out, switch to the next
  // section's still pose while it is hidden, and fade back in.
  useEffect(() => {
    let timer = 0;
    const unsubscribe = useAppStore.subscribe(
      (s) => s.activeSection,
      (section) => {
        const { reducedMotion, setHeldSection } = useAppStore.getState();
        if (!reducedMotion) {
          setHeldSection(section);
          return;
        }
        setDip(true);
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          useAppStore.getState().setHeldSection(useAppStore.getState().activeSection);
          setDip(false);
        }, DIP_MS);
      },
    );
    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setEventSource(document.getElementById('app-root'));
    void detectQuality().then((result) => {
      if (cancelled) return;
      const { setQualityTier, setQuickMode } = useAppStore.getState();
      // Development only: ?quality=high|medium|low forces a tier for QA on any GPU.
      if (process.env.NODE_ENV === 'development') {
        const forced = new URLSearchParams(window.location.search).get('quality');
        if (forced === 'high' || forced === 'medium' || forced === 'low') {
          setQualityTier(forced);
          return;
        }
      }
      if (result.tier === null) setQuickMode(true, 'no-webgl');
      else setQualityTier(result.tier);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (quickMode || tier === null || eventSource === null) return null;

  return (
    <div
      aria-hidden="true"
      className={cx(
        'allow-fade pointer-events-none fixed inset-0 z-0 transition-opacity ease-[var(--ease-quart-out)]',
        dip ? 'duration-[250ms]' : 'duration-[1200ms]',
        sceneReady && !dip ? 'opacity-100' : 'opacity-0',
      )}
    >
      <Experience eventSource={eventSource} />
    </div>
  );
}
