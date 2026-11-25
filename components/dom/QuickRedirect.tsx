'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

/** No WebGL, blocklisted GPU, lost GPU context or preloader timeout → hand over to /quick. */
export function QuickRedirect() {
  const quickMode = useAppStore((s) => s.quickMode);
  const reason = useAppStore((s) => s.fallbackReason);
  const router = useRouter();

  useEffect(() => {
    if (quickMode) router.replace(reason ? `/quick?reason=${reason}` : '/quick');
  }, [quickMode, reason, router]);

  return null;
}
