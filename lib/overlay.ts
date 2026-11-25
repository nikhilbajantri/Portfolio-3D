/**
 * Case-study overlay navigation shared by DOM links and 3D objects.
 * - Opening from inside the journey records where focus was, so closing can
 *   return it, and marks the overlay as "in-app" so closing can use history.back().
 * - A deep link (/work/<slug> loaded directly) is not in-app: closing replaces the
 *   URL with "/" instead of leaving the site.
 */

type Push = (href: string) => void;

let push: Push | null = null;
let openedInApp = false;
let returnFocus: HTMLElement | null = null;

export const caseStudyHref = (slug: string): string => `/work/${slug}`;

/** Registered by <CaseStudyRouter/> so 3D objects (outside React DOM context) can navigate. */
export function registerRouter(fn: Push | null): void {
  push = fn;
}

/** Call before navigating to a case study from within the journey. */
export function markInApp(): void {
  openedInApp = true;
  const active = document.activeElement;
  returnFocus = active instanceof HTMLElement && active !== document.body ? active : null;
}

export function openCaseStudy(slug: string): void {
  markInApp();
  push?.(caseStudyHref(slug));
}

/** Whether the open overlay was reached from inside the journey (stays true across case-to-case switches). */
export function isOpenedInApp(): boolean {
  return openedInApp;
}

/** Called once the overlay has fully closed back to the journey. */
export function resetInApp(): void {
  openedInApp = false;
}

export function takeReturnFocus(): HTMLElement | null {
  const el = returnFocus;
  returnFocus = null;
  return el?.isConnected ? el : null;
}
