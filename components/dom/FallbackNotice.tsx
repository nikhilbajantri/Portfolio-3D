'use client';

import { Info } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const MESSAGES: Record<string, string> = {
  'no-webgl': 'This browser has WebGL turned off, so you are seeing the Quick view instead of the 3D journey.',
  timeout: 'The 3D journey took too long to load, so you are seeing the Quick view instead.',
  'context-lost': 'The graphics context was lost, so the 3D journey switched to the Quick view.',
};

/** Explains an automatic hand-over from the 3D journey (set by QuickRedirect). */
export function FallbackNotice() {
  const reason = useSearchParams().get('reason');
  const message = reason ? MESSAGES[reason] : undefined;
  if (!message) return null;
  return (
    <p role="status" className="glass flex items-start gap-3 rounded-card p-4 text-small">
      <Info aria-hidden="true" strokeWidth={1.5} className="mt-0.5 size-4 shrink-0 text-signal" />
      {message}
    </p>
  );
}
