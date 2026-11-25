import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { SectionId } from '@/content/data';
import { SECTIONS } from '@/content/data';
import type { QualityTier } from '@/lib/quality';

export type FallbackReason = 'no-webgl' | 'timeout' | 'context-lost';

export interface OverlayState {
  /** Slug of the case study open over the scene, or null. */
  slug: string | null;
}

export interface AppState {
  /** Scroll progress 0 → 1 across the whole journey. Read with getState() inside useFrame. */
  progress: number;
  /** Clamped, normalised scroll velocity −1 → 1. Feeds the uVelocity shader uniform. */
  velocity: number;
  activeSection: SectionId;
  /** Reduced motion: the section whose still camera pose is shown (switched while the canvas is faded out). */
  heldSection: SectionId;
  /** null until GPU detection has run. */
  qualityTier: QualityTier | null;
  soundEnabled: boolean;
  overlay: OverlayState;
  /** True when the 2D Quick view is shown instead of the 3D experience. */
  quickMode: boolean;
  /** Why the 3D path handed over to Quick view, if it did. */
  fallbackReason: FallbackReason | null;
  reducedMotion: boolean;

  /* Boot sequence (Phase 3) */
  /** The three.js chunk has loaded and the Canvas has mounted. */
  canvasMounted: boolean;
  /** drei useProgress, 0 → 1 (1 when nothing needs loading). */
  assetProgress: number;
  /** Assets loaded and every shader program compiled: safe to reveal the scene. */
  sceneReady: boolean;
  /** Title sampling has settled (succeeded or failed), so the scene can be compiled. */
  titleSampled: boolean;
  /** The particle title has taken over from the DOM h1. */
  particleTitle: boolean;
  /** Skill cluster expanded in KERNEL (hovered/focused in 3D or the DOM list). */
  skillFocus: string | null;
  /** Cursor ring label requested by a hovered 3D object (DOM targets use data-cursor). */
  cursorLabel: string | null;

  setScroll: (progress: number, velocity: number) => void;
  setQualityTier: (tier: QualityTier) => void;
  setSoundEnabled: (enabled: boolean) => void;
  openOverlay: (slug: string) => void;
  closeOverlay: () => void;
  setQuickMode: (quick: boolean, reason?: FallbackReason) => void;
  setReducedMotion: (reduced: boolean) => void;
  setCanvasMounted: (mounted: boolean) => void;
  setAssetProgress: (progress: number) => void;
  setSceneReady: (ready: boolean) => void;
  setTitleSampled: (sampled: boolean) => void;
  setParticleTitle: (active: boolean) => void;
  setSkillFocus: (id: string | null) => void;
  setCursorLabel: (label: string | null) => void;
  setHeldSection: (id: SectionId) => void;
}

export function sectionAt(progress: number): SectionId {
  for (const section of SECTIONS) {
    if (progress < section.range[1]) return section.id;
  }
  return 'exit';
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    progress: 0,
    velocity: 0,
    activeSection: 'boot',
    heldSection: 'boot',
    qualityTier: null,
    soundEnabled: false,
    overlay: { slug: null },
    quickMode: false,
    fallbackReason: null,
    reducedMotion: false,
    canvasMounted: false,
    assetProgress: 0,
    sceneReady: false,
    titleSampled: false,
    particleTitle: false,
    skillFocus: null,
    cursorLabel: null,

    setScroll: (progress, velocity) => {
      const activeSection = sectionAt(progress);
      // Only include activeSection when it changes so its subscribers don't re-render per frame.
      if (activeSection !== get().activeSection) set({ progress, velocity, activeSection });
      else set({ progress, velocity });
    },
    setQualityTier: (qualityTier) => set({ qualityTier }),
    setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
    openOverlay: (slug) => set({ overlay: { slug } }),
    closeOverlay: () => set({ overlay: { slug: null } }),
    setQuickMode: (quickMode, reason) => set({ quickMode, fallbackReason: quickMode ? (reason ?? null) : null }),
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    setCanvasMounted: (canvasMounted) => set({ canvasMounted }),
    setAssetProgress: (assetProgress) => set({ assetProgress }),
    setSceneReady: (sceneReady) => set({ sceneReady }),
    setTitleSampled: (titleSampled) => set({ titleSampled }),
    setParticleTitle: (particleTitle) => set({ particleTitle }),
    setSkillFocus: (skillFocus) => set({ skillFocus }),
    setCursorLabel: (cursorLabel) => set({ cursorLabel }),
    setHeldSection: (heldSection) => set({ heldSection }),
  })),
);
