'use client';

import { useEffect, useRef } from 'react';
import { PERSON } from '@/content/data';
import { useAppStore } from '@/lib/store';
import { cx, remap01 } from '@/lib/utils';

/**
 * BOOT hero. The h1 is real, crawlable text drawn from the first paint; once the
 * particle title has sampled it and assembled on top, the h1 fades to opacity 0
 * (it stays in the accessibility tree). Everything fades out as the dive begins.
 */
export function Hero() {
  const particleTitle = useAppStore((s) => s.particleTitle);
  const wrap = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);

  // Transient subscription: style writes on scroll without React re-renders.
  useEffect(
    () =>
      useAppStore.subscribe(
        (s) => s.progress,
        (progress) => {
          const out = remap01(progress, 0.01, 0.07);
          if (wrap.current) {
            wrap.current.style.opacity = String(1 - out);
            wrap.current.style.transform = `translate3d(0, ${-out * 16}px, 0)`;
          }
          if (cue.current) cue.current.style.opacity = String(1 - remap01(progress, 0, 0.015));
        },
        { fireImmediately: true },
      ),
    [],
  );

  return (
    <div ref={wrap} className="container-content relative flex h-full flex-col pb-8 pt-24 md:pb-12 md:pt-28">
      <p className="label-mono text-signal">
        {PERSON.title} · Co-Founder, {PERSON.company}
      </p>

      <div className="grid flex-1 place-items-center">
        <h1
          id="hero-title"
          className={cx(
            'font-display text-center text-display-xl font-semibold uppercase',
            'transition-opacity duration-[1400ms] ease-[var(--ease-quart-out)]',
            particleTitle ? 'opacity-0 delay-500' : 'opacity-100',
          )}
        >
          {PERSON.name}
        </h1>
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        {/* Narrow screens: the chip sits behind the headline, so it gets a glass panel like all copy over the scene. */}
        <div className="grid max-w-[34rem] gap-3 narrow:glass narrow:rounded-card narrow:p-4">
          <p className="font-display text-h2 font-medium">{PERSON.headline}</p>
          <p className="text-text-muted">{PERSON.subline}</p>
        </div>
        <div ref={cue} className="flex items-center gap-4 self-start md:self-end">
          <span aria-hidden="true" className="relative h-12 w-px overflow-hidden bg-border">
            <span className="animate-scroll-cue absolute inset-x-0 top-0 h-1/2 bg-signal motion-reduce:hidden" />
          </span>
          <span className="label-mono text-text-muted">Scroll to descend</span>
        </div>
      </div>
    </div>
  );
}
