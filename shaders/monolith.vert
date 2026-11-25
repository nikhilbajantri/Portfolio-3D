// Regression monoliths: unit boxes (base at y = 0) stretched to aHeight × uRise.
attribute vec3 aOffset;
attribute float aHeight;
attribute float aSeed;

uniform float uRise;

varying vec3 vNormal;
varying vec3 vView;
varying float vY;        // 0 at base, 1 at top
varying float vSeed;

void main() {
  float rise = clamp((uRise - aSeed * 0.25) / 0.75, 0.0, 1.0);
  rise = 1.0 - pow(1.0 - rise, 3.0);
  vec3 p = position;
  vY = p.y + 0.5;
  p.y = vY * aHeight * rise;
  vec4 world = modelMatrix * vec4(p + aOffset, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  vSeed = aSeed;
  gl_Position = projectionMatrix * viewMatrix * world;
}
