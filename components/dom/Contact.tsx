import { FileDown } from 'lucide-react';
import { CopyEmailButton } from '@/components/dom/CopyEmailButton';
import { DecodeText } from '@/components/dom/DecodeText';
import { MagneticButton } from '@/components/dom/MagneticButton';
import { ExternalLink } from '@/components/dom/ProjectCard';
import { PanelStage, SectionPanel } from '@/components/dom/SectionPanel';
import { CONTACT, SECTIONS, SITE } from '@/content/data';
import { RESUME_AVAILABLE } from '@/lib/server';

const [FROM] = SECTIONS.find((s) => s.id === 'exit')!.range;
/** Past the end of the journey: the contact block never fades out. */
const NEVER = 1.1;

/** EXIT: terminal contact block and footer. */
export function Contact() {
  return (
    <>
      <PanelStage>
        <SectionPanel from={FROM} to={NEVER} labelledBy="contact-title" className="grid gap-6 font-mono text-small">
          <p className="label-mono text-signal">
            <DecodeText text="06 / Exit" from={FROM} to={NEVER} />
          </p>
          <h2 id="contact-title" className="text-h3 text-signal">
            <span aria-hidden="true">&gt; </span>contact --nick
          </h2>
          <dl className="grid gap-4">
            <div className="grid gap-1 sm:grid-cols-[6rem_1fr] sm:items-center">
              <dt className="label-mono text-text-muted">email</dt>
              <dd>
                <MagneticButton>
                  <CopyEmailButton email={CONTACT.email} />
                </MagneticButton>
              </dd>
            </div>
            {CONTACT.linkedin ? (
              <div className="grid gap-1 sm:grid-cols-[6rem_1fr] sm:items-center">
                <dt className="label-mono text-text-muted">linkedin</dt>
                <dd>
                  <ExternalLink href={CONTACT.linkedin}>LinkedIn</ExternalLink>
                </dd>
              </div>
            ) : null}
            {CONTACT.github ? (
              <div className="grid gap-1 sm:grid-cols-[6rem_1fr] sm:items-center">
                <dt className="label-mono text-text-muted">github</dt>
                <dd>
                  <ExternalLink href={CONTACT.github}>GitHub</ExternalLink>
                </dd>
              </div>
            ) : null}
            {RESUME_AVAILABLE ? (
              <div className="grid gap-1 sm:grid-cols-[6rem_1fr] sm:items-center">
                <dt className="label-mono text-text-muted">résumé</dt>
                <dd>
                  <MagneticButton>
                    <a
                      href={CONTACT.resume}
                      download
                      data-cursor="OPEN"
                      className="label-mono inline-flex min-h-11 items-center gap-2 rounded-chip bg-signal px-4 text-on-signal transition-opacity duration-[var(--duration-micro)] hover:opacity-85"
                    >
                      <FileDown aria-hidden="true" strokeWidth={1.5} className="size-4" />
                      Download résumé
                    </a>
                  </MagneticButton>
                </dd>
              </div>
            ) : null}
          </dl>
        </SectionPanel>
      </PanelStage>
      <footer className="container-content absolute inset-x-0 bottom-0 py-8">
        <p className="label-mono text-text-muted">{SITE.footer}</p>
      </footer>
    </>
  );
}
