'use client';

import { Cuboid, LayoutList } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { hasWebGL2 } from '@/lib/quality';
import { cx } from '@/lib/utils';

const base =
  'inline-flex min-h-11 items-center gap-2 rounded-chip border px-3 label-mono transition-colors duration-[var(--duration-micro)]';

/**
 * Switches between the 3D journey ("/") and the 2D résumé ("/quick").
 * Going back to 3D is disabled when the browser has no WebGL2, which would
 * otherwise bounce straight back to Quick view.
 */
export function ModeToggle({ mode }: { mode: '3d' | 'quick' }) {
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    if (mode === 'quick') setWebgl(hasWebGL2());
  }, [mode]);

  if (mode === '3d') {
    return (
      <Link href="/quick" className={cx(base, 'border-border text-text hover:border-signal hover:text-signal')}>
        <LayoutList aria-hidden="true" strokeWidth={1.5} className="size-4" />
        Quick view
      </Link>
    );
  }

  if (!webgl) {
    return (
      <span
        className={cx(base, 'cursor-not-allowed border-border text-text-muted')}
        title="The 3D view needs WebGL, which this browser has turned off"
      >
        <Cuboid aria-hidden="true" strokeWidth={1.5} className="size-4" />
        3D unavailable
      </span>
    );
  }

  return (
    <Link href="/" className={cx(base, 'border-border text-text hover:border-signal hover:text-signal')}>
      <Cuboid aria-hidden="true" strokeWidth={1.5} className="size-4" />
      3D view
    </Link>
  );
}
