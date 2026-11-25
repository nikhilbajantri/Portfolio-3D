import { CaseStudyLink } from '@/components/dom/CaseStudyLink';
import { DecodeText } from '@/components/dom/DecodeText';
import { ExternalLink, StackList, StatusBadge } from '@/components/dom/ProjectCard';
import { PanelStage, SectionPanel } from '@/components/dom/SectionPanel';
import { EXPERIENCE, PROJECTS, SECTIONS } from '@/content/data';

const [FROM, TO] = SECTIONS.find((s) => s.id === 'auth')!.range;
/** Experience → projects → teaser hand-overs (journey progress). */
const TO_PROJECTS = 0.47;
const TO_TEASER = 0.535;

const shiktra = EXPERIENCE.find((e) => e.id === 'shiktra')!;
const platforms = ['ats-platform', 'mycodebud'].map((slug) => PROJECTS.find((p) => p.slug === slug)!);
const next = PROJECTS.find((p) => p.slug === 'ml-network-anomaly-detector')!;

/** AUTH GATEWAY copy: Shiktra experience, the two POC platforms, then the teaser. */
export function Auth() {
  return (
    <PanelStage>
      <SectionPanel from={FROM} to={TO_PROJECTS} labelledBy="auth-title" className="grid gap-5">
        <header className="grid gap-2">
          <p className="label-mono text-signal">
            <DecodeText text="03 / Auth gateway" from={FROM} to={TO_PROJECTS} />
          </p>
          <h2 id="auth-title" className="font-display text-h2 font-medium">
            {shiktra.company}
          </h2>
          <p className="label-mono text-text-muted">
            {shiktra.role} · {shiktra.start} – {shiktra.end}
          </p>
        </header>
        <ul className="grid list-disc gap-2 pl-5 text-small marker:text-signal">
          {shiktra.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <StackList items={shiktra.stack} label={`${shiktra.company} tech stack`} />
        {shiktra.link ? <ExternalLink href={shiktra.link}>{shiktra.company}</ExternalLink> : null}
      </SectionPanel>

      <SectionPanel from={TO_PROJECTS} to={TO_TEASER} labelledBy="auth-platforms-title" className="grid gap-6">
        <header className="grid gap-2">
          <p className="label-mono text-signal">Platforms · {shiktra.company}</p>
          <h3 id="auth-platforms-title" className="font-display text-h2 font-medium">
            Two full-stack POC platforms
          </h3>
        </header>
        {platforms.map((project) => (
          <article key={project.slug} aria-labelledby={`auth-${project.slug}`} className="grid gap-3 border-t border-border pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 id={`auth-${project.slug}`} className="font-display text-h3 font-medium">
                {project.title}
              </h4>
              <StatusBadge project={project} />
            </div>
            <p className="text-small">{project.summary}</p>
            <StackList items={project.stack} label={`${project.title} tech stack`} />
            <CaseStudyLink slug={project.slug} />
          </article>
        ))}
      </SectionPanel>

      <SectionPanel from={TO_TEASER} to={TO} labelledBy="auth-next-title" className="grid gap-4">
        <p className="label-mono text-text-muted">Next</p>
        <div className="flex flex-wrap items-center gap-3">
          <h3 id="auth-next-title" className="font-display text-h2 font-medium">
            {next.title}
          </h3>
          <StatusBadge project={next} />
        </div>
        <p>{next.summary}</p>
        <CaseStudyLink slug={next.slug} />
        {next.links.map((link) => (
          <ExternalLink key={link.href} href={link.href} className="w-fit">
            {link.label}
          </ExternalLink>
        ))}
      </SectionPanel>
    </PanelStage>
  );
}
