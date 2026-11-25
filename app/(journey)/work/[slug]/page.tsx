import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CaseStudyOverlay } from '@/components/dom/CaseStudyOverlay';
import { PERSON, PROJECTS } from '@/content/data';

export const dynamicParams = false;

export function generateStaticParams(): Array<{ slug: string }> {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) return {};
  const title = `${project.title} · Case study · ${PERSON.name}`;
  const description = `${project.summary} ${project.caseStudy.problem}`;
  return {
    title,
    description,
    alternates: { canonical: `/work/${project.slug}` },
    // openGraph/twitter are replaced, not merged, so restate what the layout set.
    openGraph: { type: 'article', title, description, url: `/work/${project.slug}`, siteName: PERSON.name, locale: 'en_IN' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/** Case study overlay; the journey behind it comes from the (journey) layout. */
export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!PROJECTS.some((p) => p.slug === slug)) notFound();
  return <CaseStudyOverlay slug={slug} />;
}
