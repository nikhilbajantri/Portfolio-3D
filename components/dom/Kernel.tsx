import { DecodeText } from '@/components/dom/DecodeText';
import { PanelStage, SectionPanel } from '@/components/dom/SectionPanel';
import { SkillList } from '@/components/dom/SkillList';
import { StackList } from '@/components/dom/ProjectCard';
import { LEADERSHIP, SECTIONS } from '@/content/data';

const [FROM, TO] = SECTIONS.find((s) => s.id === 'kernel')!.range;
/** Skills → leadership hand-over (matches the strip fading in). */
const SPLIT = 0.84;

/** KERNEL CORE copy: skill clusters (linked to the 3D orbit), then leadership. */
export function Kernel() {
  return (
    <PanelStage>
      <SectionPanel from={FROM} to={SPLIT} labelledBy="kernel-title" className="grid gap-5">
        <header className="grid gap-2">
          <p className="label-mono text-signal">
            <DecodeText text="05 / Kernel core" from={FROM} to={SPLIT} />
          </p>
          <h2 id="kernel-title" className="font-display text-h2 font-medium">
            Skills
          </h2>
        </header>
        <SkillList />
      </SectionPanel>

      <SectionPanel from={SPLIT} to={TO} labelledBy="leadership-title" className="grid gap-5">
        <header className="grid gap-2">
          <p className="label-mono text-signal">Community</p>
          <h3 id="leadership-title" className="font-display text-h2 font-medium">
            Leadership
          </h3>
        </header>
        <ol className="relative grid gap-6 border-l border-border pl-6">
          {LEADERSHIP.map((role) => (
            <li key={role.id} className="relative grid gap-2">
              <span aria-hidden="true" className="absolute -left-[1.84rem] top-2 size-2.5 rounded-full border border-signal bg-bg" />
              <h4 className="font-display text-h3 font-medium">{role.role}</h4>
              <p className="label-mono text-text-muted">{role.organisation}</p>
              <p className="text-small">{role.description}</p>
              <StackList items={role.highlights} label={`${role.organisation} events`} />
            </li>
          ))}
        </ol>
      </SectionPanel>
    </PanelStage>
  );
}
