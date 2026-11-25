import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import { ClientExtras } from '@/components/dom/ClientExtras';
import { Toaster } from '@/components/dom/Toast';
import { CONTACT, DOQTRA_TECH_URL, EDUCATION, PERSON, SITE, SKILLS } from '@/content/data';
import { siteUrl } from '@/lib/site';
import { TOKENS } from '@/lib/tokens';
import '@/styles/globals.css';

const clash = localFont({
  src: [
    { path: '../public/fonts/ClashDisplay-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/ClashDisplay-Semibold.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-clash',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Arial',
});

const plex = localFont({
  src: [
    { path: '../public/fonts/IBMPlexSans-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/IBMPlexSans-Medium.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-plex',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Arial',
});

const jetbrains = localFont({
  src: [
    { path: '../public/fonts/JetBrainsMono-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/JetBrainsMono-Medium.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-jetbrains',
  display: 'swap',
  preload: false,
  // Monospace fallback metrics: Arial would distort the fixed-width boot log.
  adjustFontFallback: false,
  fallback: ['ui-monospace', 'Menlo', 'Consolas', 'monospace'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: SITE.title,
  description: SITE.description,
  applicationName: PERSON.name,
  authors: [{ name: PERSON.name }],
  creator: PERSON.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: PERSON.name,
    title: SITE.title,
    description: SITE.description,
    url: '/',
    locale: 'en_IN',
  },
  twitter: { card: 'summary_large_image', title: SITE.title, description: SITE.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: TOKENS.bg,
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

function personJsonLd() {
  const url = siteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: PERSON.name,
    alternateName: PERSON.nickname,
    jobTitle: PERSON.title,
    description: SITE.description,
    url,
    image: `${url}/opengraph-image`,
    email: `mailto:${CONTACT.email}`,
    address: { '@type': 'PostalAddress', addressLocality: 'Mangalore', addressCountry: 'IN' },
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: EDUCATION.institution,
      address: { '@type': 'PostalAddress', addressLocality: EDUCATION.city, addressCountry: 'IN' },
    },
    worksFor: { '@type': 'Organization', name: PERSON.company, ...(DOQTRA_TECH_URL ? { url: DOQTRA_TECH_URL } : {}) },
    knowsLanguage: PERSON.languages,
    knowsAbout: SKILLS.flatMap((cluster) => cluster.items),
    sameAs: [CONTACT.linkedin, CONTACT.github].filter(Boolean),
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${clash.variable} ${plex.variable} ${jetbrains.variable}`}>
      <body>
        <script
          type="application/ld+json"
          // JSON-LD Person for search engines; "<" escaped so the payload can't close the tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()).replace(/</g, '\\u003c') }}
        />
        {children}
        <Toaster />
        <ClientExtras />
      </body>
    </html>
  );
}
