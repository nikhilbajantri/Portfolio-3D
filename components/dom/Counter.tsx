'use client';

import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import type { Metric } from '@/content/data';
import { useAppStore } from '@/lib/store';

/**
 * Counts a metric up the first time the journey reaches `startAt`. Screen readers
 * get the final value only; the animated digits are hidden from them.
 */
export function Counter({ metric, startAt, className }: { metric: Metric; startAt: number; className?: string }) {
  const digits = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const value = { n: 0 };
    let tween: gsap.core.Tween | null = null;
    const render = (): void => {
      if (digits.current) digits.current.textContent = Math.round(value.n).toLocaleString('en-GB');
    };
    render();
    const unsubscribe = useAppStore.subscribe(
      (s) => s.progress >= startAt,
      (reached) => {
        if (!reached || tween) return;
        const instant = useAppStore.getState().reducedMotion;
        tween = gsap.to(value, { n: metric.value, duration: instant ? 0 : 1.6, ease: 'expo.out', onUpdate: render });
      },
      { fireImmediately: true },
    );
    return () => {
      unsubscribe();
      tween?.kill();
    };
  }, [metric.value, startAt]);

  const final = `${metric.prefix}${metric.value.toLocaleString('en-GB')}${metric.suffix}`;
  return (
    <span className={className}>
      <span className="sr-only">{final}</span>
      <span aria-hidden="true" className="tabular-nums">
        {metric.prefix}
        {/* Server-rendered as the final value (correct without JS); the effect resets it to 0 to count up. */}
        <span ref={digits}>{metric.value.toLocaleString('en-GB')}</span>
        {metric.suffix}
      </span>
    </span>
  );
}
