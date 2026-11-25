'use client';

import dynamic from 'next/dynamic';

// Enhancements, not content: load after hydration so they stay out of every page's
// initial bundle (the cursor pulls in GSAP; sound lazy-loads Howler on its own).
const Cursor = dynamic(() => import('@/components/dom/Cursor').then((m) => m.Cursor), { ssr: false });
const SoundManager = dynamic(() => import('@/components/dom/SoundManager').then((m) => m.SoundManager), {
  ssr: false,
});

export function ClientExtras() {
  return (
    <>
      <Cursor />
      <SoundManager />
    </>
  );
}
