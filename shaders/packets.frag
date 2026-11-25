uniform vec3 uNeutral;
uniform vec3 uSignal;
uniform vec3 uThreat;

varying float vState;
varying float vAlpha;
varying float vFlash;

void main() {
  vec3 col = vState > 1.5 ? uThreat : (vState > 0.5 ? uSignal : uNeutral);
  col *= 1.0 + vFlash * 2.5;
  gl_FragColor = vec4(col, vAlpha);
  #include <colorspace_fragment>
}
