uniform sampler2D uMap;
uniform float uFocus;    // 0 → 1: dimmed and desaturated → crisp (hover)
uniform float uReveal;
uniform vec3 uEdge;
uniform vec2 uSize;      // frame size in world units

varying vec2 vUv;

void main() {
  vec4 tex = texture2D(uMap, vUv);
  float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
  vec3 col = mix(vec3(lum) * 0.75, tex.rgb, uFocus);
  col *= mix(0.72, 1.0, uFocus);

  // Hairline edge that lights up with focus.
  vec2 p = vUv * uSize;
  float e = min(min(p.x, uSize.x - p.x), min(p.y, uSize.y - p.y));
  float edge = 1.0 - smoothstep(0.0, 0.012, e);
  col = mix(col, uEdge, edge * mix(0.35, 0.9, uFocus));

  gl_FragColor = vec4(col, uReveal);
  #include <colorspace_fragment>
}
