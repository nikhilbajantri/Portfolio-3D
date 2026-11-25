// Translucent auth gate: lit frame, faint grid, a scan beam sweeping across the aperture.
uniform vec3 uColor;
uniform float uTime;
uniform float uReveal;
uniform float uIndex;
uniform vec2 uSize;

varying vec2 vUv;

void main() {
  vec2 p = vUv * uSize;
  float e = min(min(p.x, uSize.x - p.x), min(p.y, uSize.y - p.y));
  float frame = 1.0 - smoothstep(0.0, 0.025, e);
  float halo = exp(-e * 9.0) * 0.35;

  // Brighter corner brackets.
  vec2 q = min(p, uSize - p);
  float bracket = step(max(q.x, q.y), 0.28) * (1.0 - smoothstep(0.03, 0.05, e));

  vec2 g = abs(fract(p * 5.0) - 0.5);
  float grid = (1.0 - smoothstep(0.0, 0.03, min(g.x, g.y))) * 0.07;

  float scan = fract(uTime * 0.3 + uIndex * 0.31);
  float beam = exp(-abs(vUv.x - scan) * 70.0);

  float fill = 0.045;
  float energy = frame * 0.9 + bracket * 0.8 + halo + grid + beam * 0.55 + fill;
  gl_FragColor = vec4(uColor * energy, energy * uReveal);
  #include <colorspace_fragment>
}
