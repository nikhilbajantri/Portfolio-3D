uniform float uTime;
uniform float uReveal;      // 0 → 1: traces draw outward along their paths
uniform float uIntensity;   // overall fade
uniform float uMaxDist;
uniform vec2 uCursor;       // cursor on the chip plane, chip-local xz
uniform float uCursorActive;
uniform vec3 uBase;
uniform vec3 uSignal;
uniform vec3 uPulse;

varying vec2 vLocal;
varying float vLen;
varying float vPathDist;
varying vec2 vPos;
varying float vSeed;
varying float vWidth;

void main() {
  // Capsule SDF around the segment.
  float s = clamp(vLocal.x, 0.0, vLen);
  float d = length(vec2(vLocal.x - s, vLocal.y)) - vWidth * 0.5;
  float aa = fwidth(d);
  float core = 1.0 - smoothstep(-aa, aa, d);
  float glow = exp(-max(d, 0.0) / (vWidth * 0.9));

  // Draw-on: only the first uReveal of every path is lit.
  float drawn = smoothstep(0.0, 0.02, uReveal * uMaxDist - vPathDist);

  // Data dashes travelling outward along each path.
  float dash = smoothstep(0.9, 1.0, fract(vPathDist * 5.0 - uTime * (0.35 + vSeed * 0.5)));

  // Rings pulsing outward from the cursor, visible only where traces are.
  float cd = distance(vPos, uCursor);
  float ring = smoothstep(0.7, 1.0, sin(cd * 36.0 - uTime * 7.0)) * exp(-cd * 2.8) * uCursorActive;

  float energy = clamp(dash * 0.8 + ring, 0.0, 1.0);
  vec3 col = mix(uBase, uSignal, energy);
  col = mix(col, uPulse, ring * 0.4 * vSeed);

  float alpha = (core * (0.55 + energy) + glow * energy * 0.6) * drawn * uIntensity;
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}
