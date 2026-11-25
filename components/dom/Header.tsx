import { FileDown } from 'lucide-react';
import Link from 'next/link';
import { ModeToggle } from '@/components/dom/ModeToggle';
import { SoundToggle } from '@/components/dom/SoundToggle';
import { CONTACT, PERSON } from '@/content/data';
import { RESUME_AVAILABLE } from '@/lib/server';

/** Persistent mini header: home mark, Quick view toggle, Résumé, Sound. */
export function Header({ mode }: { mode: '3d' | 'quick' }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-linear-to-b from-bg via-bg/80 to-transparent">
      <a
        href="#main"
        className="sr-only-focusable glass label-mono left-4 top-4 z-50 inline-flex min-h-11 items-center rounded-chip px-4 text-text"
      >
        Skip to content
      </a>
      <div className="container-content flex h-16 items-center justify-between gap-2 md:h-20">
        <Link
          href={mode === 'quick' ? '/quick' : '/'}
          aria-label={`NB, ${PERSON.name}, home`}
          className="font-display inline-flex size-11 items-center justify-center rounded-chip border border-border text-body font-semibold tracking-display transition-colors duration-[var(--duration-micro)] hover:border-signal hover:text-signal"
        >
          NB
        </Link>
        <nav aria-label="Site" className="glass flex items-center gap-2 rounded-card p-1">
          <ModeToggle mode={mode} />
          {RESUME_AVAILABLE ? (
            <a
              href={CONTACT.resume}
              download
              data-cursor="OPEN"
              className="label-mono inline-flex min-h-11 items-center gap-2 rounded-chip border border-transparent px-3 text-text transition-colors duration-[var(--duration-micro)] hover:border-border hover:text-signal"
            >
              <FileDown aria-hidden="true" strokeWidth={1.5} className="size-4" />
              Résumé
            </a>
          ) : null}
          <SoundToggle />
        </nav>
      </div>
    </header>
  );
}
