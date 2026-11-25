uniform vec3 uBase;
uniform vec3 uSignal;

varying float vAlpha;
varying vec3 vNormal;
varying float vSeed;

void main() {
  float light = 0.35 + 0.65 * abs(dot(vNormal, normalize(vec3(0.3, 0.8, 0.5))));
  vec3 col = mix(uBase, uSignal, 0.15 + 0.45 * vSeed) * light;
  gl_FragColor = vec4(col, vAlpha);
  #include <colorspace_fragment>
}
