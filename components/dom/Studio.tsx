import { CaseStudyLink } from '@/components/dom/CaseStudyLink';
import { Counter } from '@/components/dom/Counter';
import { DecodeText } from '@/components/dom/DecodeText';
import { ExternalLink, StackList, StatusBadge } from '@/components/dom/ProjectCard';
import { PanelStage, SectionPanel } from '@/components/dom/SectionPanel';
import { EXPERIENCE, PROJECTS, SECTIONS } from '@/content/data';

const [FROM, TO] = SECTIONS.find((s) => s.id === 'studio')!.range;
/** The experience panel hands over to the projects panel at this progress. */
const SPLIT = 0.315;

const doqtra = EXPERIENCE.find((e) => e.id === 'doqtra')!;
const gbd = PROJECTS.find((p) => p.slug === 'great-british-doner')!;
const olea = PROJECTS.find((p) => p.slug === 'olea-social')!;

/** STUDIO LAYER copy: Doqtra Tech experience, then the live client work. */
export function Studio() {
  return (
    <PanelStage>
      <SectionPanel from={FROM} to={SPLIT} labelledBy="studio-title" className="grid gap-5">
        <header className="grid gap-2">
          <p className="label-mono text-signal">
            <DecodeText text="02 / Studio layer" from={FROM} to={SPLIT} />
          </p>
          <h2 id="studio-title" className="font-display text-h2 font-medium">
            {doqtra.company}
          </h2>
          <p className="label-mono text-text-muted">
            {doqtra.role} · {doqtra.start} – {doqtra.end}
          </p>
        </header>
        <ul className="grid list-disc gap-2 pl-5 text-small marker:text-signal">
          {doqtra.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <StackList items={doqtra.stack} label={`${doqtra.company} tech stack`} />
        {doqtra.link ? <ExternalLink href={doqtra.link}>{doqtra.company}</ExternalLink> : null}
      </SectionPanel>

      <SectionPanel from={SPLIT} to={TO} labelledBy="studio-work-title" className="grid gap-6">
        <header className="grid gap-2">
          <p className="label-mono text-signal">Client work · {gbd.client}</p>
          <div className="flex flex-wrap items-center gap-3">
            <h3 id="studio-work-title" className="font-display text-h2 font-medium">
              {gbd.title}
            </h3>
            <StatusBadge project={gbd} />
          </div>
        </header>
        {gbd.metric ? (
          <p className="flex items-baseline gap-3">
            <Counter
              metric={gbd.metric}
              startAt={SPLIT}
              className="font-display text-display font-semibold text-signal"
            />
            <span className="label-mono text-text-muted">{gbd.metric.label}</span>
          </p>
        ) : null}
        <p>{gbd.summary}</p>
        <StackList items={gbd.stack} label={`${gbd.title} tech stack`} />
        <div className="flex flex-wrap gap-x-6">
          <CaseStudyLink slug={gbd.slug} />
          {gbd.links.map((link) => (
            <ExternalLink key={link.href} href={link.href} className="w-fit">
              {link.label}
            </ExternalLink>
          ))}
        </div>
        <div className="grid gap-1 border-t border-border pt-4">
          <h3 className="font-display text-h3 font-medium">{olea.title}</h3>
          <p className="text-small text-text-muted">{olea.summary}</p>
          <div className="flex flex-wrap gap-x-6">
            <CaseStudyLink slug={olea.slug} />
            {olea.links.map((link) => (
              <ExternalLink key={link.href} href={link.href} className="w-fit">
                {link.label}
              </ExternalLink>
            ))}
          </div>
        </div>
      </SectionPanel>
    </PanelStage>
  );
}
