'use client';

import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { BOOT_LOG } from '@/content/data';
import { useAppStore } from '@/lib/store';
import { cx } from '@/lib/utils';

/** Hard limit before giving up on the 3D path and handing over to Quick view. */
const TIMEOUT_MS = 8000;
const CHAR_MS = 14;
const BAR_CELLS = 10;

type Phase = 'loading' | 'welcome' | 'glitch' | 'exit' | 'done';

/** One boot-log line that types itself out (instantly under reduced motion). */
function TypedLine({ text, instant }: { text: string; instant: boolean }) {
  const [shown, setShown] = useState(instant ? text.length : 0);

  useEffect(() => {
    if (instant) {
      setShown(text.length);
      return;
    }
    const id = window.setInterval(() => {
      setShown((n) => {
        if (n >= text.length) window.clearInterval(id);
        return Math.min(text.length, n + 1);
      });
    }, CHAR_MS);
    return () => window.clearInterval(id);
  }, [text, instant]);

  const visible = text.slice(0, shown);
  const ok = visible.startsWith('[ OK ]');
  return (
    <span className="block whitespace-pre">
      {ok ? (
        <>
          <span className="text-signal">[ OK ]</span>
          {visible.slice(6)}
        </>
      ) : (
        <span className={text.startsWith('>') ? 'text-text' : undefined}>{visible}</span>
      )}
    </span>
  );
}

/**
 * Terminal preloader driven by real load stages. It never covers the hero: the
 * DOM title and headline are readable behind it from the first paint.
 */
export function Preloader() {
  const tier = useAppStore((s) => s.qualityTier);
  const canvasMounted = useAppStore((s) => s.canvasMounted);
  const assetProgress = useAppStore((s) => s.assetProgress);
  const sceneReady = useAppStore((s) => s.sceneReady);
  const quickMode = useAppStore((s) => s.quickMode);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const [phase, setPhase] = useState<Phase>('loading');
  const [display, setDisplay] = useState(0);
  const tweenTarget = useRef({ value: 0 });

  // Stage weights: GPU check 15% · three.js chunk 35% · assets → 85% · shaders compiled 100%.
  const target = sceneReady
    ? 1
    : canvasMounted
      ? 0.35 + assetProgress * 0.5
      : tier !== null
        ? 0.15
        : 0.04;

  useEffect(() => {
    const tween = gsap.to(tweenTarget.current, {
      value: target,
      duration: reducedMotion ? 0 : 0.45,
      ease: 'power2.out',
      onUpdate: () => setDisplay(tweenTarget.current.value),
    });
    return () => {
      tween.kill();
    };
  }, [target, reducedMotion]);

  // Lines unlock as stages complete; "> welcome" only once the scene is ready.
  const unlocked = [true, tier !== null, canvasMounted, canvasMounted && assetProgress >= 1, phase !== 'loading'];
  const lines = BOOT_LOG.filter((_, i) => unlocked[i]);

  // Reveal choreography.
  useEffect(() => {
    if (!sceneReady) return;
    const steps: Array<[Phase, number]> = reducedMotion
      ? [['exit', 300], ['done', 650]]
      : // Let lines unlocked together finish typing before "> welcome".
        [['welcome', 450], ['glitch', 1150], ['exit', 1410], ['done', 1760]];
    const timers = steps.map(([next, at]) => window.setTimeout(() => setPhase(next), at));
    return () => timers.forEach(window.clearTimeout);
  }, [sceneReady, reducedMotion]);

  // Hard timeout → Quick view.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!useAppStore.getState().sceneReady) useAppStore.getState().setQuickMode(true, 'timeout');
    }, TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, []);

  if (phase === 'done' || quickMode) return null;

  const pct = Math.round(display * 100);
  const filled = Math.round(display * BAR_CELLS);
  const bar = `[${'█'.repeat(filled)}${'░'.repeat(BAR_CELLS - filled)}]`;

  return (
    <div
      className={cx(
        'js-only glass fixed inset-x-4 top-20 z-30 rounded-card p-4 font-mono text-small text-text-muted md:inset-x-auto md:top-auto md:right-8 md:bottom-8 md:w-[22rem]',
        'transition-opacity duration-[var(--duration-overlay-out)] ease-[var(--ease-quart-in)]',
        phase === 'glitch' && 'animate-glitch',
        phase === 'exit' ? 'opacity-0' : 'opacity-100',
      )}
    >
      <p aria-hidden="true" className="min-h-[7.5rem] leading-6">
        {lines.map((line) => (
          <TypedLine key={line} text={line} instant={reducedMotion} />
        ))}
      </p>
      <div
        role="progressbar"
        aria-label="Loading 3D scene"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="mt-3 flex items-center justify-between border-t border-border pt-3"
      >
        <span aria-hidden="true" className="tracking-[0.08em] text-signal">
          {bar}
        </span>
        <span aria-hidden="true" className="tabular-nums text-text">
          {String(pct).padStart(3, ' ')}%
        </span>
      </div>
    </div>
  );
}
