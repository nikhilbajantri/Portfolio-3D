'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { registerRouter } from '@/lib/overlay';

/** Lets 3D objects open case studies without needing Next's router context in the canvas. */
export function CaseStudyRouter() {
  const router = useRouter();
  useEffect(() => {
    registerRouter((href) => router.push(href, { scroll: false }));
    return () => registerRouter(null);
  }, [router]);
  return null;
}
