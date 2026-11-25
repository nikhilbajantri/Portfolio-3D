'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { caseStudyHref, markInApp } from '@/lib/overlay';
import { cx } from '@/lib/utils';

/** Opens a case study over the scene without scrolling or remounting the journey. */
export function CaseStudyLink({
  slug,
  children = 'Case study',
  replace = false,
  className,
}: {
  slug: string;
  children?: ReactNode;
  replace?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={caseStudyHref(slug)}
      scroll={false}
      replace={replace}
      data-cursor="OPEN"
      onClick={() => {
        if (!replace) markInApp();
      }}
      className={cx(
        'group label-mono inline-flex min-h-11 w-fit items-center gap-2 text-signal',
        'transition-colors duration-[var(--duration-micro)] hover:text-text',
        className,
      )}
    >
      {children}
      <ArrowRight
        aria-hidden="true"
        strokeWidth={1.5}
        className="size-4 transition-transform duration-[var(--duration-micro)] group-hover:translate-x-1"
      />
    </Link>
  );
}
