import { FileDown, GraduationCap, Languages, MapPin } from 'lucide-react';
import { Suspense, type ReactNode } from 'react';
import { preload } from 'react-dom';
import { CopyEmailButton } from '@/components/dom/CopyEmailButton';
import { FallbackNotice } from '@/components/dom/FallbackNotice';
import { ExternalLink, ProjectCard, StackList } from '@/components/dom/ProjectCard';
import { SceneStill } from '@/components/dom/SceneStill';
import {
  CONTACT,
  EDUCATION,
  EXPERIENCE,
  LEADERSHIP,
  PERSON,
  PROJECTS,
  SITE,
  SKILLS,
} from '@/content/data';
import { RESUME_AVAILABLE } from '@/lib/server';

const NAV = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'work', label: 'Work' },
  { id: 'skills', label: 'Skills' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'contact', label: 'Contact' },
] as const;

function Section({ id, index, title, children }: { id: string; index: number; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid scroll-mt-28 gap-8 py-16 md:py-24 lg:py-32">
      <header className="grid gap-2 border-t border-border pt-6">
        <p className="label-mono text-signal">
          {String(index).padStart(2, '0')} / {title}
        </p>
        <h2 id={`${id}-title`} className="font-display text-h2 font-medium">
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function AvailabilityChip() {
  return (
    <p className="label-mono inline-flex h-8 w-fit items-center gap-2 rounded-chip border border-signal/40 px-3 text-signal">
      <span aria-hidden="true" className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-signal" />
      </span>
      {PERSON.availability}
    </p>
  );
}

function ContactActions() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <CopyEmailButton email={CONTACT.email} />
      {RESUME_AVAILABLE ? (
        <a
          href={CONTACT.resume}
          download
          data-cursor="OPEN"
          className="label-mono inline-flex min-h-11 items-center gap-2 rounded-chip bg-signal px-4 text-on-signal transition-opacity duration-[var(--duration-micro)] hover:opacity-85"
        >
          <FileDown aria-hidden="true" strokeWidth={1.5} className="size-4" />
          Download résumé
        </a>
      ) : null}
    </div>
  );
}

