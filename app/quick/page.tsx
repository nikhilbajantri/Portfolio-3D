import type { Metadata } from 'next';
import { Header } from '@/components/dom/Header';
import { QuickView } from '@/components/dom/QuickView';
import { PERSON, SITE } from '@/content/data';

export const metadata: Metadata = {
  title: `Quick view · ${PERSON.name}`,
  description: SITE.description,
  alternates: { canonical: '/quick' },
  openGraph: { type: 'profile', title: `Quick view · ${PERSON.name}`, description: SITE.description, url: '/quick', siteName: PERSON.name, locale: 'en_IN' },
};

export default function QuickPage() {
  return (
    <>
      <Header mode="quick" />
      <main id="main" tabIndex={-1}>
        <QuickView />
      </main>
    </>
  );
}
