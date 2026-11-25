import { CanvasRoot } from '@/components/canvas/CanvasRoot';
import { About } from '@/components/dom/About';
import { Auth } from '@/components/dom/Auth';
import { CaseStudyRouter } from '@/components/dom/CaseStudyRouter';
import { Contact } from '@/components/dom/Contact';
import { Data } from '@/components/dom/Data';
import { DevHud } from '@/components/dom/DevHud';
import { Header } from '@/components/dom/Header';
import { Hero } from '@/components/dom/Hero';
import { Kernel } from '@/components/dom/Kernel';
import { Preloader } from '@/components/dom/Preloader';
import { QuickRedirect } from '@/components/dom/QuickRedirect';
import { SectionRail } from '@/components/dom/SectionRail';
import { SmoothScroll } from '@/components/dom/SmoothScroll';
import { Studio } from '@/components/dom/Studio';
import { Suspense, type ComponentType } from 'react';
import { SECTIONS, type SectionId } from '@/content/data';

/**
 * Each section is span × var(--journey) tall and the page ends with one extra
 * viewport, so a section's top sits exactly at its progress start
 * (progress = scrollY / (pageHeight − 100vh)). --journey is set in globals.css:
 * 1250vh on desktop (BOOT exactly 100vh) and a shorter 1000vh on phones.
 */
/** DOM copy for each scene, in journey order. */
const SCENE_COPY: Record<SectionId, ComponentType> = {
  boot: Hero,
  die: About,
  studio: Studio,
  auth: Auth,
  data: Data,
  kernel: Kernel,
  exit: Contact,
};

/** The 3D journey and its DOM copy. Lives in the (journey) layout so it survives case-study navigation. */
export function Journey() {
  return (
    <div id="app-root" className="relative">
      {/* Without JavaScript there is no scroll choreography: show every panel, stacked and readable. */}
      <noscript>
        <style>{`.section-panel{opacity:1!important;grid-area:auto!important;max-height:none!important}.panel-stage{position:static!important;height:auto!important}.panel-stage>div{gap:1.5rem}.js-only{display:none!important}#main>section{height:auto!important;padding-block:4rem}#main>section#boot{min-height:100vh;padding-block:0}`}</style>
      </noscript>
      <SmoothScroll />
      <CaseStudyRouter />
      <QuickRedirect />
      <CanvasRoot />
      <Header mode="3d" />
      <Preloader />
      <SectionRail />
      <main id="main" tabIndex={-1} className="relative z-10">
        {SECTIONS.map((section) => {
          const [from, to] = section.range;
          // EXIT carries the page's final extra viewport (see JOURNEY_VH).
          const height = `calc(var(--journey) * ${to - from}${section.id === 'exit' ? ' + 100vh' : ''})`;
          const Content = SCENE_COPY[section.id];
          return (
            <section key={section.id} id={section.id} aria-label={section.title} className="relative" style={{ height }}>
              {/* One boundary per section lets React hydrate them as separate, yielding tasks. */}
              <Suspense>
                <Content />
              </Suspense>
            </section>
          );
        })}
      </main>
      {process.env.NODE_ENV === 'development' ? <DevHud /> : null}
    </div>
  );
}
