'use client';

import { lazy, Suspense } from 'react';

// Development only, and only with ?perf in the URL: never part of a production bundle path.
const Perf = lazy(() => import('r3f-perf').then((m) => ({ default: m.Perf })));

/** r3f-perf overlay (FPS, draw calls, GPU time) for tuning instance counts. */
export function PerfOverlay() {
  if (process.env.NODE_ENV !== 'development') return null;
  if (typeof window === 'undefined' || !new URLSearchParams(window.location.search).has('perf')) return null;
  return (
    <Suspense fallback={null}>
      <Perf position="bottom-left" minimal={false} />
    </Suspense>
  );
}
