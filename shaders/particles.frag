uniform vec3 uColor;
uniform vec3 uAccent;

varying float vAlpha;
varying float vHeat;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.05, d) * vAlpha;
  gl_FragColor = vec4(mix(uColor, uAccent, clamp(vHeat, 0.0, 1.0)), a);
  #include <colorspace_fragment>
}
