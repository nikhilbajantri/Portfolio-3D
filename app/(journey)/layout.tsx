import type { ReactNode } from 'react';
import { Journey } from '@/components/dom/Journey';

/**
 * Shared by "/" and "/work/[slug]": the canvas, scroll position and scene state
 * persist while case-study overlays open, switch and close on top of them.
 */
export default function JourneyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Journey />
      {children}
    </>
  );
}
