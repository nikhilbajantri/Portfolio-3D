uniform float uMorph;
uniform float uReveal;
uniform vec2 uGrid;        // grid cells across uv
uniform vec3 uLine;
uniform vec3 uSignal;
uniform vec3 uPulse;

varying vec2 vUv;
varying float vHeight;
varying float vRidge;

void main() {
  // Anti-aliased grid lines.
  vec2 coord = vUv * uGrid;
  vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
  float line = 1.0 - min(min(grid.x, grid.y), 1.0);

  // Fade the edges of the field into the dark.
  vec2 e = min(vUv, 1.0 - vUv);
  float vignette = smoothstep(0.0, 0.18, min(e.x, e.y));

  vec3 col = uLine * (0.25 + line * 0.9) + uSignal * max(vHeight, 0.0) * 0.6 * (1.0 - uMorph);
  // B: the price ridge glows faintly, pulse at its base rising to signal at its crest.
  float ridge = vRidge * uMorph * smoothstep(0.0, 0.3, vHeight);
  col = mix(col, mix(uPulse, uSignal, smoothstep(0.05, 0.35, vHeight)), ridge * 0.6);

  float alpha = (0.06 + line * 0.55 + ridge * 0.25) * vignette * uReveal;
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}
