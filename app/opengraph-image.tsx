import { PERSON } from '@/content/data';
import { OG_SIZE, renderSiteCard } from '@/lib/og/render';

export const alt = `${PERSON.name}: ${PERSON.title}, Co-Founder of ${PERSON.company}`;
export const size = OG_SIZE;
export const contentType = 'image/png';

/** 1200×630 share card: the chip hero render, title line and headline. */
export default function OpenGraphImage() {
  return renderSiteCard(`${PERSON.title} · Co-Founder, ${PERSON.company}`, PERSON.headline);
}
