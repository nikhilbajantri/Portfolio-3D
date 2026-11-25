import { PERSON, PROJECTS } from '@/content/data';
import { OG_SIZE, renderCaseCard } from '@/lib/og/render';

export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams(): Array<{ slug: string }> {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateImageMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  return [{ id: 'card', alt: project ? `${project.title}: case study by ${PERSON.name}` : PERSON.name, size, contentType }];
}

/** Per-case-study share card. */
export default async function CaseStudyImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug) ?? PROJECTS[0]!;
  return renderCaseCard(project.title, project.client, project.summary, `${PERSON.name} · ${PERSON.title}`);
}
