import { SECTIONS, type SectionId } from '@/content/data';

/** True when a key event belongs to a text field, select or editable region. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/** Small offset so a jump lands inside the section, not on its boundary. */
const SECTION_ENTRY = 0.001;

export function sectionStart(id: SectionId): number {
  const section = SECTIONS.find((s) => s.id === id);
  return section ? Math.min(1, section.range[0] + (section.range[0] === 0 ? 0 : SECTION_ENTRY)) : 0;
}

/**
 * Next/previous section target for keyboard navigation. "Previous" first returns
 * to the start of the current section when the visitor is well inside it.
 */
export function adjacentSection(current: SectionId, progress: number, direction: 1 | -1): SectionId {
  const index = SECTIONS.findIndex((s) => s.id === current);
  const section = SECTIONS[index];
  if (direction === -1 && section && progress - section.range[0] > 0.01) return section.id;
  const next = SECTIONS[Math.min(SECTIONS.length - 1, Math.max(0, index + direction))];
  return next?.id ?? current;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/** Keeps Tab / Shift+Tab cycling inside `container` (for modal dialogs). */
export function trapTab(e: KeyboardEvent, container: HTMLElement): void {
  if (e.key !== 'Tab') return;
  const items = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) {
    e.preventDefault();
    return;
  }
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !container.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !container.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}
