import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useAppStore } from '@/lib/store';
import { clamp, damp } from '@/lib/utils';

/**
 * Single-clock scroll pipeline:
 *   gsap.ticker (the only requestAnimationFrame)
 *     1. Lenis.raf()            → smooth scroll position
 *     2. ScrollTrigger.update() → the master journey timeline (scrub: 1, ease 'none')
 *     3. store.setScroll()      → scrubbed journey progress + scroll velocity
 *     4. R3F advance()          → one render (registered by <FrameDriver/>, runs after)
 * Everything (camera, shaders, rail, DOM fades) reads the same scrubbed progress.
 * With reduced motion there is no Lenis: native scroll, no scroll-jacking.
 */

export interface ScrollController {
  lenis: Lenis | null;
  /** Scroll to a journey progress value in 0 → 1. */
  scrollToProgress: (progress: number, immediate?: boolean) => void;
  stop: () => void;
  start: () => void;
  destroy: () => void;
}

/** px/second that maps to |velocity| = 1. */
const VELOCITY_FULL_SCALE = 4000;
const VELOCITY_DAMPING = 8;

let controller: ScrollController | null = null;

export function getScroll(): ScrollController | null {
  return controller;
}

function maxScroll(): number {
  return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
}

export function createScroll(options: { reducedMotion: boolean }): ScrollController {
  controller?.destroy();
  gsap.registerPlugin(ScrollTrigger);

  const lenis = options.reducedMotion
    ? null
    : new Lenis({ autoRaf: false, lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.2 });

  lenis?.on('scroll', ScrollTrigger.update);

  const setScroll = useAppStore.getState().setScroll;
  let lastY = window.scrollY;
  let velocity = 0;
  let lastVelocity = Number.NaN;

  // The one master timeline. Camera flight never uses onEnter/onLeave, which snap.
  const journey = { value: 0 };
  const master = gsap.timeline({
    scrollTrigger: { start: 0, end: 'max', scrub: options.reducedMotion ? true : 1 },
    onUpdate: () => setScroll(journey.value, velocity),
  });
  master.to(journey, { value: 1, ease: 'none', duration: 1 });

  const tick = (time: number, deltaMs: number): void => {
    lenis?.raf(time * 1000);

    const dt = Math.max(deltaMs, 1) / 1000;
    const y = lenis ? lenis.scroll : window.scrollY;
    const raw = clamp((y - lastY) / dt / VELOCITY_FULL_SCALE, -1, 1);
    lastY = y;
    velocity = damp(velocity, raw, VELOCITY_DAMPING, dt);
    if (Math.abs(velocity) < 1e-4) velocity = 0;

    if (velocity !== lastVelocity) {
      lastVelocity = velocity;
      setScroll(journey.value, velocity);
    }
  };

  // prioritize = true: runs before every other ticker listener, including the R3F render.
  gsap.ticker.add(tick, false, true);
  gsap.ticker.lagSmoothing(0);

  const refresh = (): void => ScrollTrigger.refresh();
  void document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });

  const instance: ScrollController = {
    lenis,
    scrollToProgress(progress, immediate = false) {
      const target = clamp(progress, 0, 1) * maxScroll();
      if (lenis) lenis.scrollTo(target, { immediate, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else window.scrollTo({ top: target, behavior: 'auto' });
    },
    stop() {
      // Without Lenis (reduced motion) lock the document directly.
      if (lenis) lenis.stop();
      else document.documentElement.style.overflow = 'hidden';
    },
    start() {
      if (lenis) lenis.start();
      else document.documentElement.style.overflow = '';
    },
    destroy() {
      gsap.ticker.remove(tick);
      master.scrollTrigger?.kill();
      master.kill();
      window.removeEventListener('load', refresh);
      lenis?.destroy();
      if (controller === instance) controller = null;
    },
  };

  controller = instance;
  return instance;
}
