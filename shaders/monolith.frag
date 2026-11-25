// Glassy column: fresnel edges, a vertical gradient and a lit cap.
uniform vec3 uBase;
uniform vec3 uSignal;
uniform float uReveal;

varying vec3 vNormal;
varying vec3 vView;
varying float vY;
varying float vSeed;

void main() {
  float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.5);
  float cap = step(0.9, vNormal.y);
  vec3 col = mix(uBase, uSignal, 0.15 + vY * 0.35);
  col += uSignal * (fresnel * 0.9 + cap * 0.8);
  float alpha = (0.35 + fresnel * 0.5 + cap * 0.4 + vY * 0.15) * uReveal;
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}
