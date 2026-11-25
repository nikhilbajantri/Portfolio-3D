import { cx } from '@/lib/utils';

/** Pre-rendered stills from scripts/capture-stills.mjs, with their intrinsic sizes (no layout shift). */
export const STILLS = {
  boot: { width: 1200, height: 750, alt: 'The 3D journey opens on an obsidian chip under the name Nikhil Bajantri, drawn in particles.' },
  studio: { width: 744, height: 750, alt: 'Curved browser frames for Great British Doner and Olea Social, from the 3D studio layer.' },
  data: { width: 744, height: 750, alt: 'Candlestick ridges with order blocks and a liquidity sweep, from the 3D data terrain.' },
  kernel: { width: 744, height: 750, alt: 'A glowing core orbited by eight skill clusters, from the 3D kernel layer.' },
} as const;

export type StillName = keyof typeof STILLS;

/** A WebGL-free picture of one journey scene: AVIF with a WebP fallback. */
export function SceneStill({ name, eager = false, className }: { name: StillName; eager?: boolean; className?: string }) {
  const still = STILLS[name];
  return (
    <picture>
      <source srcSet={`/fallback/${name}.avif`} type="image/avif" />
      <img
        src={`/fallback/${name}.webp`}
        width={still.width}
        height={still.height}
        alt={still.alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : 'auto'}
        className={cx('h-auto w-full rounded-card border border-border bg-bg object-cover', className)}
      />
    </picture>
  );
}
