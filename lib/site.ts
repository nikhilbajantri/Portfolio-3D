import { SITE_URL } from '@/content/data';

/**
 * Absolute site origin for canonical URLs, Open Graph, sitemap and robots.
 * SITE_URL in content/data.ts wins; on Vercel the production domain is used,
 * then the deployment URL; locally, the dev server.
 */
export function siteUrl(): string {
  if (SITE_URL) return SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}
