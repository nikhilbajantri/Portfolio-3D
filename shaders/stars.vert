// Deep-space dust around the machine column. Twinkles, and stretches with scroll velocity.
uniform float uTime;
uniform float uVelocity;
uniform float uPixelRatio;
uniform float uSize;

attribute float aSeed;

varying float vAlpha;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float twinkle = 0.6 + 0.4 * sin(uTime * (0.6 + aSeed * 1.8) + aSeed * 60.0);
  float speed = abs(uVelocity);
  gl_PointSize = uSize * uPixelRatio * (0.6 + aSeed) * (1.0 + speed * 1.5) / -mv.z;
  vAlpha = twinkle * mix(0.25, 0.9, aSeed) * (1.0 + speed);
}
