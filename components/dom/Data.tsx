import { CaseStudyLink } from '@/components/dom/CaseStudyLink';
import { Counter } from '@/components/dom/Counter';
import { DecodeText } from '@/components/dom/DecodeText';
import { ExternalLink, StackList } from '@/components/dom/ProjectCard';
import { PanelStage, SectionPanel } from '@/components/dom/SectionPanel';
import { PROJECTS, REGRESSORS, RESTAURANT_MODEL_SCORES, RESTAURANT_SCORE_METRIC, SECTIONS } from '@/content/data';

const [FROM, TO] = SECTIONS.find((s) => s.id === 'data')!.range;
/** Monoliths → SMC ridge hand-over (matches the terrain morph). */
const SPLIT = 0.67;

const rating = PROJECTS.find((p) => p.slug === 'restaurant-rating-prediction')!;
const smc = PROJECTS.find((p) => p.slug === 'smc-pro')!;

/** DATA TERRAIN copy: Restaurant Rating Prediction, then SMC PRO. */
export function Data() {
  return (
    <PanelStage>
      <SectionPanel from={FROM} to={SPLIT} labelledBy="data-title" className="grid gap-5">
        <header className="grid gap-2">
          <p className="label-mono text-signal">
            <DecodeText text="04 / Data terrain" from={FROM} to={SPLIT} />
          </p>
          <h2 id="data-title" className="font-display text-h2 font-medium">
            {rating.title}
          </h2>
        </header>
        <p>{rating.summary}</p>
        <ul className="grid list-disc gap-2 pl-5 text-small marker:text-signal">
          {rating.caseStudy.approach.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
        <div className="grid gap-2">
          <h3 className="label-mono text-text-muted">
            Models benchmarked{RESTAURANT_SCORE_METRIC ? ` · ${RESTAURANT_SCORE_METRIC}` : ''}
          </h3>
          <ol className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-small sm:grid-cols-3">
            {REGRESSORS.map((name) => {
              const score = RESTAURANT_MODEL_SCORES[name];
              return (
                <li key={name} className="flex justify-between gap-3 border-b border-border py-1">
                  <span>{name}</span>
                  {score !== null ? <span className="text-signal tabular-nums">{score}</span> : null}
                </li>
              );
            })}
          </ol>
        </div>
        <StackList items={rating.stack} label={`${rating.title} tech stack`} />
        <CaseStudyLink slug={rating.slug} />
        {rating.links.map((link) => (
          <ExternalLink key={link.href} href={link.href} className="w-fit">
            {link.label}
          </ExternalLink>
        ))}
      </SectionPanel>

      <SectionPanel from={SPLIT} to={TO} labelledBy="data-smc-title" className="grid gap-5">
        <header className="grid gap-2">
          <p className="label-mono text-signal">Trading toolkit</p>
          <h3 id="data-smc-title" className="font-display text-h2 font-medium">
            {smc.title}
          </h3>
        </header>
        <p>{smc.summary}</p>
        {smc.metric ? (
          <p className="flex flex-wrap items-baseline gap-3">
            <Counter metric={smc.metric} startAt={SPLIT} className="font-display text-display font-semibold text-signal" />
            <span className="label-mono text-text-muted">{smc.metric.label}</span>
          </p>
        ) : null}
        <ul className="grid list-disc gap-2 pl-5 text-small marker:text-signal">
          {smc.caseStudy.approach.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
        <StackList items={smc.stack} label={`${smc.title} tech stack`} />
        <CaseStudyLink slug={smc.slug} />
        {smc.links.map((link) => (
          <ExternalLink key={link.href} href={link.href} className="w-fit">
            {link.label}
          </ExternalLink>
        ))}
      </SectionPanel>
    </PanelStage>
  );
}
