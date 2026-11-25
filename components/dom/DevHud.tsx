'use client';

import { useAppStore } from '@/lib/store';

/** Development-only readout of the scroll pipeline and quality tier. */
export function DevHud() {
  const progress = useAppStore((s) => s.progress);
  const velocity = useAppStore((s) => s.velocity);
  const section = useAppStore((s) => s.activeSection);
  const tier = useAppStore((s) => s.qualityTier);
  const reduced = useAppStore((s) => s.reducedMotion);
  const quick = useAppStore((s) => s.quickMode);

  return (
    <output
      aria-hidden="true"
      className="glass label-mono pointer-events-none fixed right-4 bottom-4 z-50 grid gap-1 rounded-card p-3 text-text-muted"
    >
      <span>
        tier {quick ? 'none → quick view' : (tier ?? 'detecting')}
        {reduced ? ' · reduced' : ''}
      </span>
      <span>section {section}</span>
      <span>progress {progress.toFixed(3)}</span>
      <span>velocity {velocity.toFixed(3)}</span>
    </output>
  );
}
