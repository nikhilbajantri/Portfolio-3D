'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { cx, safeStorageGet, safeStorageSet } from '@/lib/utils';

const STORAGE_KEY = 'nb:sound';

/** Sound is off by default; the choice persists per browser when storage is available. */
export function SoundToggle({ className }: { className?: string }) {
  const enabled = useAppStore((s) => s.soundEnabled);
  const setEnabled = useAppStore((s) => s.setSoundEnabled);

  useEffect(() => {
    if (safeStorageGet(STORAGE_KEY) === 'on') setEnabled(true);
  }, [setEnabled]);

  const Icon = enabled ? Volume2 : VolumeX;

  return (
    <button
      type="button"
      aria-pressed={enabled}
      aria-label={enabled ? 'Sound on. Turn sound off' : 'Sound off. Turn sound on'}
      onClick={() => {
        const next = !enabled;
        setEnabled(next);
        safeStorageSet(STORAGE_KEY, next ? 'on' : 'off');
      }}
      className={cx(
        'inline-flex size-11 items-center justify-center rounded-chip border border-transparent text-text-muted',
        'transition-colors duration-[var(--duration-micro)] hover:border-border hover:text-text',
        enabled && 'text-signal',
        className,
      )}
    >
      <Icon aria-hidden="true" strokeWidth={1.5} className="size-5" />
    </button>
  );
}
