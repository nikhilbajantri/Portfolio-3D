export const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Map v from [a, b] to [0, 1], clamped. */
export const remap01 = (v: number, a: number, b: number): number => clamp((v - a) / (b - a), 0, 1);

/** Frame-rate independent exponential damping (same curve as THREE.MathUtils.damp). */
export const damp = (current: number, target: number, lambda: number, dt: number): number =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Read a design token from :root at runtime, so WebGL materials use the same
 * colours as the DOM without hard-coding hex values in components.
 */
export function readToken(name: `--${string}`, fallback = ''): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value === '' ? fallback : value;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function safeStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeStorageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked (private mode, disabled cookies): preference stays in memory only.
  }
}

/**
 * Whether a scene layer should render. Until boot has compiled every shader
 * (sceneReady) everything renders, because compileAsync skips hidden objects;
 * after that a layer only draws inside its journey window.
 */
export function inRenderWindow(progress: number, sceneReady: boolean, range: readonly [number, number]): boolean {
  return !sceneReady || (progress > range[0] && progress < range[1]);
}
