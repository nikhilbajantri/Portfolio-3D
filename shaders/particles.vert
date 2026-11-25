// Particle title. Each point flies from aStart to its glyph sample (position),
// shimmers, is pushed away by the cursor and disperses with scroll.
uniform float uTime;
uniform float uAssemble;   // 0 → 1 intro
uniform float uScatter;    // 0 → 1 as BOOT scrolls away
uniform float uVelocity;   // −1 → 1 scroll velocity
uniform float uSize;
uniform float uPixelRatio;
uniform vec2 uMouse;       // cursor on the title plane, local space
uniform float uMouseRadius;
uniform float uMouseStrength;

attribute vec3 aStart;
attribute float aSeed;

varying float vAlpha;
varying float vHeat;

void main() {
  // Staggered ease-out-cubic arrival.
  float t = clamp((uAssemble - aSeed * 0.35) / 0.65, 0.0, 1.0);
  t = 1.0 - pow(1.0 - t, 3.0);
  vec3 p = mix(aStart, position, t);

  // Idle shimmer keeps the title alive without moving its silhouette.
  p.xy += vec2(sin(uTime * 1.3 + aSeed * 40.0), cos(uTime * 1.1 + aSeed * 31.0)) * 0.0035;

  // Soft cursor repulsion.
  vec2 d = p.xy - uMouse;
  float dist = length(d);
  float heat = smoothstep(uMouseRadius, 0.0, dist) * uMouseStrength;
  p.xy += (d / max(dist, 1e-4)) * heat * 0.28;
  p.z += heat * 0.35;

  // Scroll dispersal back toward each particle's origin, plus depth drift.
  p += (aStart - position) * uScatter * 1.4;
  p.z += uScatter * (1.0 + aSeed * 2.0);

  // Velocity stretch.
  p.y += uVelocity * 0.12 * (aSeed - 0.5);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * uPixelRatio * (1.0 + heat * 1.2) / -mv.z;

  vAlpha = (1.0 - uScatter) * mix(0.55, 1.0, aSeed) * smoothstep(0.0, 0.15, uAssemble);
  vHeat = heat;
}
