import { useEffect, useState } from 'react';
import { CanvasTexture, MeshBasicMaterial, SRGBColorSpace } from 'three';

export interface LabelOptions {
  /** CSS color for the text. */
  color: string;
  /** Optional dot drawn before the text (status colour). */
  dot?: string;
  /** Font size in canvas px; the texture is sized to fit. */
  size?: number;
  weight?: 400 | 500;
  /** Optional chip behind the text (CSS colour), for labels over bright geometry. */
  plate?: string;
}

/**
 * Mono, uppercase, tracked label rendered to a texture with the page's own
 * JetBrains Mono, so 3D labels match the DOM's label-mono style without loading
 * a separate font for WebGL text.
 */
export function makeLabelTexture(text: string, options: LabelOptions): { texture: CanvasTexture; aspect: number } {
  const size = options.size ?? 48;
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-jetbrains').trim() || 'monospace';
  const font = `${options.weight ?? 500} ${size}px ${family}`;
  const label = text.toUpperCase();
  const tracking = size * 0.16;
  const dotSpace = options.dot ? size * 0.9 : 0;

  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = font;
  measure.letterSpacing = `${tracking}px`;
  const width = Math.ceil(measure.measureText(label).width + dotSpace + size);
  const height = Math.ceil(size * 1.8);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  ctx.letterSpacing = `${tracking}px`;
  ctx.textBaseline = 'middle';
  if (options.plate) {
    ctx.fillStyle = options.plate;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, size * 0.12);
    ctx.fill();
  }
  if (options.dot) {
    ctx.fillStyle = options.dot;
    ctx.beginPath();
    ctx.arc(size * 0.5 + size * 0.15, height / 2, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = options.color;
  ctx.fillText(label, size * 0.5 + dotSpace, height / 2);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, aspect: width / height };
}

export interface Label {
  material: MeshBasicMaterial;
  aspect: number;
}

/**
 * React hook: builds the label once its webfont has actually loaded (a canvas
 * draws with whatever is available at that moment), and disposes it on unmount.
 * Returns null until then.
 */
export function useLabel(text: string, options: LabelOptions): Label | null {
  const [label, setLabel] = useState<Label | null>(null);
  const { color, dot, size, weight, plate } = options;

  useEffect(() => {
    let cancelled = false;
    let made: Label | null = null;
    const family = getComputedStyle(document.documentElement).getPropertyValue('--font-jetbrains').trim();
    void document.fonts
      .load(`${weight ?? 500} ${size ?? 48}px ${family || 'monospace'}`)
      // A failing fallback face rejects load(); still wait for the real face to settle.
      .catch(() => undefined)
      .then(() => document.fonts.ready)
      .then(() => {
        if (cancelled) return;
        const { texture, aspect } = makeLabelTexture(text, { color, dot, size, weight, plate });
        made = { material: new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0 }), aspect };
        setLabel(made);
      });
    return () => {
      cancelled = true;
      made?.material.map?.dispose();
      made?.material.dispose();
    };
  }, [text, color, dot, size, weight, plate]);

  return label;
}
