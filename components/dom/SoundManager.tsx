'use client';

import { useEffect } from 'react';
import { playTick, playWhoosh, startSound, stopSound } from '@/lib/audio';
import { useAppStore } from '@/lib/store';

const INTERACTIVE = 'a, button, [role="button"], summary';

/**
 * Connects the sound preference to the engine. A preference restored from storage
 * waits for the first pointer or key press before starting, so sound never
 * autoplays. Ticks on hovering interactive elements; a whoosh on each section change.
 */
export function SoundManager() {
  useEffect(() => {
    let gestured = false;
    const onGesture = (): void => {
      gestured = true;
      if (useAppStore.getState().soundEnabled) void startSound();
    };
    window.addEventListener('pointerdown', onGesture, { once: true });
    window.addEventListener('keydown', onGesture, { once: true });

    const unsubscribeSound = useAppStore.subscribe(
      (s) => s.soundEnabled,
      (on) => {
        // The toggle itself is a gesture, so turning sound on from it can start at once.
        if (on && (gestured || navigator.userActivation?.isActive)) void startSound();
        else if (!on) stopSound();
      },
    );
    const unsubscribeSection = useAppStore.subscribe(
      (s) => s.activeSection,
      () => playWhoosh(),
    );
    const onOver = (e: PointerEvent): void => {
      const target = (e.target as Element | null)?.closest?.(INTERACTIVE);
      const from = (e.relatedTarget as Element | null)?.closest?.(INTERACTIVE);
      if (target && target !== from) playTick();
    };
    document.addEventListener('pointerover', onOver, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
      unsubscribeSound();
      unsubscribeSection();
      document.removeEventListener('pointerover', onOver);
      stopSound();
    };
  }, []);

  return null;
}
