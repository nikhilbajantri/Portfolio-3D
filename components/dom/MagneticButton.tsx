'use client';

import gsap from 'gsap';
import { useEffect, useRef, type ReactNode } from 'react';
import { useAppStore } from '@/lib/store';
import { cx } from '@/lib/utils';

/** Pull is clamped so the target never leaves its own hit box. */
const MAX_STRENGTH = 0.3;

/**
 * Wraps one focal CTA. The child drifts toward the pointer (transform only) and
 * springs back on leave. Fine pointers only; off under reduced motion.
 */
export function MagneticButton({
  children,
  strength = 0.25,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const wrap = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const target = inner.current;
    if (!el || !target) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const pull = Math.min(strength, MAX_STRENGTH);
    const x = gsap.quickTo(target, 'x', { duration: 0.5, ease: 'power3.out' });
    const y = gsap.quickTo(target, 'y', { duration: 0.5, ease: 'power3.out' });

    const onMove = (e: PointerEvent): void => {
      if (useAppStore.getState().reducedMotion) return;
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * pull);
      y((e.clientY - (r.top + r.height / 2)) * pull);
    };
    const onLeave = (): void => {
      x(0);
      y(0);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [strength]);

  return (
    <span ref={wrap} className={cx('inline-flex', className)}>
      <span ref={inner} className="inline-flex will-change-transform">
        {children}
      </span>
    </span>
  );
}
