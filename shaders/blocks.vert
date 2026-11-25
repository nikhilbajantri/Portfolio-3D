// Modular blocks that fold up out of the die and snap into the browser frames'
// tile grids. All motion is here; the CPU only sets uAssemble / uFade.
attribute vec3 aStart;
attribute vec3 aTarget;
attribute vec2 aSize;     // tile size on the frame
attribute float aSeed;
attribute float aRotY;    // frame yaw

uniform float uAssemble;
uniform float uFade;

varying float vAlpha;
varying vec3 vNormal;
varying float vSeed;

vec3 rotY(vec3 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c);
}

void main() {
  float t = clamp((uAssemble - aSeed * 0.3) / 0.7, 0.0, 1.0);
  float e = t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;

  vec3 scale = mix(vec3(0.05), vec3(aSize * 0.94, 0.03), smoothstep(0.6, 1.0, e));
  float angle = mix(aSeed * 6.2831, aRotY, e);
  vec3 p = rotY(position * scale, angle);
  vec3 c = mix(aStart, aTarget, e);
  c.x += sin(e * 3.14159) * (aSeed - 0.5) * 1.6;

  vNormal = normalize(rotY(normal, angle));
  vAlpha = uFade * smoothstep(0.0, 0.04, uAssemble);
  vSeed = aSeed;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(c + p, 1.0);
}
