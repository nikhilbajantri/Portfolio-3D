import type { MetadataRoute } from 'next';
import { PROJECTS } from '@/content/data';
import { siteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/quick`, changeFrequency: 'monthly', priority: 0.9 },
    ...PROJECTS.map((p) => ({ url: `${base}/work/${p.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
