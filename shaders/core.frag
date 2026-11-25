uniform vec3 uSignal;
uniform vec3 uPulseColor;
uniform vec3 uDeep;
uniform float uPulse;
uniform float uReveal;

varying vec3 vNormal;
varying vec3 vView;
varying float vDisplace;
varying float vRipple;

void main() {
  float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.2);
  vec3 col = mix(uDeep, uPulseColor, smoothstep(-0.08, 0.14, vDisplace) * (0.45 + uPulse * 0.3));
  col += uSignal * (fresnel * 1.4 + vRipple * 1.2);
  gl_FragColor = vec4(col * uReveal, 1.0);
  #include <colorspace_fragment>
}
