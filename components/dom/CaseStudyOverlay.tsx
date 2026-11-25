'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArchitectureDiagram } from '@/components/dom/ArchitectureDiagram';
import { CaseStudyLink } from '@/components/dom/CaseStudyLink';
import { ExternalLink, StackList, StatusBadge } from '@/components/dom/ProjectCard';
import { PROJECTS } from '@/content/data';
import { sectionStart, trapTab } from '@/lib/a11y';
import { isOpenedInApp, resetInApp, takeReturnFocus } from '@/lib/overlay';
import { getScroll } from '@/lib/scroll';
import { useAppStore } from '@/lib/store';
import { cx } from '@/lib/utils';

/** Must match --duration-overlay-out. */
const EXIT_MS = 350;

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-border pt-6 md:grid-cols-[11rem_1fr] md:gap-8">
      <h3 className="label-mono text-text-muted">{title}</h3>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

/**
 * Case study as a modal dialog over the blurred, dimmed journey. Esc, the close
 * button, the backdrop and the browser back button all close it; focus is trapped
 * inside, the journey behind is inert, and its scroll position is untouched.
 */
export function CaseStudyOverlay({ slug }: { slug: string }) {
  const router = useRouter();
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [closing, setClosing] = useState(false);

  const index = PROJECTS.findIndex((p) => p.slug === slug);
  const project = PROJECTS[index]!;
  const prev = PROJECTS[(index - 1 + PROJECTS.length) % PROJECTS.length]!;
  const next = PROJECTS[(index + 1) % PROJECTS.length]!;
  const { caseStudy } = project;

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    const delay = useAppStore.getState().reducedMotion ? 0 : EXIT_MS;
    window.setTimeout(() => {
      // From inside the journey, Back is the honest "close"; a deep link instead
      // replaces the URL so the visitor isn't sent away from the site.
      if (isOpenedInApp()) router.back();
      else router.replace('/', { scroll: false });
    }, delay);
  }, [closing, router]);

  // Open: lock the journey behind and take focus. Close (any route change): undo.
  useEffect(() => {
    const store = useAppStore.getState();
    const root = document.getElementById('app-root');
    // A deep link lands on the project's own layer behind the overlay.
    if (!isOpenedInApp() && store.progress === 0) {
      getScroll()?.scrollToProgress(sectionStart(project.section) + 0.03, true);
    }
    store.openOverlay(slug);
    getScroll()?.stop();
    if (root) root.inert = true;
    closeButton.current?.focus({ preventScroll: true });

    return () => {
      useAppStore.getState().closeOverlay();
      // Switching to another case study remounts an overlay straight away; only
      // restore the journey when nothing has reopened.
      window.setTimeout(() => {
        if (useAppStore.getState().overlay.slug) return;
        if (root) root.inert = false;
        getScroll()?.start();
        resetInApp();
        // Back to the link that opened it; after a deep link there is none, so <main>.
        (takeReturnFocus() ?? document.getElementById('main'))?.focus({ preventScroll: true });
      }, 0);
    };
  }, [slug, project.section]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (dialog.current) trapTab(e, dialog.current);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  const titleId = `case-${slug}-title`;

  return (
    <div className="fixed inset-0 z-[55]">
      <div
        aria-hidden="true"
        className={cx(
          'absolute inset-0 bg-scrim backdrop-blur-md animate-fade-in',
          'transition-opacity duration-[var(--duration-overlay-out)] ease-[var(--ease-quart-in)]',
          closing && 'opacity-0',
        )}
      />
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-lenis-prevent
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="absolute inset-0 overflow-y-auto overscroll-contain"
      >
        <article
          className={cx(
            'glass relative mx-auto my-0 grid max-w-5xl gap-8 rounded-none p-6 pt-20 md:my-16 md:rounded-overlay md:p-12',
            'animate-overlay-in transition-[opacity,translate] duration-[var(--duration-overlay-out)] ease-[var(--ease-quart-in)]',
            closing && 'translate-y-3 opacity-0',
          )}
        >
          <button
            ref={closeButton}
            type="button"
            onClick={close}
            aria-label="Close case study"
            className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-chip border border-border text-text transition-colors duration-[var(--duration-micro)] hover:border-signal hover:text-signal md:right-6 md:top-6"
          >
            <X aria-hidden="true" strokeWidth={1.5} className="size-5" />
          </button>

          <header className="grid gap-4 pr-12">
            <p className="label-mono text-signal">Case study · {project.client}</p>
            <div className="flex flex-wrap items-center gap-4">
              <h2 id={titleId} className="font-display text-display font-semibold">
                {project.title}
              </h2>
              <StatusBadge project={project} />
            </div>
            <p className="text-body md:text-h3">{project.summary}</p>
            {project.metric ? (
              <p className="flex items-baseline gap-3">
                <span className="font-display text-h2 font-semibold text-signal">
                  {project.metric.prefix}
                  {project.metric.value.toLocaleString('en-GB')}
                  {project.metric.suffix}
                </span>
                <span className="label-mono text-text-muted">{project.metric.label}</span>
              </p>
            ) : null}
          </header>

          <Block title="Problem">
            <p>{caseStudy.problem}</p>
          </Block>
          <Block title="Approach">
            <ol className="grid list-decimal gap-2 pl-5 marker:font-mono marker:text-signal">
              {caseStudy.approach.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </Block>
          <Block title="Architecture">
            <ArchitectureDiagram arch={caseStudy.architecture} id={`arch-${slug}`} title={`${project.title} architecture`} />
          </Block>
          {project.stack.length > 0 ? (
            <Block title="Stack">
              <StackList items={project.stack} label={`${project.title} tech stack`} />
            </Block>
          ) : null}
          <Block title="Outcome">
            <ul className="grid list-disc gap-2 pl-5 marker:text-signal">
              {caseStudy.outcome.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Block>
          {project.links.length > 0 ? (
            <Block title="Links">
              <div className="flex flex-wrap gap-x-6">
                {project.links.map((link) => (
                  <ExternalLink key={link.href} href={link.href}>
                    {link.label}
                  </ExternalLink>
                ))}
              </div>
            </Block>
          ) : null}

          <nav aria-label="More case studies" className="flex flex-wrap justify-between gap-4 border-t border-border pt-6">
            <CaseStudyLink slug={prev.slug} replace>
              Previous · {prev.title}
            </CaseStudyLink>
            <CaseStudyLink slug={next.slug} replace>
              Next · {next.title}
            </CaseStudyLink>
          </nav>
        </article>
      </div>
    </div>
  );
}
