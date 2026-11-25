'use client';

import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/_-';
const DURATION_MS = 600;

/**
 * Mono label that scrambles and decodes left to right (≤ 600ms) each time the
 * journey enters [from, to]. Screen readers only ever get the final text.
 */
export function DecodeText({ text, from, to, className }: { text: string; from: number; to: number; className?: string }) {
  const visual = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Runs on gsap.ticker, the site's single animation frame loop.
    let step: (() => void) | null = null;
    const stop = (): void => {
      if (step) gsap.ticker.remove(step);
      step = null;
    };
    const run = (): void => {
      stop();
      const el = visual.current;
      if (!el) return;
      if (useAppStore.getState().reducedMotion) {
        el.textContent = text;
        return;
      }
      const start = performance.now();
      step = (): void => {
        const t = Math.min(1, (performance.now() - start) / DURATION_MS);
        const settled = Math.floor(t * text.length);
        let out = text.slice(0, settled);
        for (let i = settled; i < text.length; i++) {
          const ch = text[i]!;
          out += ch === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        el.textContent = out;
        if (t >= 1) stop();
      };
      gsap.ticker.add(step);
    };

    const unsubscribe = useAppStore.subscribe(
      (s) => s.progress >= from && s.progress < to,
      (inside) => {
        if (inside) run();
      },
      { fireImmediately: true },
    );
    return () => {
      unsubscribe();
      stop();
    };
  }, [text, from, to]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span ref={visual} aria-hidden="true">
        {text}
      </span>
    </span>
  );
}
