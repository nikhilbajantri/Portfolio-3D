import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { TOKENS } from '@/lib/tokens';

export const OG_SIZE = { width: 1200, height: 630 } as const;

const dir = join(process.cwd(), 'lib', 'og');

async function assets() {
  const [clash, plex, mono, chip] = await Promise.all([
    readFile(join(dir, 'ClashDisplay-Semibold.woff')),
    readFile(join(dir, 'IBMPlexSans-Regular.woff')),
    readFile(join(dir, 'JetBrainsMono-Medium.woff')),
    readFile(join(dir, 'chip.png')),
  ]);
  return {
    chip: `data:image/png;base64,${chip.toString('base64')}`,
    fonts: [
      { name: 'Clash Display', data: clash, weight: 600 as const, style: 'normal' as const },
      { name: 'IBM Plex Sans', data: plex, weight: 400 as const, style: 'normal' as const },
      { name: 'JetBrains Mono', data: mono, weight: 500 as const, style: 'normal' as const },
    ],
  };
}

const label = {
  fontFamily: 'JetBrains Mono',
  fontSize: 20,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
};

/** Site card: the chip hero render (with the particle name) plus title line and headline. */
export async function renderSiteCard(eyebrow: string, headline: string): Promise<ImageResponse> {
  const { chip, fonts } = await assets();
  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: TOKENS.bg, position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> only */}
        <img src={chip} width={1200} height={630} alt="" style={{ position: 'absolute', top: 0, left: 0 }} />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            padding: '120px 64px 52px',
            backgroundImage: `linear-gradient(to bottom, rgba(5,6,10,0), ${TOKENS.bg} 55%)`,
          }}
        >
          <div style={{ ...label, color: TOKENS.signal }}>{eyebrow}</div>
          <div style={{ fontFamily: 'Clash Display', fontSize: 52, color: TOKENS.text, letterSpacing: '-0.02em' }}>{headline}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}

/** Case-study card: dimmed chip render behind the project title, client and summary. */
export async function renderCaseCard(title: string, client: string, summary: string, byline: string): Promise<ImageResponse> {
  const { chip, fonts } = await assets();
  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: TOKENS.bg, position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> only */}
        <img src={chip} width={1200} height={630} alt="" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.18 }} />
        {/* Satori has no `inset`: the block needs explicit coordinates and size to bottom-align. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: OG_SIZE.width,
            height: OG_SIZE.height,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            gap: 18,
            padding: 64,
          }}
        >
          <div style={{ ...label, color: TOKENS.signal }}>{`Case study · ${client}`}</div>
          <div style={{ fontFamily: 'Clash Display', fontSize: 92, lineHeight: 0.95, color: TOKENS.text, letterSpacing: '-0.04em' }}>
            {title}
          </div>
          <div style={{ fontFamily: 'IBM Plex Sans', fontSize: 30, color: TOKENS.textMuted, maxWidth: 980 }}>{summary}</div>
          <div style={{ ...label, fontSize: 18, color: TOKENS.textMuted, marginTop: 18 }}>{byline}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}

/** "NB" mark for favicon / apple-touch-icon. */
export async function renderIcon(size: number): Promise<ImageResponse> {
  const { fonts } = await assets();
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          background: TOKENS.bg,
          color: TOKENS.text,
          fontFamily: 'Clash Display',
          fontSize: size * 0.5,
          letterSpacing: '-0.04em',
          borderRadius: size * 0.18,
          border: `${Math.max(1, size / 32)}px solid ${TOKENS.signal}`,
        }}
      >
        NB
      </div>
    ),
    { width: size, height: size, fonts: fonts.slice(0, 1) },
  );
}
