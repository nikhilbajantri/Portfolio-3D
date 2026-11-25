'use client';

import { Check, CircleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { cx } from '@/lib/utils';

type ToastTone = 'success' | 'neutral';

interface ToastMessage {
  id: number;
  text: string;
  tone: ToastTone;
}

interface ToastState {
  current: ToastMessage | null;
  show: (text: string, tone?: ToastTone) => void;
  clear: (id: number) => void;
}

const DISMISS_MS = 2500;
/** Must match --duration-overlay-out so the element unmounts after its exit transition. */
const EXIT_MS = 350;

let nextId = 1;

const useToastStore = create<ToastState>()((set, get) => ({
  current: null,
  show: (text, tone = 'success') => set({ current: { id: nextId++, text, tone } }),
  clear: (id) => {
    if (get().current?.id === id) set({ current: null });
  },
}));

/** Show a transient status message, e.g. toast('Copied'). */
export function toast(text: string, tone: ToastTone = 'success'): void {
  useToastStore.getState().show(text, tone);
}

/**
 * One live region for the whole app, mounted before any message so screen
 * readers register it. Messages announce politely and never take focus.
 */
export function Toaster() {
  const current = useToastStore((s) => s.current);
  const clear = useToastStore((s) => s.clear);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!current) return;
    // Enter is a CSS keyframe (toast-in); JS only schedules the faster exit.
    setLeaving(false);
    const hide = window.setTimeout(() => setLeaving(true), DISMISS_MS);
    const remove = window.setTimeout(() => clear(current.id), DISMISS_MS + EXIT_MS);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(remove);
    };
  }, [current, clear]);

  const Icon = current?.tone === 'success' ? Check : CircleAlert;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4"
    >
      {current ? (
        <p
          key={current.id}
          className={cx(
            'glass flex min-h-11 items-center gap-2 rounded-chip px-4 font-mono text-small text-text',
            'animate-toast-in transition-[opacity,translate] duration-[var(--duration-overlay-out)] ease-[var(--ease-quart-in)]',
            leaving && 'translate-y-3 opacity-0',
          )}
        >
          <Icon
            aria-hidden="true"
            strokeWidth={1.5}
            className={cx('size-4', current.tone === 'success' ? 'text-success' : 'text-signal')}
          />
          {current.text}
        </p>
      ) : null}
    </div>
  );
}
