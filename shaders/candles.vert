// SMC candlesticks: one instance per candle (bodies and wicks are two meshes sharing
// this shader). Each grows open from its midpoint, left to right, as uGrow rises.
attribute float aX;
attribute float aBottom;   // price (already × ridge height)
attribute float aTop;
attribute float aUp;       // 1 bullish, 0 bearish
attribute float aIndex;

uniform float uGrow;
uniform float uCount;
uniform float uWidth;
uniform float uDepth;
uniform float uZ;

varying float vUp;
varying vec3 vNormal;
varying vec3 vView;

void main() {
  float t = clamp(uGrow * 1.35 - (aIndex / uCount) * 0.35, 0.0, 1.0);
  t = 1.0 - pow(1.0 - t, 3.0);
  float height = max(aTop - aBottom, 0.006) * t;
  float mid = (aBottom + aTop) * 0.5;
  vec3 p = position * vec3(uWidth, height, uDepth) + vec3(aX, mid, uZ);

  vec4 world = modelMatrix * vec4(p, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  vUp = aUp;
  gl_Position = projectionMatrix * viewMatrix * world;
}
