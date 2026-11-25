'use client';

import { SKILLS } from '@/content/data';
import { useAppStore } from '@/lib/store';
import { cx } from '@/lib/utils';

/**
 * The 8 skill clusters as buttons. Hover or keyboard focus expands the matching
 * 3D cluster and sends a ripple through the core; the 3D hub drives this list too.
 */
export function SkillList() {
  const focus = useAppStore((s) => s.skillFocus);
  const setFocus = useAppStore((s) => s.setSkillFocus);

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {SKILLS.map((cluster) => {
        const active = focus === cluster.id;
        return (
          <li key={cluster.id}>
            <button
              type="button"
              aria-pressed={active}
              onPointerEnter={() => setFocus(cluster.id)}
              onPointerLeave={() => {
                if (useAppStore.getState().skillFocus === cluster.id) setFocus(null);
              }}
              onFocus={() => setFocus(cluster.id)}
              onBlur={() => {
                if (useAppStore.getState().skillFocus === cluster.id) setFocus(null);
              }}
              onClick={() => setFocus(active ? null : cluster.id)}
              className={cx(
                'grid min-h-11 w-full gap-1 rounded-chip border px-3 py-2 text-left',
                'transition-colors duration-[var(--duration-micro)]',
                active ? 'border-signal bg-surface-2' : 'border-border hover:border-text-muted',
              )}
            >
              <span className={cx('label-mono', active ? 'text-signal' : 'text-text-muted')}>{cluster.name}</span>
              <span className="text-small">{cluster.items.join(' · ')}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
