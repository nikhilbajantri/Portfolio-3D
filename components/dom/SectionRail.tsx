'use client';

import { useEffect, useRef } from 'react';
import { SECTIONS, type SectionId } from '@/content/data';
import { adjacentSection, isEditableTarget, sectionStart } from '@/lib/a11y';
import { getScroll } from '@/lib/scroll';
import { useAppStore } from '@/lib/store';
import { cx } from '@/lib/utils';

function jumpTo(id: SectionId): void {
  getScroll()?.scrollToProgress(sectionStart(id), useAppStore.getState().reducedMotion);
}

/**
 * Right-edge journey rail: BOOT · DIE · STUDIO · AUTH · DATA · KERNEL · EXIT.
 * Also owns section keyboard navigation (Arrow / Page / Home / End).
 */
export function SectionRail() {
  const active = useAppStore((s) => s.activeSection);
  const fill = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  // Progress fill, written without re-rendering.
  useEffect(
    () =>
      useAppStore.subscribe(
        (s) => s.progress,
        (progress) => {
          if (fill.current) fill.current.style.transform = `scaleY(${progress})`;
          if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
        },
        { fireImmediately: true },
      ),
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isEditableTarget(e.target)) return;
      const { activeSection, progress, overlay } = useAppStore.getState();
      if (overlay.slug) return;
      let target: SectionId | null = null;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') target = adjacentSection(activeSection, progress, 1);
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') target = adjacentSection(activeSection, progress, -1);
      else if (e.key === 'Home') target = SECTIONS[0]!.id;
      else if (e.key === 'End') target = SECTIONS[SECTIONS.length - 1]!.id;
      if (!target) return;
      e.preventDefault();
      jumpTo(target);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* Narrow screens: the copy panels are full width, so the rail collapses to a top progress bar. */}
      <span aria-hidden="true" className="js-only fixed inset-x-0 top-0 z-50 h-0.5 wide:hidden">
        <span ref={bar} className="absolute inset-0 origin-left bg-signal" style={{ transform: 'scaleX(0)' }} />
      </span>
      <nav aria-label="Journey sections" className="js-only group/rail fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 wide:block">
        <div className="relative flex items-stretch gap-3">
          <ol className="grid gap-2">
            {SECTIONS.map((section) => {
              const isActive = section.id === active;
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    aria-current={isActive ? 'location' : undefined}
                    aria-label={`${section.label}: ${section.title}`}
                    onClick={() => jumpTo(section.id)}
                    className={cx(
                      'group relative flex min-h-11 min-w-11 items-center justify-end rounded-chip px-2',
                      'transition-colors duration-[var(--duration-micro)]',
                      isActive ? 'text-signal' : 'text-text-muted hover:text-text',
                    )}
                  >
                    {/* Labels stay out of the scene until the rail is hovered or focused. */}
                    <span
                      aria-hidden="true"
                      className={cx(
                        'label-mono glass pointer-events-none absolute right-full mr-1 hidden whitespace-nowrap rounded-chip px-2 py-1 md:inline',
                        'translate-x-1 opacity-0 transition-[opacity,translate] duration-[var(--duration-micro)]',
                        'group-hover/rail:translate-x-0 group-hover/rail:opacity-100',
                        'group-focus-within/rail:translate-x-0 group-focus-within/rail:opacity-100',
                      )}
                    >
                      {section.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className={cx(
                        'h-px origin-right bg-current transition-transform duration-[var(--duration-ui)] ease-[var(--ease-quart-out)]',
                        'w-6',
                        isActive ? 'scale-x-100' : 'scale-x-50 group-hover:scale-x-75',
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ol>
          <span aria-hidden="true" className="relative w-px overflow-hidden bg-border">
            <span ref={fill} className="absolute inset-0 origin-top bg-signal" style={{ transform: 'scaleY(0)' }} />
          </span>
        </div>
      </nav>
    </>
  );
}