/** Fast, WebGL-free one-page résumé. Everything is server-rendered and crawlable. */
export function QuickView() {
  // The boot still is this page's LCP element: request it from the document head.
  preload('/fallback/boot.avif', { as: 'image', type: 'image/avif', fetchPriority: 'high' });
  const featured = PROJECTS.filter((p) => p.featured);
  const rest = PROJECTS.filter((p) => !p.featured);

  return (
    <div className="container-content grid gap-x-6 pt-28 md:pt-32 lg:grid-cols-12">
      {/* Identity column */}
      <aside className="lg:col-span-4">
        <div className="grid gap-6 lg:[@media(min-height:56rem)]:sticky lg:[@media(min-height:56rem)]:top-32">
          <p className="label-mono text-text-muted">Quick view · Résumé</p>
          <Suspense fallback={null}>
            <FallbackNotice />
          </Suspense>
          <div className="grid gap-3">
            <h1 className="font-display text-display font-semibold">{PERSON.name}</h1>
            <p className="label-mono text-signal">
              {PERSON.title} · Co-Founder, {PERSON.company}
            </p>
          </div>
          <p className="font-display text-h3 font-medium">{PERSON.headline}</p>
          <p className="text-text-muted">{PERSON.subline}</p>
          <AvailabilityChip />
          <ContactActions />
          <nav aria-label="Résumé sections" className="hidden border-t border-border pt-4 lg:block">
            <ul className="grid">
              {NAV.map((item, i) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="label-mono flex min-h-11 items-center gap-3 text-text-muted transition-colors duration-[var(--duration-micro)] hover:text-signal"
                  >
                    <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Content column */}
      <div className="lg:col-span-8 lg:col-start-5">
        <div className="pt-12 lg:pt-0">
          <SceneStill name="boot" eager />
        </div>
        <Section id="about" index={1} title="About">
          <div className="grid gap-4 text-body">
            {PERSON.about.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1 rounded-card border border-border bg-surface p-4">
              <dt className="label-mono flex items-center gap-2 text-text-muted">
                <GraduationCap aria-hidden="true" strokeWidth={1.5} className="size-4" />
                Education
              </dt>
              <dd className="text-small">
                {EDUCATION.degree}, {EDUCATION.institution}, {EDUCATION.city} ({EDUCATION.start}–{EDUCATION.end})
              </dd>
            </div>
            <div className="grid gap-1 rounded-card border border-border bg-surface p-4">
              <dt className="label-mono flex items-center gap-2 text-text-muted">
                <MapPin aria-hidden="true" strokeWidth={1.5} className="size-4" />
                Location
              </dt>
              <dd className="text-small">
                {PERSON.location} · {PERSON.workMode}
              </dd>
            </div>
            <div className="grid gap-1 rounded-card border border-border bg-surface p-4">
              <dt className="label-mono flex items-center gap-2 text-text-muted">
                <Languages aria-hidden="true" strokeWidth={1.5} className="size-4" />
                Languages
              </dt>
              <dd className="text-small">{PERSON.languages.join(', ')}</dd>
            </div>
          </dl>
        </Section>

        <Section id="experience" index={2} title="Experience">
          <ol className="grid gap-6">
            {EXPERIENCE.map((job) => (
              <li key={job.id}>
                <article
                  aria-labelledby={`job-${job.id}`}
                  className="grid gap-4 rounded-card border border-border bg-surface p-6 shadow-glass md:grid-cols-[10rem_1fr] md:gap-8"
                >
                  <p className="label-mono text-text-muted">
                    <time>{job.start}</time> – <time>{job.end}</time>
                  </p>
                  <div className="grid gap-4">
                    <div className="grid gap-1">
                      <h3 id={`job-${job.id}`} className="font-display text-h3 font-medium">
                        {job.role}
                      </h3>
                      <p className="label-mono text-signal">
                        {job.link ? <ExternalLink href={job.link}>{job.company}</ExternalLink> : job.company}
                      </p>
                    </div>
                    <ul className="grid list-disc gap-2 pl-5 text-small marker:text-signal">
                      {job.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                    <StackList items={job.stack} label={`${job.company} tech stack`} />
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="work" index={3} title="Selected work">
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <SceneStill name="studio" />
            <SceneStill name="data" />
          </div>
          <div className="grid gap-6">
            {featured.map((project) => (
              <ProjectCard key={project.slug} project={project} featured />
            ))}
            <div className="grid gap-6 md:grid-cols-2">
              {rest.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          </div>
        </Section>

        <Section id="skills" index={4} title="Skills">
          <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_13rem]">
            <ul className="grid gap-4 sm:grid-cols-2">
              {SKILLS.map((cluster) => (
                <li key={cluster.id} className="grid content-start gap-3 rounded-card border border-border bg-surface p-5">
                  <h3 className="label-mono text-signal">{cluster.name}</h3>
                  <p className="text-small">{cluster.items.join(' · ')}</p>
                </li>
              ))}
            </ul>
            <SceneStill name="kernel" className="hidden md:block" />
          </div>
        </Section>

        <Section id="leadership" index={5} title="Leadership & community">
          <ol className="grid gap-4">
            {LEADERSHIP.map((role) => (
              <li
                key={role.id}
                className="grid gap-3 rounded-card border border-border bg-surface p-5 md:grid-cols-[1fr_auto] md:items-start"
              >
                <div className="grid gap-1">
                  <h3 className="font-display text-h3 font-medium">{role.role}</h3>
                  <p className="label-mono text-text-muted">{role.organisation}</p>
                  <p className="text-small">{role.description}</p>
                </div>
                <StackList items={role.highlights} label={`${role.organisation} events`} />
              </li>
            ))}
          </ol>
        </Section>

        <Section id="contact" index={6} title="Contact">
          <div className="grid gap-6 rounded-card border border-border bg-surface p-6 font-mono text-small shadow-glass md:p-8">
            <p className="text-signal">
              <span aria-hidden="true">&gt; </span>contact --nick
            </p>
            <dl className="grid gap-4">
              <div className="grid gap-1 md:grid-cols-[8rem_1fr] md:items-center">
                <dt className="label-mono text-text-muted">email</dt>
                <dd>
                  <CopyEmailButton email={CONTACT.email} />
                </dd>
              </div>
              {CONTACT.linkedin ? (
                <div className="grid gap-1 md:grid-cols-[8rem_1fr] md:items-center">
                  <dt className="label-mono text-text-muted">linkedin</dt>
                  <dd>
                    <ExternalLink href={CONTACT.linkedin}>LinkedIn</ExternalLink>
                  </dd>
                </div>
              ) : null}
              {CONTACT.github ? (
                <div className="grid gap-1 md:grid-cols-[8rem_1fr] md:items-center">
                  <dt className="label-mono text-text-muted">github</dt>
                  <dd>
                    <ExternalLink href={CONTACT.github}>GitHub</ExternalLink>
                  </dd>
                </div>
              ) : null}
              {RESUME_AVAILABLE ? (
                <div className="grid gap-1 md:grid-cols-[8rem_1fr] md:items-center">
                  <dt className="label-mono text-text-muted">résumé</dt>
                  <dd>
                    <a
                      href={CONTACT.resume}
                      download
                      className="inline-flex min-h-11 items-center gap-2 text-signal underline decoration-signal/30 underline-offset-4 hover:decoration-signal"
                    >
                      <FileDown aria-hidden="true" strokeWidth={1.5} className="size-4" />
                      Nikhil_Bajantri_Resume.pdf
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </Section>

        <footer className="label-mono border-t border-border py-12 text-text-muted">{SITE.footer}</footer>
      </div>
    </div>
  );
}
