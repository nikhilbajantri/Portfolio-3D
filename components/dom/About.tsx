import { GraduationCap, Languages, MapPin } from 'lucide-react';
import { DecodeText } from '@/components/dom/DecodeText';
import { PanelStage, SectionPanel } from '@/components/dom/SectionPanel';
import { EDUCATION, PERSON, SECTIONS } from '@/content/data';

const [FROM, TO] = SECTIONS.find((s) => s.id === 'die')!.range;

/** DIE SURFACE copy: about, education, location, availability. */
export function About() {
  return (
    <PanelStage>
      <SectionPanel from={FROM} to={TO} labelledBy="about-title" className="grid gap-6">
        <header className="grid gap-2">
          <p className="label-mono text-signal">
            <DecodeText text="01 / Die surface" from={FROM} to={TO} />
          </p>
          <h2 id="about-title" className="font-display text-h2 font-medium">
            About
          </h2>
        </header>
        <p className="label-mono inline-flex h-8 w-fit items-center gap-2 rounded-chip border border-signal/40 px-3 text-signal">
          <span aria-hidden="true" className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-signal" />
          </span>
          {PERSON.availability}
        </p>
        <div className="grid gap-4 text-small md:text-body">
          {PERSON.about.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
        <dl className="grid gap-3 border-t border-border pt-4 text-small">
          <div className="flex gap-3">
            <dt>
              <GraduationCap aria-hidden="true" strokeWidth={1.5} className="mt-0.5 size-4 text-text-muted" />
              <span className="sr-only">Education</span>
            </dt>
            <dd>
              {EDUCATION.degree}, {EDUCATION.institution}, {EDUCATION.city} ({EDUCATION.start}–{EDUCATION.end})
            </dd>
          </div>
          <div className="flex gap-3">
            <dt>
              <MapPin aria-hidden="true" strokeWidth={1.5} className="mt-0.5 size-4 text-text-muted" />
              <span className="sr-only">Location</span>
            </dt>
            <dd>
              {PERSON.location} · {PERSON.workMode}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt>
              <Languages aria-hidden="true" strokeWidth={1.5} className="mt-0.5 size-4 text-text-muted" />
              <span className="sr-only">Languages</span>
            </dt>
            <dd>{PERSON.languages.join(', ')}</dd>
          </div>
        </dl>
      </SectionPanel>
    </PanelStage>
  );
}
