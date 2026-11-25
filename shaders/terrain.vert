// DATA terrain. A flat grid (local xz) displaced by a blend of two heightfields:
//   A: rolling data landscape (Restaurant Rating Prediction)
//   B: a low ridge tracing the candle closes (SMC PRO); the candlesticks themselves
//      are instanced meshes standing above it.
#define CANDLES 40

uniform float uMorph;            // 0 = A, 1 = B
uniform float uTime;
uniform vec4 uCandles[CANDLES];  // open, high, low, close in 0..1
uniform vec2 uRidgeX;            // ridge start x, candle width
uniform vec2 uRidgeZ;            // ridge band centre z, half depth
uniform float uRidgeHeight;

varying vec2 vUv;
varying float vHeight;
varying float vRidge;

/** Ridge height relative to price (it sits under the candles as a soft echo). */
const float RIDGE_SCALE = 0.28;

float landscape(vec2 p) {
  float h = sin(p.x * 1.3 + uTime * 0.15) * 0.08 + sin(p.y * 1.7 - uTime * 0.1) * 0.06;
  h += sin((p.x + p.y) * 2.9) * 0.035 + sin(p.x * 5.3 - p.y * 3.1) * 0.015;
  return h;
}

void main() {
  vUv = uv;
  vec3 p = position;

  float hA = landscape(p.xz);

  // Smoothly interpolate closes between candle centres.
  float fi = (p.x - uRidgeX.x) / uRidgeX.y - 0.5;
  int i0 = int(clamp(floor(fi), 0.0, float(CANDLES - 1)));
  int i1 = int(clamp(floor(fi) + 1.0, 0.0, float(CANDLES - 1)));
  float close = mix(uCandles[i0].w, uCandles[i1].w, smoothstep(0.0, 1.0, fract(fi)));
  float inRange = step(-0.5, fi) * step(fi, float(CANDLES) - 0.5);
  float band = 1.0 - smoothstep(uRidgeZ.y * 0.5, uRidgeZ.y, abs(p.z - uRidgeZ.x));
  float hB = close * uRidgeHeight * RIDGE_SCALE * band * inRange;

  float h = mix(hA, hB, uMorph);
  p.y += h;

  vHeight = h;
  vRidge = band * inRange;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
