import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react';
import type { Project, ProjectStatus } from '@/content/data';
import { cx } from '@/lib/utils';

const STATUS_STYLE: Record<ProjectStatus, string> = {
  live: 'border-signal/40 text-signal',
  poc: 'border-border text-text-muted',
  'in-progress': 'border-pulse/50 text-text',
  complete: 'border-border text-text-muted',
};

export function StatusBadge({ project }: { project: Project }) {
  if (project.badge === '') return null;
  return (
    <span
      className={cx(
        'label-mono inline-flex h-7 items-center gap-2 rounded-chip border px-2',
        STATUS_STYLE[project.status],
      )}
    >
      {project.status === 'live' || project.status === 'in-progress' ? (
        <span aria-hidden="true" className="relative flex size-1.5">
          <span
            className={cx(
              'absolute inline-flex size-full animate-ping rounded-full opacity-60',
              project.status === 'live' ? 'bg-signal' : 'bg-pulse',
            )}
          />
          <span
            className={cx(
              'relative inline-flex size-1.5 rounded-full',
              project.status === 'live' ? 'bg-signal' : 'bg-pulse',
            )}
          />
        </span>
      ) : null}
      {project.badge}
    </span>
  );
}

export function StackList({ items, label }: { items: readonly string[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <ul aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className="label-mono rounded-chip border border-border px-2 py-1 text-text-muted">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ExternalLink({ href, children, className }: { href: string; children: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="OPEN"
      className={cx(
        'group inline-flex min-h-11 items-center gap-2 text-signal underline decoration-signal/30 underline-offset-4',
        'transition-colors duration-[var(--duration-micro)] hover:decoration-signal',
        className,
      )}
    >
      {children}
      <ArrowUpRight
        aria-hidden="true"
        strokeWidth={1.5}
        className="size-4 transition-transform duration-[var(--duration-micro)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

function CaseStudy({ project }: { project: Project }) {
  const { caseStudy } = project;
  const nodeLabel = (id: string): string =>
    caseStudy.architecture.nodes.find((n) => n.id === id)?.label ?? id;

  return (
    <details className="group/cs border-t border-border pt-2">
      <summary className="label-mono flex min-h-11 list-none items-center justify-between gap-4 text-text transition-colors duration-[var(--duration-micro)] hover:text-signal [&::-webkit-details-marker]:hidden">
        Case study
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-4 transition-transform duration-[var(--duration-ui)] ease-[var(--ease-quart-out)] group-open/cs:rotate-180"
        />
      </summary>
      <div className="grid gap-6 pb-2 pt-4 text-small">
        <div className="grid gap-1">
          <h4 className="label-mono text-text-muted">Problem</h4>
          <p>{caseStudy.problem}</p>
        </div>
        <div className="grid gap-1">
          <h4 className="label-mono text-text-muted">Approach</h4>
          <ul className="grid list-disc gap-1 pl-5 marker:text-signal">
            {caseStudy.approach.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
        <div className="grid gap-2">
          <h4 className="label-mono text-text-muted">Architecture</h4>
          <ol className="grid gap-2">
            {caseStudy.architecture.edges.map((edge) => (
              <li key={`${edge.from}-${edge.to}`} className="flex flex-wrap items-center gap-2">
                <span className="rounded-chip border border-border bg-surface-2 px-2 py-1">{nodeLabel(edge.from)}</span>
                <ArrowRight aria-hidden="true" strokeWidth={1.5} className="size-4 text-signal" />
                <span className="sr-only">to</span>
                <span className="rounded-chip border border-border bg-surface-2 px-2 py-1">{nodeLabel(edge.to)}</span>
                {edge.label ? <span className="label-mono text-text-muted">{edge.label}</span> : null}
              </li>
            ))}
          </ol>
        </div>
        <div className="grid gap-1">
          <h4 className="label-mono text-text-muted">Outcome</h4>
          <ul className="grid list-disc gap-1 pl-5 marker:text-signal">
            {caseStudy.outcome.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

/** 2D project card used by Quick view; the 3D scenes reuse its content model. */
export function ProjectCard({ project, featured = false }: { project: Project; featured?: boolean }) {
  return (
    <article
      aria-labelledby={`project-${project.slug}`}
      className={cx(
        'flex flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-glass',
        featured && 'gap-6 md:p-8',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3
            id={`project-${project.slug}`}
            className={cx('font-display font-medium', featured ? 'text-h2' : 'text-h3')}
          >
            {project.title}
          </h3>
          <p className="label-mono text-text-muted">{project.client}</p>
        </div>
        <StatusBadge project={project} />
      </div>

      {featured && project.metric ? (
        <p className="flex items-baseline gap-3">
          <span className="font-display text-display font-semibold text-signal">
            {project.metric.prefix}
            {project.metric.value.toLocaleString('en-GB')}
            {project.metric.suffix}
          </span>
          <span className="label-mono text-text-muted">{project.metric.label}</span>
        </p>
      ) : null}

      <p className={cx(featured ? 'text-body' : 'text-small', 'text-text')}>{project.summary}</p>

      {!featured && project.metric ? (
        <p className="label-mono text-text-muted">
          <span className="text-signal">
            {project.metric.prefix}
            {project.metric.value.toLocaleString('en-GB')}
            {project.metric.suffix}
          </span>{' '}
          {project.metric.label}
        </p>
      ) : null}

      <StackList items={project.stack} label={`${project.title} tech stack`} />

      {project.links.length > 0 ? (
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {project.links.map((link) => (
            <ExternalLink key={link.href} href={link.href}>
              {link.label}
            </ExternalLink>
          ))}
        </div>
      ) : null}

      <div className="mt-auto">
        <CaseStudy project={project} />
      </div>
    </article>
  );
}
