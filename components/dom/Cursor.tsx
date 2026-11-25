'use client';

import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { cx } from '@/lib/utils';

const INTERACTIVE = 'a, button, [role="button"], summary, [data-cursor]';

/**
 * Dot + lagging ring for fine pointers. The ring grows over interactive elements
 * and shows a label (VIEW / OPEN / COPY) from data-cursor, or from a hovered 3D
 * object via the store. Text keeps the native I-beam for selection; touch and
 * coarse pointers never mount it.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const sceneLabel = useAppStore((s) => s.cursorLabel);

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    // Development only: ?pointer=fine forces the cursor for headless QA.
    const forced =
      process.env.NODE_ENV === 'development' && new URLSearchParams(window.location.search).get('pointer') === 'fine';
    const update = (): void => setEnabled(forced || query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!enabled || !dot.current || !ring.current) return;
    document.documentElement.classList.add('has-custom-cursor');
    const reduced = useAppStore.getState().reducedMotion;
    const dotX = gsap.quickTo(dot.current, 'x', { duration: 0.08, ease: 'power3.out' });
    const dotY = gsap.quickTo(dot.current, 'y', { duration: 0.08, ease: 'power3.out' });
    const ringX = gsap.quickTo(ring.current, 'x', { duration: reduced ? 0.01 : 0.45, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring.current, 'y', { duration: reduced ? 0.01 : 0.45, ease: 'power3.out' });

    const onMove = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      setVisible(true);
    };
    const onOver = (e: PointerEvent): void => {
      const target = (e.target as Element | null)?.closest?.(INTERACTIVE);
      setActive(Boolean(target));
      setLabel(target?.getAttribute('data-cursor') ?? null);
    };
    const onLeave = (): void => setVisible(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;
  const shown = label ?? sceneLabel;
  const grown = active || Boolean(shown);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70]">
      <div
        ref={ring}
        className="absolute left-0 top-0 transition-opacity duration-[var(--duration-micro)]"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {/* A labelled ring moves off to the lower-right so it never covers the target's text. */}
        <div
          className={cx(
            'transition-transform duration-[var(--duration-ui)] ease-[var(--ease-expo-out)]',
            shown ? 'translate-x-10 translate-y-10' : 'translate-x-0 translate-y-0',
          )}
        >
          <div
            className={cx(
              'label-mono flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-on-signal',
              'transition-[translate,scale,background-color,border-color] duration-[var(--duration-ui)] ease-[var(--ease-expo-out)]',
              'size-16',
              shown ? 'scale-100 border-signal bg-signal' : grown ? 'scale-75 border-signal bg-transparent' : 'scale-50 border-text-muted bg-transparent',
            )}
          >
            <span className={cx('transition-opacity duration-[var(--duration-micro)]', shown ? 'opacity-100' : 'opacity-0')}>
              {shown}
            </span>
          </div>
        </div>
      </div>
      <div
        ref={dot}
        className="absolute left-0 top-0 transition-opacity duration-[var(--duration-micro)]"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <div className="size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal" />
      </div>
    </div>
  );
}
