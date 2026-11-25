uniform vec3 uSignal;
uniform vec3 uPulse;
uniform float uReveal;
uniform float uWick;       // 1 for the wick mesh (thinner, dimmer)

varying float vUp;
varying vec3 vNormal;
varying vec3 vView;

void main() {
  vec3 base = mix(uPulse, uSignal, vUp);
  vec3 n = normalize(vNormal);
  float light = 0.55 + 0.45 * max(dot(n, normalize(vec3(0.3, 0.8, 0.6))), 0.0);
  float fresnel = pow(1.0 - abs(dot(n, normalize(vView))), 2.0);
  vec3 col = base * light * mix(1.0, 0.7, uWick) + base * fresnel * 0.8;
  gl_FragColor = vec4(col, uReveal * mix(0.95, 0.8, uWick));
  #include <colorspace_fragment>
}
