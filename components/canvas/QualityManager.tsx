'use client';

import { PerformanceMonitor } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, type ReactNode } from 'react';
import { downgrade, QUALITY } from '@/lib/quality';
import { useAppStore } from '@/lib/store';

/**
 * Runtime auto-downgrade. detect-gpu picks the starting tier; if the frame rate
 * stays below the monitor's bounds, step down one tier (never back up within a
 * session, so the scene doesn't oscillate).
 */
export function QualityManager({ children }: { children: ReactNode }) {
  const tier = useAppStore((s) => s.qualityTier) ?? 'medium';
  const setDpr = useThree((s) => s.setDpr);

  useEffect(() => {
    const [min, max] = QUALITY[tier].dpr;
    setDpr(Math.min(max, Math.max(min, window.devicePixelRatio)));
  }, [tier, setDpr]);

  return (
    <PerformanceMonitor
      bounds={(refreshRate) => (refreshRate > 90 ? [50, 90] : [45, 60])}
      flipflops={2}
      onDecline={() => {
        // Development only: a tier forced with ?quality= stays fixed for QA.
        if (process.env.NODE_ENV === 'development' && new URLSearchParams(window.location.search).has('quality')) return;
        const { qualityTier, setQualityTier } = useAppStore.getState();
        if (qualityTier && qualityTier !== 'low') setQualityTier(downgrade(qualityTier));
      }}
    >
      {children}
    </PerformanceMonitor>
  );
}
