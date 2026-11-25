'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { getScroll } from '@/lib/scroll';
import { useAppStore } from '@/lib/store';
import { cx, remap01 } from '@/lib/utils';

/** Fade length at each end of a panel's window, in journey progress. */
const FADE = 0.018;

/**
 * Glass copy panel tied to a journey window [from, to]. Opacity and a small lift
 * follow the scrubbed progress (no re-renders). Faded panels ignore the pointer;
 * if keyboard focus lands inside one, the journey scrolls to its window so Tab
 * order and what is on screen stay in step.
 */
export function SectionPanel({
  from,
  to,
  className,
  labelledBy,
  children,
}: {
  from: number;
  to: number;
  className?: string;
  labelledBy?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      useAppStore.subscribe(
        (s) => s.progress,
        (progress) => {
          const el = ref.current;
          if (!el) return;
          const enter = remap01(progress, from, from + FADE);
          const exit = 1 - remap01(progress, to - FADE, to);
          const o = Math.min(enter, exit);
          el.style.opacity = String(o);
          el.style.transform = useAppStore.getState().reducedMotion ? '' : `translate3d(0, ${(1 - enter) * 16}px, 0)`;
          el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
        },
        { fireImmediately: true },
      ),
    [from, to],
  );

  return (
    <div
      ref={ref}
      role="group"
      aria-labelledby={labelledBy}
      // Focusable so keyboard users can scroll a docked phone panel, and so Tab steps
      // through the journey panel by panel (focus scrolls to the panel's window).
      tabIndex={0}
      onFocus={() => {
        const { progress } = useAppStore.getState();
        if (progress < from || progress > to) getScroll()?.scrollToProgress(from + FADE * 1.5);
      }}
      className={cx(
        'section-panel glass content-start self-start rounded-card p-6 opacity-0 md:p-8 [grid-area:1/1]',
        // Narrow screens: docked in the lower half, scrolling internally (chaining on to the page).
        'max-h-[calc(56svh-1rem)] overflow-y-auto wide:max-h-none wide:overflow-visible',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Sticky stage that stacks a section's panels in one grid cell: the left column on
 * desktop, the lower half of the screen on phones (the scene sits above it). It is
 * zero-height so it stays pinned for the whole section; the panels overflow it
 * visibly and cross-fade by progress.
 */
export function PanelStage({ children }: { children: ReactNode }) {
  return (
    <div className="panel-stage container-content pointer-events-none sticky top-[44svh] h-0 wide:top-28">
      <div className="pointer-events-none grid w-full max-w-[34rem] [&>*]:pointer-events-auto">{children}</div>
    </div>
  );
}
