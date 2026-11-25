import { getGPUTier } from 'detect-gpu';

export type QualityTier = 'high' | 'medium' | 'low';

export interface QualityConfig {
  tier: QualityTier;
  /** 'full' = bloom + DOF + chromatic aberration; 'bloom' = bloom only; 'none' = no composer. */
  postFX: 'full' | 'bloom' | 'none';
  /** Multiplier applied to every instanced/particle count. */
  instanceScale: number;
  dpr: readonly [number, number];
  /** false → show video poster images instead of video textures. */
  video: boolean;
}

export const QUALITY: Record<QualityTier, QualityConfig> = {
  high: { tier: 'high', postFX: 'full', instanceScale: 1, dpr: [1, 2], video: true },
  medium: { tier: 'medium', postFX: 'bloom', instanceScale: 0.5, dpr: [1, 1.5], video: true },
  low: { tier: 'low', postFX: 'none', instanceScale: 0.3, dpr: [1, 1], video: false },
};

const ORDER: readonly QualityTier[] = ['low', 'medium', 'high'];

/** Scale a HIGH-tier instance count to the given tier, never below 1. */
export function scaledCount(base: number, tier: QualityTier): number {
  return Math.max(1, Math.round(base * QUALITY[tier].instanceScale));
}

export function downgrade(tier: QualityTier): QualityTier {
  const i = ORDER.indexOf(tier);
  return ORDER[Math.max(0, i - 1)] ?? 'low';
}

export function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    const ok = gl !== null;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

export interface DetectionResult {
  /** null = no usable WebGL, or a GPU too weak for the 3D path → Quick view. */
  tier: QualityTier | null;
  isMobile: boolean;
  gpu: string;
}

/**
 * Picks the starting tier from detect-gpu's benchmark data (self-hosted in
 * /public/benchmarks). PerformanceMonitor can only downgrade from here at runtime.
 */
export async function detectQuality(): Promise<DetectionResult> {
  if (!hasWebGL2()) return { tier: null, isMobile: false, gpu: 'none' };

  try {
    const result = await getGPUTier({ benchmarksURL: '/benchmarks' });
    const isMobile = result.isMobile ?? false;
    const gpu = result.gpu ?? 'unknown';
    // detect-gpu tier 0 = blocklisted or unsupported.
    if (result.tier === 0) return { tier: null, isMobile, gpu };

    let tier: QualityTier = result.tier >= 3 ? 'high' : result.tier === 2 ? 'medium' : 'low';
    if (isMobile && tier === 'high') tier = 'medium';
    return { tier, isMobile, gpu };
  } catch {
    // Benchmarks unreachable: WebGL works, so start conservatively and let the monitor decide.
    return { tier: 'medium', isMobile: false, gpu: 'unknown' };
  }
}
